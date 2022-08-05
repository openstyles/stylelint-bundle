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
];

const rxComments = /\/\*([^*]|\*(?!\/))*(\*\/|$)/g;
// Specific file modifications
// Remove use of "fs", "path" and
// "autoprefixer" - which includes prefixes downloaded from caniuse
const modify = {

  'lib/index.js': [
    [/(?=utils: {)/, 'SugarSSParser: require("sugarss/parser"),'],
  ],

  'lib/formatters/index.js': [
    /const _?importLazy\s*=.+?;/g,
    [/(?<=json:\s*)importLazy\(/g, 'require('],
    [/importLazy.*?,/g, '() => {},'],
  ],

  'lib/rules/index.js': [
    [/(['"])[-\w]+?-no-vendor-prefix\1:\s*importLazy\(\s*\1.*?\1\s*\),\r?\n/g, ''],
    [/const _?importLazy\s*=.+?;/g, ''],
    [/(?<!\/\*\s*[-'"\w]+:\s*)importLazy\((?=\s*['"])/g, 'require('],
  ],

  'lib/rules/function-no-unknown/index.js': (file, name) => replaceBlocks(file, [
    /const (fs|functionsListPath) = require.+/g,
    [
      "fs.readFileSync(functionsListPath.toString(), 'utf8')",
      JSON.stringify(fs.readFileSync(require.resolve('css-functions-list/index.json'), 'utf8')),
    ]
  ], name),

  'lib/createStylelint.js': [
    [
      /const getConfigForFile = require.+/,
      `const getConfigForFile = async stylelint => ({
        config: require('./normalizeAllRuleSettings')(stylelint._options.config),
      });`,
    ], [
      /const isPathIgnored = require.+/,
      'const isPathIgnored = async () => false;',
    ],
    /const\W*(augmentConfig|cosmiconfig)\W*= require.+/g,
    /stylelint\._(full|extend)Explorer = cosmiconfig[\s\S]*?\n[\x20\t]+}\);/g,
  ],

  'lib/getPostcssResult.js': [
    /const ({ promises: fs }|path) = require.+/g,
    /getCode = await fs\.readFile.+/,
    [
      /(?<=function cssSyntax.+?{)[\s\S]+?return {[\s\S]+?};\s+}/,
      'return postcss}',
    ],
    [/$/, ';cssSyntax.sugarss = require("sugarss")']
  ],

  'lib/standalone.js': [
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
  ],

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

function replaceBlocks(file, blocks, name) {
  let errors = '';
  blocks.forEach(blk => {
    const [needle, replacement] = Array.isArray(blk) ? blk : [blk];
    const index = typeof needle === 'string' ? file.indexOf(needle) : file.search(needle);
    if (index > -1) {
      // Don't comment out blocks that have already been processed
      if (file.substring(index - 3, index) !== '/* ') {
        file = file.replace(needle,
          s => `/* ${s.replace(rxComments, '')} */${replacement ? '\n' + replacement : ''}`);
      }
    } else {
      errors += `*** Error: RegExp ${needle} did not match anything in ${name}\n`;
    }
  });
  if (errors) console.error('\n' + errors);
  return file;
}

fs.rmSync(src, {force: true, recursive: true});
childProcess.execSync('npm install --no-save stylelint@' + version, {stdio: 'inherit'});

remove.forEach(name => fs.rmSync(src + name, {recursive: true}));
Object.entries(modify).forEach(([name, modifier]) => {
  const text = fs.readFileSync(src + name, 'utf8');
  const patched = Array.isArray(modifier)
    ? replaceBlocks(text, modifier, name)
    : modifier(text, name);
  fs.writeFileSync(src + name, patched);
});
