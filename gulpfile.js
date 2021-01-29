import assert from 'assert';
import * as fs from 'fs';
import path from 'path';
import {spawn} from 'child_process';

import gulp from 'gulp';
import nopt from 'nopt';
import terser from 'terser';

// Folder names.
const Dir = {
  DIST: 'dist',
  SRC: 'src',
  TESTS: 'tests',
};

// Gulp task names.
const Task = {
  CLEAN: 'clean',
  TEST: 'test',
  TSC: 'tsc',
  TERSER: 'terser',
  RELEASE: 'release',
};

// Regular expressions for choosing files.
const FileRegex = {
  SRC_PARSER_TS: `./${Dir.SRC}/parser.ts`,
  TEST_JS: `./${Dir.TESTS}/**/*_test.js`,
};

function getCommandLineOptions() {
  const options = nopt({
    type: [String, null],
    target: [String, null],
  });

  options.target = options.target || 'src';
  options.type = options.type || 'es6';

  function validateFlag(value, domain, name) {
    assert.ok(domain.has(value), `Invalid value for flag ${name}: ${value}`);
  }

  validateFlag(options.target, new Set(['src', 'tests']), 'target');
  validateFlag(options.type, new Set(['commonjs', 'es6']), 'type');

  options.outDir =
      path.join(Dir.DIST, options.type === 'es6' ? 'esm' : options.type);

  return options;
}

// Tasks

export function clean() {
  fs.rmdirSync(Dir.DIST, {recursive: true});
  return Promise.resolve();
}

export function tsc(done) {
  const options = getCommandLineOptions();

  const tscFlags = [];
  if (options.target === 'src') {
    tscFlags.push('--outDir', options.outDir, '--module', options.type);
  } else {
    tscFlags.push('--project', 'tsconfig_test.json');
  }

  const tsc = spawn('tsc', tscFlags, {shell: true, stdio: 'inherit'});
  tsc.on('close', function(code) {
    code === 0 ? done() : done(new Error(`tsc failed with ${code}`));
  });
}

export function terserTask() {
  const options = getCommandLineOptions();

  const code = fs.readFileSync(
      path.join(options.outDir, 'parser.js'), {encoding: 'utf8'});
  const isModule = options.type === 'es6';

  // Generate min file.
  const result = terser.minify(code, {compress: {}, mangle: true, module: isModule});
  fs.writeFileSync(
      path.join(options.outDir, 'parser.min.js'),
      result.code, {encoding: 'utf8'});

  return Promise.resolve();
}


export function test(done) {
  const knownOpts = { target: [String, null] };
  const options = nopt(knownOpts);
  options.target = options.target || 'all';

  const mochaFlags = ['--ui', 'tdd'];
  const testDir = path.join(Dir.DIST, 'commonjs', Dir.TESTS);
  options.target === 'all' ?
      mochaFlags.push(testDir, '--recursive') :
      mochaFlags.push(`${testDir}/${options.target}_test.js`);

  const tsc = spawn(
      './node_modules/mocha/bin/mocha', mochaFlags,
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

export const release = gulp.series(tsc, terserTask);

// Produce distributed binaries.
// gulp release --type=es6
// gulp release --type=commonjs
// gulp copySrc

// Run tests.
// gulp tsc --target=tests
// gulp test --target=parser

// Test what will be published to NPM.
// npm pack
// tar tvf achilles-csv-parser-1.0.0.tgz
