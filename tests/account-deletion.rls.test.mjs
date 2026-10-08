import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
const { PGlite } = await import(process.env.GIRSU_TEST_PGLITE_MODULE ?? '@electric-sql/pglite');

test('all migrations: live sessions work; revoked/deleted sessions cannot read or insert personal data', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
      create table auth.sessions (id uuid primary key, user_id uuid references auth.users(id) on delete cascade, not_after timestamptz);
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid(), auth.jwt() to authenticated;
    `);
    const dir = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
      let sql = await readFile(new URL(file, dir), 'utf8');
      // Postgres has gen_random_uuid built in; PGlite does not package pgcrypto.
      sql = sql.replace('create extension if not exists pgcrypto;', '');
      await db.exec(sql);
    }
    const owner = '00000000-0000-4000-8000-000000000001';
    const peer = '00000000-0000-4000-8000-000000000002';
    const session = '10000000-0000-4000-8000-000000000001';
    const peerSession = '10000000-0000-4000-8000-000000000002';
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values
      ($1, 'owner@example.test', '{"name":"Owner","province":"Otra","locality":"Test","school_membership":"no_jujuy_school"}'),
      ($2, 'peer@example.test', '{"name":"Peer","province":"Otra","locality":"Test","school_membership":"no_jujuy_school"}')`,
      [owner, peer],
    );
    await db.query('insert into auth.sessions (id, user_id) values ($1,$2),($3,$4)', [
      session,
      owner,
      peerSession,
      peer,
    ]);
    await db.query(
      `insert into public.game_results (user_id, stage_id, score) values ($1,'separacion-origen',1), ($2,'separacion-origen',2)`,
      [owner, peer],
    );
    const catalogs = await db.query(
      'select (select count(*) from schools)::int schools, (select count(*) from jujuy_localities)::int localities',
    );
    async function claims(sub, sessionId) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims', $1, false)", [
        JSON.stringify({ sub, session_id: sessionId }),
      ]);
      await db.exec('set role authenticated');
    }
    async function visible(table) {
      return (await db.query(`select count(*)::int n from public.${table}`)).rows[0].n;
    }
    await claims(owner, session);
    assert.equal(await visible('profiles'), 1);
    assert.equal(await visible('public_profiles'), 2);
    assert.equal(await visible('game_results'), 2);
    assert.equal(await visible('leaderboard'), 2);
    await claims(owner, peerSession);
    for (const table of ['profiles', 'public_profiles', 'game_results', 'leaderboard'])
      assert.equal(await visible(table), 0);
    await claims(owner, 'malformed');
    assert.equal(await visible('game_results'), 0);
    await claims(owner, undefined);
    assert.equal(await visible('public_profiles'), 0);
    await db.exec('reset role');
    await db.query(
      "update auth.sessions set not_after = now() - interval '1 second' where id = $1",
      [session],
    );
    await claims(owner, session);
    assert.equal(await visible('profiles'), 0);
    await db.exec('reset role');
    await db.query('update auth.sessions set not_after = null where id = $1', [session]);
    await db.query('delete from auth.sessions where user_id = $1', [owner]);
    await claims(owner, session);
    for (const table of ['profiles', 'public_profiles', 'game_results', 'leaderboard'])
      assert.equal(await visible(table), 0);
    await assert.rejects(
      db.query(
        `insert into public.game_results (user_id, stage_id, score) values ($1,'compostaje-domiciliario',1)`,
        [owner],
      ),
      /row-level security/i,
    );
    await db.exec('reset role');
    await db.query('delete from auth.users where id = $1', [owner]);
    for (const [table, field] of [
      ['profiles', 'id'],
      ['public_profiles', 'user_id'],
      ['game_results', 'user_id'],
    ]) {
      assert.equal(
        (await db.query(`select count(*)::int n from public.${table} where ${field} = $1`, [owner]))
          .rows[0].n,
        0,
      );
    }
    assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n, 1);
    const after = await db.query(
      'select (select count(*) from schools)::int schools, (select count(*) from jujuy_localities)::int localities',
    );
    assert.deepEqual(after.rows, catalogs.rows);
    await claims(owner, session);
    assert.equal(await visible('leaderboard'), 0);
    await claims(peer, peerSession);
    assert.equal(await visible('leaderboard'), 1);
    assert.equal(await visible('profiles'), 1);
  } finally {
    await db.close();
  }
});
