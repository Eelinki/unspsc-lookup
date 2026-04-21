export class UnspscLookup {
    constructor(data) {
        const bytes = data instanceof Uint8Array
            ? data
            : new Uint8Array(data);

        const { buffer, byteOffset, byteLength } = bytes;
        const view = new DataView(buffer, byteOffset, byteLength);

        const totalRows = view.getUint32(0, true);
        const headerSize = 16;

        const codesByteOffset = byteOffset + headerSize;
        const offsetsByteOffset = codesByteOffset + (totalRows * 4);

        this.codes = new Uint32Array(buffer, codesByteOffset, totalRows);
        this.offsets = new Uint32Array(buffer, offsetsByteOffset, totalRows + 1);

        const stringStart = headerSize + (totalRows * 4) + ((totalRows + 1) * 4);
        this.descriptions = bytes.subarray(stringStart);

        this.decoder = new TextDecoder('utf-8');
    }

    findCode(targetCode) {
        let paddedCode = targetCode;
        const length = Math.floor(Math.log10(targetCode)) + 1;

        if (length < 8) {
            paddedCode = targetCode * Math.pow(10, 8 - length);
        }

        let low = 0;
        let high = this.codes.length - 1;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const val = this.codes[mid];

            if (val === paddedCode) {
                return this.#formatResult(mid);
            }
            if (val < paddedCode) low = mid + 1;
            else high = mid - 1;
        }
        return null;
    }

    #formatResult(index) {
        const start = this.offsets[index];
        const end = this.offsets[index + 1];
        return {
            code: this.codes[index],
            description: this.decoder.decode(this.descriptions.subarray(start, end))
        };
    }
}
