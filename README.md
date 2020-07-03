# achilles-csv-parser
A minimal and fast JavaScript CSV parser for NodeJS and the Browser, with no dependencies. Satisfies to the following requirements:

1.  Parses files adhering to the CSV format as defined in [RFC 4180](https://tools.ietf.org/html/rfc4180#section-2), nothing more and nothing less.
2.  Runs both in a Web browser and in [NodeJS](https://nodejs.org/).
3.  Can handle large files reasonably well, with good memory and speed performance.

If you are curious about the story behind `achilles-csv-parser`, have a look at [this blog post]() documenting how and why it came to existence.

## Demo: Online client-side CSV to JSON converter tool

If you want to quickly test `achilles-csv-parser` with various inputs, or just need an **easy-to-use, 100% private online CSV to JSON converter**, you should use [Achilles CSV to JSON Converter](https://freshp86.github.io/achilles-csv-parser/), which was created to showcase `achilles-csv-parser`.

## API
`achilles-csv-parser` API is inspired by the native [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Syntax) API. It consists of a single public `parse()` function with the following signature.

```ts
parse(text: string, reviver?: (key: string, value: string) => any): Array<Object>
```

The API is kept purposefully very small, and there is no desire to add bells and whistles (streaming parsing, events, reading/writing to files) in future versions.

## Example usage

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

Whichever value is returned from the reviver function will be placed in the final result, or if `undefined` is returned (as in the example above) the value will be omitted.

## NPM package

To download via NPM use the following command
```
npm install achilles-csv-parser --only=prod
```

The entire NPM package is 52KB (including LICENSE/README.md/package.json files) and **does not pull in any 3rd party dependencies**.

There are two minified JS binaries distributed, one for NodeJS and one for the Browser. You can find them in the `node_modules/achilles-csv-parser/dist/` folder. Both files are very small (624 and 543 bytes respectively, before any compression).
```bash
624 dist/commonjs/parser.min.js # Use this for NodeJS
543 dist/esm/parser.min.js      # Use this for the Browser
```

## Known issue: Handling of invalid inputs

Because RFC 4180 does not specify how to handle invalid inputs, there is no "CSV input invalid" error. The algorithm currently will keep charging ahead until it blows up or until it consumes all the input. **In many cases of invalid CSV input, it will simply produce some nonsensical output (a.k.a. undefined behavior).**

This is likely  to be improved in future versions, so that an error is thrown for obviously invalid inputs.

## Contributing

As of this writing, there is no definite plan on accepting community contributions, mostly because of other time commitments. Having said that, any PRs or bugs filed are greatly appreciated and will be considered as time permits.

## Should you use `achilles-csv-parser` in production?

That's up to you. If your project can be satisfied by the requirements stated above, especially about only handling CSV strings adhering to [RFC 4180](https://tools.ietf.org/html/rfc4180#section-2), then why not. But more realistically, you might want to wait until the "Known Issue" about better invalid input handling mentioned above is addressed.

