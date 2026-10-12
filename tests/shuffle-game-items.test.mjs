import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Load the pure TypeScript rules and real catalogs without starting Angular or building the app.
const modules = new Map();
function loadTypeScript(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (name) => loadTypeScript(path.resolve(path.dirname(filename), `${name}.ts`)),
    },
    { filename },
  );
  return module.exports;
}

const core = fileURLToPath(new URL('../src/app/core/', import.meta.url));
const { shuffleGameItems } = loadTypeScript(path.join(core, 'shuffle-game-items.ts'));
const { GAME_STAGES } = loadTypeScript(path.join(core, 'app-content.ts'));

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function verifyDeck(input, output) {
  assert.equal(output.length, input.length);
  assert.deepEqual(
    Array.from(output, (item) => item.id).sort(),
    Array.from(input, (item) => item.id).sort(),
  );
  assert.ok(
    output.every((item) => input.includes(item)),
    'preserve original item objects',
  );

  for (let index = 2; index < output.length; index += 1) {
    const category = output[index].category;
    if (output[index - 1].category === category && output[index - 2].category === category) {
      assert.ok(
        output.slice(index).every((item) => item.category === category),
        'three consecutive categories are allowed only after all alternatives are exhausted',
      );
    }
  }
}

for (const stage of GAME_STAGES.slice(0, 2)) {
  test(`${stage.id}: mix the real deck, preserve all items and limit category streaks`, () => {
    const input = Object.freeze([...stage.items]);
    const originalOrder = input.map((item) => item.id);
    const orders = new Set();
    for (let seed = 1; seed <= 250; seed += 1) {
      const output = shuffleGameItems(input, seededRandom(seed));
      verifyDeck(input, output);
      orders.add(Array.from(output, (item) => item.id).join(','));
    }
    assert.ok(orders.size > 1, 'different random seeds produce different item orders');
    assert.deepEqual(
      input.map((item) => item.id),
      originalOrder,
      'leave the catalog unchanged',
    );
  });
}

test('empty, short, single-category and strongly unbalanced decks always finish without losing items', () => {
  for (const categories of [
    [],
    ['a'],
    ['a', 'b'],
    ['a', 'a', 'a', 'a'],
    [...Array(20).fill('a'), 'b', 'c'],
  ]) {
    const input = Object.freeze(categories.map((category, id) => Object.freeze({ id, category })));
    for (const random of [() => 0, () => 0.999999, seededRandom(42)]) {
      verifyDeck(input, shuffleGameItems(input, random));
    }
  }
});

test('a grouped deck is repaired even when the initial random shuffle leaves it in place', () => {
  const input = 'aaaabbbbcccc'.split('').map((category, id) => ({ id, category }));
  verifyDeck(
    input,
    shuffleGameItems(input, () => 0.999999),
  );
});
