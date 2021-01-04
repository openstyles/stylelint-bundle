'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const UglifyJS = require('uglify-es');
const pkg = require('../package.json');

const OPTS = {
  compress: {
    ecma: 7,
    unsafe_arrows: true,
    unsafe_methods: true,
  },
  output: {
    comments: /^!=/,
    ecma: 7,
  },
};

const srcCode = fs.readFileSync(pkg.main.replace('.min', ''), 'utf8');
const res = UglifyJS.minify(srcCode, OPTS).code;
fse.outputFileSync(pkg.main, res);
