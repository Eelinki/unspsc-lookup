import { UnspscLookup } from './index.js';

export function loadFromFile(filePath: string | URL): Promise<UnspscLookup>;
export function load(): Promise<UnspscLookup>;
