'use strict';

const fse = require('fs-extra');
const babel = require('@babel/core');
const browserify = require('browserify');
const pkg = require('../package.json');

const BABEL_OPTS = {
  generatorOpts: {
    compact: false,
    retainLines: true,
  },
  presets: [[
    '@babel/env', {
      targets: {
        /* https://github.com/openstyles/stylus/blob/master/manifest.json
         * Chrome: minimum_chrome_version
         * FF: strict_min_version
         */
        chrome: 55,
        firefox: 53,
      },
      loose: true,
      useBuiltIns: false,
    },
  ]],
};
const chunks = [];
const builtins = require('browserify/lib/builtins.js');
for (const key in builtins) {
  if (!/^(path|_process)$/.test(key)) {
    builtins[key] = 'build/empty.js';
  }
}

browserify(null, {
  require: 'stylelint',
  standalone: 'stylelint',
  builtins,
})
  .bundle()
  .on('data', ch => chunks.push(ch))
  .on('end', () => {
    fse.outputFileSync(pkg.main.replace('.min', ''),
      `/*!= Stylelint v${pkg.version} bundle =*/\n` +
      `/* See ${pkg.repository.url.replace('.git', '')} */\n` +
      `;(()=>{${babel.transformSync(chunks.join(''), BABEL_OPTS).code}})();`);
  });
