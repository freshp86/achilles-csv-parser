import * as assert from 'assert';
import * as path from 'path';
import {readFileSync} from 'fs';

import {parse} from '../src/parser.js';

const TEST_DATA_DIR = path.join(__dirname, '../../../tests/data/');

suite('parser', function(){
  test('empty_string', function() {
    assert.strictEqual(JSON.stringify([]), JSON.stringify(parse('')));
  })

  function runTestCase(inputName, outputName, parserFn) {
    const csvString = readFileSync(
        path.join(TEST_DATA_DIR, `${inputName}.csv`)).toString();
    const actual = JSON.stringify(parserFn(csvString), null, 2);
    const expected = readFileSync(
        path.join(TEST_DATA_DIR, 'expected', `${outputName || inputName}.json`)).toString();
    assert.strictEqual(actual, expected);
  }

  // Names must match the name of CSV files in |TEST_DATA_DIR|.
  [
    'header_no_rows',
    'header_with_rows',
    'ends_with_double_quote',
    'ends_with_new_line',
  ].forEach(name => test(name, () => runTestCase(name, null, parse)));

  test('reviver', function() {
    // Example reviver function that
    // 1) omits all fields in the "foo" column, and
    // 2) converts all number-looking fields to numbers
    function reviver(key, value) {
      if (key === 'foo') {
        return undefined;
      }

      const number = Number.parseInt(value, 10);
      if (!Number.isNaN(number)) {
        return number;
      }

      return value;
    }

    runTestCase('header_with_rows', 'with_reviver', string => parse(string, reviver));
  });
});
