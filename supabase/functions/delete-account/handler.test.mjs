import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAccountDeletionHandler } from './handler.ts';

function fixture(overrides = {}) {
  const calls = [];
  const backend = {
    async getUser(token) {
      calls.push(['user', token]);
      return { id: 'owner', email: 'owner@example.test' };
    },
    async verifyPassword(email, password) {
      calls.push(['password', email, password]);
      return { id: 'owner', accessToken: 'fresh-token' };
    },
    async revokeSessions(token, scope) {
      calls.push(['revoke', token, scope]);
    },
    async deleteUser(id) {
      calls.push(['delete', id]);
    },
    ...overrides,
  };
  return { handle: createAccountDeletionHandler(backend), calls };
}

function request(
  body = { password: 'secret with spaces ', confirmation: true },
  headers = { Authorization: 'Bearer token' },
) {
  return new Request('https://example.test/delete-account', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

test('preflight and unsupported methods cannot touch an account', async () => {
  const { handle, calls } = fixture();
  assert.equal(
    (await handle(new Request('https://example.test', { method: 'OPTIONS' }))).status,
    204,
  );
  assert.equal((await handle(new Request('https://example.test'))).status, 405);
  assert.deepEqual(calls, []);
});

test('missing authorization, malformed JSON, missing confirmation and supplied target IDs are rejected', async () => {
  const { handle, calls } = fixture();
  assert.equal((await handle(request(undefined, {}))).status, 401);
  assert.equal(
    (
      await handle(
        new Request('https://example.test', {
          method: 'POST',
          headers: { Authorization: 'Bearer token' },
          body: '{',
        }),
      )
    ).status,
    400,
  );
  for (const body of [
    null,
    [],
    { password: 'secret' },
    { password: 'secret', confirmation: false },
    { password: 'secret', confirmation: true, id: 'victim' },
    { password: 'secret', confirmation: true, email: 'victim@example.test' },
  ]) {
    assert.equal((await handle(request(body))).status, 400);
  }
  assert.deepEqual(calls, []);
});

test('expired session and incorrect password never delete or revoke existing sessions', async () => {
  const expired = fixture({ getUser: async () => null });
  assert.equal((await expired.handle(request())).status, 401);
  assert.deepEqual(expired.calls, []);
  const wrong = fixture({ verifyPassword: async () => null });
  assert.equal((await wrong.handle(request())).status, 403);
  assert.deepEqual(
    wrong.calls.map((c) => c[0]),
    ['user'],
  );
});

test('a different verified identity cannot be deleted; only its new verification session is closed', async () => {
  const { handle, calls } = fixture({
    verifyPassword: async () => ({ id: 'different', accessToken: 'different-token' }),
  });
  assert.equal((await handle(request())).status, 403);
  assert.deepEqual(calls, [
    ['user', 'token'],
    ['revoke', 'different-token', 'local'],
  ]);
});

test('verified owner is deleted only after global revocation; password is not trimmed or returned', async () => {
  const { handle, calls } = fixture();
  const response = await handle(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(calls, [
    ['user', 'token'],
    ['password', 'owner@example.test', 'secret with spaces '],
    ['revoke', 'fresh-token', 'global'],
    ['delete', 'owner'],
  ]);
});

test('revocation failure blocks deletion and provider details are not disclosed', async () => {
  const { handle, calls } = fixture({
    revokeSessions: async () => {
      throw new Error('internal credential');
    },
  });
  const response = await handle(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /internal credential/);
  assert.ok(!calls.some((c) => c[0] === 'delete'));
});

test('delete failure never produces a success confirmation', async () => {
  const { handle } = fixture({
    deleteUser: async () => {
      throw new Error('database failed');
    },
  });
  const response = await handle(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, undefined);
});
