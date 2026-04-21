import { mkdir, writeFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';

const sourceUrl = new URL('./data/unspsc_source.xlsx', import.meta.url);
const outDirUrl = new URL('./dist/data/', import.meta.url);
const outFileUrl = new URL('unspsc_data.bin', outDirUrl);

async function build() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(sourceUrl.pathname);

    const worksheet = workbook.worksheets[0];

    const headerRow = worksheet.getRow(1).values;
    const headers = {};
    headerRow.forEach((name, i) => {
        if (name) headers[name] = i;
    });

    const keyIdx = headers['Key'];
    const parentIdx = headers['Parent key'];
    const codeIdx = headers['Code'];
    const titleIdx = headers['Title'];

    const data = [];
    for (let r = 12; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r).values;
        if (!row || !row[codeIdx]) continue;
        data.push({
            key: parseInt(row[keyIdx], 10),
            parent: parseInt(row[parentIdx], 10),
            code: parseInt(row[codeIdx], 10),
            title: row[titleIdx]
        });
    }

    data.sort((a, b) => a.code - b.code);

    const totalRows = data.length;

    const codeBuffer = new Uint32Array(totalRows);
    const offsetBuffer = new Uint32Array(totalRows + 1);
    const descriptionChunks = new Array(totalRows);

    let currentByteOffset = 0;

    for (let i = 0; i < totalRows; i++) {
        const row = data[i];
        const chunk = Buffer.from(row.title || "", 'utf8');

        codeBuffer[i] = row.code;
        offsetBuffer[i] = currentByteOffset;
        descriptionChunks[i] = chunk;
        currentByteOffset += chunk.byteLength;
    }

    offsetBuffer[totalRows] = currentByteOffset;

    await mkdir(outDirUrl, { recursive: true });

    const descriptionBuffer = Buffer.concat(descriptionChunks, currentByteOffset);

    const headerSize = 4 * 4;
    const codesByteLength = codeBuffer.byteLength;
    const offsetsByteLength = offsetBuffer.byteLength;

    const header = new Uint32Array([
        totalRows,
        headerSize,
        headerSize + codesByteLength,
        headerSize + codesByteLength + offsetsByteLength
    ]);

    const blob = Buffer.concat([
        Buffer.from(header.buffer),
        Buffer.from(codeBuffer.buffer),
        Buffer.from(offsetBuffer.buffer),
        descriptionBuffer
    ]);

    await writeFile(outFileUrl, blob);

    console.log(`Build Complete: Processed ${totalRows} rows.`);
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
