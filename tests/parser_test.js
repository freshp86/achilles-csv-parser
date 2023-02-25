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

const optionsComma = {separator: ','};
const optionsSemicolon = {separator: ';'};

function runTestCase(inputFile, outputFile, parserFn) {
  const csvString = readFileSync(
      path.join(TEST_DATA_DIR, `${inputFile}.csv`)).toString();
  const actual = JSON.stringify(parserFn(csvString), null, 2);
  const expectedFile = outputFile || inputFile;
  const expected = readFileSync(
      path.join(TEST_DATA_DIR, 'expected', `${expectedFile}.json`)).toString();
  assert.strictEqual(actual, expected);
}

// Names must match the name of .csv files in |TEST_DATA_DIR|.
const testFiles = [
  'header_no_rows',
  'header_with_rows',
  'ends_with_double_quote',
  'ends_with_new_line',
];

// Example reviver function that
//  1) omits all fields in the "foo" column, and
//  2) converts all number-looking fields to numbers
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

// Testing cases where
//  - input files use comma separator
//  - parse() calls *do not* specify any options
suite('parser_options_default', function() {
  test('empty_string', function() {
    assert.strictEqual(JSON.stringify([]), JSON.stringify(parse('')));
  })

  testFiles.forEach(f => test(f, () => runTestCase(f, null, parse)));

  test('reviver', function() {
    runTestCase('header_with_rows', 'with_reviver', string => parse(string, reviver));
  });
});

// Test cases where
//  - input files use comma separator
//  - parse() calls *do* specify comma separator in options
suite('parser_options_comma', function() {
  test('empty_string', function() {
    assert.strictEqual(JSON.stringify([]), JSON.stringify(parse('', null, optionsComma)));
  })

  testFiles.forEach(f => {
    const testName = `${f}_comma`;
    test(testName, () => runTestCase(f, null, string => parse(string, null, optionsComma)));
  });

  test('reviver', function() {
    runTestCase('header_with_rows', 'with_reviver', string => parse(string, reviver, optionsComma));
  });
});

suite('parser_options_semicolon', function() {
  test('empty_string', function() {
    assert.strictEqual(JSON.stringify([]), JSON.stringify(parse('', null, optionsSemicolon)));
  })

  testFiles.forEach(f => {
    const testName = `${f}_semicolon`;
    const inputFile = testName;
    const expectedOutputFile = f;
    test(testName, () => runTestCase(inputFile, expectedOutputFile, string => parse(string, null, optionsSemicolon)));
  });

  test('reviver', function() {
    runTestCase('header_with_rows_semicolon', 'with_reviver', string => parse(string, reviver, optionsSemicolon));
  });
});
