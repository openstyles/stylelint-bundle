'use strict';

const fs = require('fs');
const childProcess = require('child_process');
const pkg = require('../package.json');

const version = pkg.version.match(/[\d.]+/)[0];
const src = 'node_modules/stylelint/';

const remove = [
  'lib/cli.js',
  'lib/utils/isAutoprefixable.js',
  'lib/rules/at-rule-no-vendor-prefix',
  'lib/rules/media-feature-name-no-vendor-prefix',
  'lib/rules/property-no-vendor-prefix',
  'lib/rules/selector-no-vendor-prefix',
  'lib/rules/value-no-vendor-prefix',
  'lib/formatters/stringFormatter.js',
  'lib/formatters/verboseFormatter.js',
];

const rxComments = /\/\*([^*]|\*(?!\/))*(\*\/|$)/g;

// Specific file modifications
// Remove use of "fs", "path" and
// "autoprefixer" - which includes prefixes downloaded from caniuse
const modify = {

  'lib/formatters/index.js': file => replaceBlocks(file, [
    [/string: importLazy.*?,/g, 'string: () => {},'],
    [/verbose: importLazy.*?,/g, 'verbose: () => {},'],
  ]),

  'lib/rules/index.js': file => replaceBlocks(file, [
    /(['"])[-\w]+?-no-vendor-prefix\1:\s*importLazy[\s\S]*?\)\(\),/g,
  ]),

  'lib/createStylelint.js': file => replaceBlocks(file, [
    [
      /const getConfigForFile = require.+/,
      `const getConfigForFile = async stylelint => ({
        config: require('./normalizeAllRuleSettings')(stylelint._options.config),
      });`,
    ], [
      /const isPathIgnored = require.+/,
      'const isPathIgnored = async () => false;',
    ],
    /const (augmentConfig|{\s*cosmiconfig\s*}) = require.+/g,
    /stylelint\._(full|extend)Explorer = cosmiconfig[\s\S]*?\n[\x20\t]+}\);/g,
  ]),

  'lib/getPostcssResult.js': file => replaceBlocks(file, [
    /const { promises: fs } = require.+/,
    /getCode = await fs\.readFile.+/,
  ]),

  'lib/standalone.js': file => replaceBlocks(file, [
    new RegExp(`const (${[
      'FileCache',
      'NoFilesFoundError',
      'debug',
      'fastGlob',
      'filterFilePaths',
      'fs',
      'globby',
      'hash',
      'normalizePath',
      'path',
      'pkg',
      'writeFileAtomic',
    ].join('|')}) = require.+`, 'g'),
    /ignorer = getFileIgnorer.+/,
    /let fileList = .+?(?=\n})/s,
    [
      /\bpath\.\w+\([^()]*\)/,
      'true',
    ], [
      /&&\s+!filterFilePaths.+/,
      '&& false',
    ],
  ]),

  'package.json': file => {
    const json = JSON.parse(file);
    for (const name of [
      'autoprefixer',
      'chalk',
      'cosmiconfig',
      'postcss-syntax',
      'resolve-from',
      'write-file-atomic',
    ]) {
      delete json.dependencies[name];
    }
    return JSON.stringify(json, null, '  ');
  },
};

function replaceBlocks(file, blocks) {
  blocks.forEach(blk => {
    const [needle, replacement] = Array.isArray(blk) ? blk : [blk];
    const index = file.search(needle);
    if (index > -1) {
      // Don't comment out blocks that have already been processed
      if (file.substring(index - 3, index) !== '/* ') {
        file = file.replace(needle,
          s => `/* ${s.replace(rxComments, '')} */${replacement ? '\n' + replacement : ''}`);
      }
    } else {
      console.log(`*** Error: RegExp ${needle} did not match anything`);
    }
  });
  return file;
}

fs.rmSync(src, {force: true, recursive: true});
childProcess.execSync('npm install --no-save stylelint@' + version, {stdio: 'inherit'});

remove.forEach(name => fs.rmSync(src + name, {recursive: true}));
Object.entries(modify).forEach(([name, modifier]) => {
  fs.writeFileSync(src + name, modifier(fs.readFileSync(src + name, 'utf8')));
});
