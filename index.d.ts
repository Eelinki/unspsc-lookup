export interface UnspscEntry {
    code: number;
    description: string;
}

export class UnspscLookup {
    constructor(data: Uint8Array | ArrayBuffer);
    findCode(targetCode: number): UnspscEntry | null;
}
