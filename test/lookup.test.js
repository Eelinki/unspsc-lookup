import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UnspscLookup } from '../index.js';

function buildBlob(entries) {
    const sorted = [...entries].sort((a, b) => a.code - b.code);
    const totalRows = sorted.length;

    const codes = new Uint32Array(totalRows);
    const offsets = new Uint32Array(totalRows + 1);
    const encoder = new TextEncoder();
    const chunks = [];
    let byteOffset = 0;

    for (let i = 0; i < totalRows; i++) {
        const chunk = encoder.encode(sorted[i].description);
        codes[i] = sorted[i].code;
        offsets[i] = byteOffset;
        chunks.push(chunk);
        byteOffset += chunk.byteLength;
    }
    offsets[totalRows] = byteOffset;

    const header = new Uint32Array([totalRows, 16, 0, 0]);
    const descriptions = new Uint8Array(byteOffset);
    let pos = 0;
    for (const c of chunks) { descriptions.set(c, pos); pos += c.byteLength; }

    const total = header.byteLength + codes.byteLength + offsets.byteLength + descriptions.byteLength;
    const out = new Uint8Array(total);
    let o = 0;
    out.set(new Uint8Array(header.buffer), o); o += header.byteLength;
    out.set(new Uint8Array(codes.buffer), o); o += codes.byteLength;
    out.set(new Uint8Array(offsets.buffer), o); o += offsets.byteLength;
    out.set(descriptions, o);
    return out;
}

const fixture = [
    { code: 10000000, description: 'Live Plant and Animal Material' },
    { code: 43211500, description: 'Computers' },
    { code: 43211507, description: 'Notebook computers' },
    { code: 50192100, description: 'Café products' },
];

test('finds exact 8-digit code', () => {
    const lookup = new UnspscLookup(buildBlob(fixture));
    const r = lookup.findCode(43211507);
    assert.deepEqual(r, { code: 43211507, description: 'Notebook computers' });
});

test('returns null for missing code', () => {
    const lookup = new UnspscLookup(buildBlob(fixture));
    assert.equal(lookup.findCode(99999999), null);
});

test('pads shorter codes by multiplying up to 8 digits', () => {
    const lookup = new UnspscLookup(buildBlob(fixture));
    // 432115 -> 43211500
    const r = lookup.findCode(432115);
    assert.deepEqual(r, { code: 43211500, description: 'Computers' });
    // 10 -> 10000000
    const r2 = lookup.findCode(10);
    assert.equal(r2.code, 10000000);
});

test('decodes utf-8 descriptions', () => {
    const lookup = new UnspscLookup(buildBlob(fixture));
    const r = lookup.findCode(50192100);
    assert.equal(r.description, 'Café products');
});

test('accepts ArrayBuffer input', () => {
    const u8 = buildBlob(fixture);
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    const lookup = new UnspscLookup(ab);
    assert.equal(lookup.findCode(43211507).description, 'Notebook computers');
});

test('works with 4-byte aligned offset Uint8Array view', () => {
    const inner = buildBlob(fixture);
    const padded = new Uint8Array(inner.byteLength + 8);
    padded.set(inner, 8);
    const view = padded.subarray(8);
    const lookup = new UnspscLookup(view);
    assert.equal(lookup.findCode(43211507).description, 'Notebook computers');
});
