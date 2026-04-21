# unspsc-lookup

Fast, zero-dependency UNSPSC code lookup. Ships a compact binary blob and a small runtime that does O(log n) lookups via binary search over a typed-array index.

Works in Node and the browser.

## Install

```sh
npm install unspsc-lookup
```

## Usage

### Node

```js
import { load } from 'unspsc-lookup/node';

const lookup = await load();
lookup.findCode(43211700);
// → { code: 43211700, description: 'Computer data input devices' }
```

Other Node helpers:

```js
import { loadFromFile } from 'unspsc-lookup/node';

const lookup = await loadFromFile('/custom/path/unspsc_data.bin');
```

### Any environment

Pass the data blob as a `Uint8Array`:

```js
import { UnspscLookup } from 'unspsc-lookup';

const lookup = new UnspscLookup(bytes);
lookup.findCode(43211700);
```

## API

### `new UnspscLookup(bytes)`

`bytes` is a `Uint8Array` or `ArrayBuffer` containing the packed data blob.

### `lookup.findCode(code)`

Returns `{ code, description }` or `null`. Accepts codes at any UNSPSC level (2/4/6/8 digits); shorter codes are right-padded with zeros and looked up as exact matches against the stored segment/family/class/commodity rows.

```js
lookup.findCode(43211700); // commodity
lookup.findCode(432117);   // class    → looked up as 43211700
lookup.findCode(4321);     // family   → looked up as 43210000
lookup.findCode(43);       // segment  → looked up as 43000000
```

Returns `null` if no row exists at that exact padded code.

## Entry points

| Import                    | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `unspsc-lookup`              | Pure `UnspscLookup` class (any env)     |
| `unspsc-lookup/node`         | Node helpers: `load`, `loadFromFile`     |
| `unspsc-lookup/data`         | Raw `.bin` asset path for bundlers      |

## Building the data blob

The blob is generated from the UNGM UNSPSC spreadsheet:

```sh
npm run build
```

Output: `dist/data/unspsc_data.bin`.

## License

MIT
