import { readFile } from 'node:fs/promises';
import { UnspscLookup } from './index.js';

export async function loadFromFile(filePath) {
    const buf = await readFile(filePath);
    return new UnspscLookup(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
}

export async function load() {
    return loadFromFile(new URL('./dist/data/unspsc_data.bin', import.meta.url));
}
