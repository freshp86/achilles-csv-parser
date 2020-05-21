const assert = require('assert');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const gulp = require('gulp');
const mocha = require('gulp-mocha');
const nopt = require('nopt');
const terser = require('terser');

// Folder names.
const Dir = {
  OUT: 'dist',
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
      path.join(Dir.OUT, options.type === 'es6' ? 'esm' : options.type);

  return options;
}

// Tasks

gulp.task(Task.CLEAN, function() {
  fs.rmdirSync(Dir.OUT, {recursive: true});
  return Promise.resolve();
});

gulp.task(Task.TSC, function() {
  const options = getCommandLineOptions();

  const tscFlags = options.target === 'src' ?
    `--outDir ${options.outDir} --module ${options.type}` :
    `--project tsconfig_test.json`;

  return new Promise((resolve, reject) => {
    exec(`tsc ${tscFlags}`, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject();
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve();
    });
  });
});

gulp.task(Task.TEST, function() {
  return gulp.src(
      path.join(Dir.OUT, 'commonjs', FileRegex.TEST_JS), {read: false}).
      pipe(mocha({ui: 'tdd', reporter: 'spec'}));
});

gulp.task(Task.TERSER, function() {
  const options = getCommandLineOptions();

  const code = fs.readFileSync(
      path.join(options.outDir, 'parser.js'), {encoding: 'utf8'});
  const isModule = options.type === 'es6';

  // Generate debug file.
  let result = terser.minify(
      code, {compress: false, mangle: false, module: isModule});
  fs.writeFileSync(
      path.join(options.outDir, 'parser.debug.js'),
      result.code, {encoding: 'utf8'});
  // Generate min file.
  result = terser.minify(code, {compress: {}, mangle: true, module: isModule});
  fs.writeFileSync(
      path.join(options.outDir, 'parser.min.js'),
      result.code, {encoding: 'utf8'});

  return Promise.resolve();
});

gulp.task(Task.RELEASE, gulp.series(Task.TSC, Task.TERSER));

// Produce distributed binaries.
// > gulp release --type=es6
// > gulp release --type=commonjs

// Run tests.
// > gulp tsc --target=tests
// > gulp test

// To test what will be published to NPM
// > npm pack
// > tar tvf achilles-csv-parser-0.0.1.tgz
