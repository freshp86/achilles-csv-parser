/**
 * Copyright 2020 Achilles CSV Parser Project Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

import * as assert from 'assert';
import * as path from 'path';
import {readFileSync} from 'fs';

import {parse} from '../esm/parser.js';

const TEST_DATA_DIR = new URL('../../tests/data/', import.meta.url).pathname;

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
