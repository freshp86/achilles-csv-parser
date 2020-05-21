import * as assert from 'assert';
import * as path from 'path';
import {readFileSync} from 'fs';

import {parseString} from '../src/parser.js';

const TEST_DATA_DIR = path.join(__dirname, '../../../tests/data/');

suite('parser', function(){
  test('empty_string', function() {
    assert.strictEqual(JSON.stringify([]), JSON.stringify(parseString('')));
  })

  function runTestCase(name) {
    const csvString = readFileSync(
        path.join(TEST_DATA_DIR, `${name}.csv`)).toString();
    const actual = JSON.stringify(parseString(csvString), null, 2);
    const expected = readFileSync(
        path.join(TEST_DATA_DIR, 'expected', `${name}.json`)).toString();
    assert.strictEqual(actual, expected);
  }

  // Names must match the name of CSV files in |TEST_DATA_DIR|.
  [
    'header_no_rows',
    'header_with_rows',
  ].forEach(name => test(name, runTestCase.bind(null, name)));
});
