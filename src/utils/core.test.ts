import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import JSZip from 'jszip';
import { detectCrisisSignals } from './safety';
import { getSupportMode, SUPPORT_MODES } from './promptEngine';
import { buildProjectZipBuffer, listProjectFiles } from './projectZip';

test('safety detector flags acute crisis intent and leaves everyday stress as none', () => {
  const crisis = detectCrisisSignals('I feel hopeless and want to hurt myself tonight.');
  assert.equal(crisis.level, 'crisis');
  assert.ok(crisis.matchedSignals.includes('self-harm intent'));

  const elevated = detectCrisisSignals('My chest is tight and I feel completely overwhelmed.');
  assert.equal(elevated.level, 'elevated');
  assert.ok(elevated.matchedSignals.length > 0);

  const normal = detectCrisisSignals('I am preparing for my first junior Python interview.');
  assert.equal(normal.level, 'none');
  assert.equal(normal.matchedSignals.length, 0);
});

test('MindMate support modes use MindMate identity and non-diagnostic boundaries', () => {
  assert.equal(SUPPORT_MODES.length, 3);
  for (const mode of SUPPORT_MODES) {
    assert.ok(mode.systemInstruction.includes('MindMate'));
    assert.ok(mode.systemInstruction.includes('988'));
  }
  assert.equal(getSupportMode('cbt').id, 'cbt');
  assert.equal(getSupportMode('unknown').id, 'empathetic');
});

test('project zip builder packages React, Node, Python modules, and README cleanly', async () => {
  const rootDir = path.resolve(process.cwd());
  const files = listProjectFiles(rootDir);

  assert.ok(files.includes('README.md'));
  assert.ok(files.includes('server.ts'));
  assert.ok(files.includes('package.json'));
  assert.ok(files.includes('src/App.tsx'));
  assert.ok(files.includes('python/mindmate.py'));
  assert.ok(files.includes('python/prompts.py'));
  assert.ok(files.includes('python/safety.py'));
  assert.ok(files.includes('python/test_mindmate.py'));
  assert.ok(files.includes('python/requirements.txt'));
  assert.equal(
    files.some(
      (f) =>
        f === '.env' ||
        f === 'metadata.json' ||
        f === 'bun.lock' ||
        f.startsWith('node_modules/') ||
        f.startsWith('public/')
    ),
    false
  );

  const buffer = await buildProjectZipBuffer(rootDir);
  assert.ok(buffer.length > 1000);

  const loaded = await JSZip.loadAsync(buffer);
  assert.ok(loaded.file('mindmate-project/README.md'));
  assert.ok(loaded.file('mindmate-project/python/mindmate.py'));
  assert.ok(loaded.file('mindmate-project/python/prompts.py'));
  assert.ok(loaded.file('mindmate-project/python/safety.py'));
  assert.ok(loaded.file('mindmate-project/python/test_mindmate.py'));
  assert.ok(loaded.file('mindmate-project/server.ts'));
  assert.equal(loaded.file('mindmate-project/.env'), null);
  assert.equal(loaded.file('mindmate-project/metadata.json'), null);
});
