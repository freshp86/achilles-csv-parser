# achilles-csv-parser
A minimal and fast CSV parser for Node.js or a web browser, **without any
dependencies**. Satisfies the following requirements:

1. Parses files adhering to the CSV format as defined in
   [RFC 4180](https://tools.ietf.org/html/rfc4180#section-2), nothing more and
   nothing less.
2. Runs both in a web browser and in [Node.js](https://nodejs.org/).
3. Can handle large files reasonably well, with good memory and speed
   performance.

If you are curious about the story behind `achilles-csv-parser`, have a look at
[this blog post](https://freshp86.github.io/blog/?post=achilles-csv-parser-a-minimal-csv-parser-in-javascript)
documenting how and why it came to existence.

## Demo: Online client-side CSV to JSON converter tool

If you want to quickly test `achilles-csv-parser` with various inputs, or just
need an **easy-to-use, 100% private online CSV to JSON converter**, you should
use [Achilles CSV to JSON Converter](https://freshp86.github.io/achilles-csv-parser/),
which was created to showcase `achilles-csv-parser`.

## API reference
`achilles-csv-parser` API is inspired by the native
[JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Syntax)
API. It consists of a single public `parse()` function with the following
signature.

```ts
parse(text: string, reviver?: (key: string, value: string) => any): Array<Object>
```

The API is kept purposefully very small, and there is no desire to add bells and
whistles (streaming parsing, events, reading/writing directly from/to files) in
future versions.

## Example usage

There is no command line interface. The tool can only be invoked
programmatically as shown below.

Basic usage (without a reviver function)
```js
import {parse} from './node_modules/achilles-csv-parser/dist/esm/parser.min.js';

const csv = `
column1,column2,column3
value1,value2,value3`;

// Converting |csv| string to a JavaScript object.
console.log(parse(csv));
```

Advanced usage (with a reviver function)

```js
import {parse} from './node_modules/achilles-csv-parser/dist/esm/parser.min.js';

const csv = `
column1,column2,column3
value1,value2,value3`;

// Leverage the optional reviver function parameter to omit all values
// correspending to "column2" from the end result.
const obj = parse(csv, (key, value) => key === 'column2' ? undefined : value));
console.log(obj);
```

Whichever value is returned from the reviver function will be placed in the
final result, or if `undefined` is returned (as in the example above) the value
will be omitted.

## NPM package

To download via NPM use the following command
```
npm install achilles-csv-parser --only=prod
```

The entire NPM package is 26.4kB (including LICENSE.txt, README.md, package.json
files) and **does not pull in any dependencies** in production.

There is only one minified JS file distributed which should work both in modern
Node.js versions (supporting [JS modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules))
and any modern browser. You can find it in the
`node_modules/achilles-csv-parser/dist/ ` folder. The file is fairly small, only
543 bytes before any compression (excluding license header).
```bash
543 dist/esm/parser.min.js      # Same file for both Node.js or a web browser
```

## Known issue: Handling of invalid inputs

Because RFC 4180 does not specify how to handle invalid inputs, there is no
"CSV input invalid" error. The algorithm currently will keep charging ahead
until it blows up or until it consumes all the input. **In many cases of invalid
CSV input, it will simply produce some nonsensical output (a.k.a. undefined
behavior).**

This is likely  to be improved in future versions, so that an error is thrown
for obviously invalid inputs.

## Building locally

Firstly, install any development dependencies with `npm install`. Then execute
the commands below.

Produce distributed files in `dist/` folder.
```console
gulp clean
gulp release
```

Build tests
```console
gulp tsc --target=tests
```

Run tests
```console
gulp test --target=parser
```

## Contributing

As of this writing, there is no definite plan on accepting community
contributions, mostly because of other time commitments. Having said that, any
PRs or bugs filed are greatly appreciated and will be considered as time
permits.

## Should you use `achilles-csv-parser` in production?

That's up to you to decide. Firstly, this project is published using the
Apache-2.0 license. Secondly, it is provided as-is, with no SLAs on
fixing any bugs within a certain timeline. If your project can be satisfied by
the requirements stated above, and especially about only handling CSV strings
adhering to [RFC 4180](https://tools.ietf.org/html/rfc4180#section-2), then why
not. You might want to wait until the "Known Issue" mentioned above, about
better invalid input handling is addressed, or do any validation on your end,
before passing any CSV strings to this library.

With all that said, I hope you enjoy parsing your CSV strings.
