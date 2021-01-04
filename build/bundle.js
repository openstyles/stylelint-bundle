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

browserify(null, {
  require: 'stylelint',
  standalone: 'stylelint',
})
  .bundle()
  .on('data', ch => chunks.push(ch))
  .on('end', () => {
    fse.outputFileSync(pkg.main.replace('.min', ''),
      `/*!= Stylelint v${pkg.dependencies.stylelint} bundle =*/\n` +
      `/* See ${pkg.repository.url.replace('.git', '')} */\n` +
      `;(()=>{${babel.transformSync(chunks.join(''), BABEL_OPTS).code}})();`);
  });
