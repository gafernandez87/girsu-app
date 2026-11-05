import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/core/scoring.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});
const module = { exports: {} };
runInNewContext(outputText, { module, exports: module.exports });
const { sanitizeStageScore } = module.exports;

test('preserves scores above 1000 and keeps players distinct', () => {
  assert.equal(sanitizeStageScore(1250), 1250);
  assert.equal(sanitizeStageScore(2500), 2500);
  assert.ok(sanitizeStageScore(2500) > sanitizeStageScore(1250));
});

test('keeps scores nonnegative and rounds fractional values', () => {
  assert.equal(sanitizeStageScore(-30), 0);
  assert.equal(sanitizeStageScore(1250.6), 1251);
});
