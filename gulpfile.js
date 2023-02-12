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
import assert from 'assert';
import {spawn} from 'child_process';
import {existsSync, rmSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import path from 'path';

import gulp from 'gulp';
import nopt from 'nopt';
import {minify} from 'terser';

// Folder names.
const Dir = {
  DIST: 'dist',
  SRC: 'src',
  TESTS: 'tests',
};

// Regular expressions for choosing files.
const FileRegex = {
  SRC_PARSER_TS: `./${Dir.SRC}/parser.ts`,
  TEST_JS: `./${Dir.TESTS}/**/*_test.js`,
};

function getCommandLineOptions() {
  const options = nopt({
    target: [String, null],
  });

  options.target = options.target || 'src';

  function validateFlag(value, domain, name) {
    assert.ok(domain.has(value), `Invalid value for flag ${name}: ${value}`);
  }

  validateFlag(options.target, new Set(['src', 'tests']), 'target');

  // Must match what is in tsconfig.json.
  options.outDir = path.join(Dir.DIST, 'esm');

  return options;
}

// Tasks

export function clean() {
  if (existsSync(Dir.DIST)) {
    rmSync(Dir.DIST, {recursive: true, force: true});
  }

  return Promise.resolve();
}

export function tsc(done) {
  const options = getCommandLineOptions();

  const tscFlags = [];
  if (options.target === 'tests') {
    tscFlags.push('--project', 'tsconfig_test.json');
  }

  const tsc = spawn('tsc', tscFlags, {shell: true, stdio: 'inherit'});
  tsc.on('close', function(code) {
    code === 0 ? done() : done(new Error(`tsc failed with ${code}`));
  });
}

export async function terserTask() {
  const options = getCommandLineOptions();
  const code = await readFile(
      path.join(options.outDir, 'parser.js'), {encoding: 'utf8'});

  // Generate min file.
  const result = await minify(code, {
    compress: {},
    mangle: true,
    module: true,
  });

  return writeFile(
      path.join(options.outDir, 'parser.min.js'),
      result.code, {encoding: 'utf8'});
}


export function test(done) {
  const knownOpts = { target: [String, null] };
  const options = nopt(knownOpts);
  options.target = options.target || 'all';

  const mochaFlags = ['--ui', 'tdd'];
  const testDir = path.join(Dir.DIST, Dir.TESTS);
  options.target === 'all' ?
      mochaFlags.push(testDir, '--recursive') :
      mochaFlags.push(`${testDir}/${options.target}_test.js`);

  const tsc = spawn(
      './node_modules/mocha/bin/mocha.js', mochaFlags,
      {shell: true, stdio: 'inherit'});

  tsc.on('close', function(code) {
    code === 0 ? done() : done(new Error(`Mocha failed with ${code}`));
  });
}

export function copySrc() {
  return gulp.src([
    FileRegex.SRC_PARSER_TS,
  ], {base: '.'}).pipe(gulp.dest(Dir.DIST));
}

export const release = gulp.parallel(copySrc, gulp.series(tsc, terserTask));

// Produce distributed files.
// gulp release

// Build and run tests
// gulp tsc --target=tests
// gulp test --target=parser

// See what will be published to NPM.
// npm pack
// tar tvf achilles-csv-parser-1.0.0.tgz
