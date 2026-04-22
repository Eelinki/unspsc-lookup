import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, loadFromFile } from '../node.js';
import { UnspscLookup } from '../index.js';

const dataPath = fileURLToPath(new URL('../dist/data/unspsc_data.bin', import.meta.url));
const hasData = existsSync(dataPath);

test('load() returns a UnspscLookup from bundled data', { skip: !hasData && 'build data missing' }, async () => {
    const lookup = await load();
    assert.ok(lookup instanceof UnspscLookup);
    assert.ok(lookup.codes.length > 0);
});

test('loadFromFile() reads a given path', { skip: !hasData && 'build data missing' }, async () => {
    const lookup = await loadFromFile(dataPath);
    assert.ok(lookup instanceof UnspscLookup);
    const first = lookup.codes[0];
    const r = lookup.findCode(first);
    assert.equal(r.code, first);
    assert.equal(typeof r.description, 'string');
});
