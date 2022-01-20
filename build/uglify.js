'use strict';

const fs = require('fs');
const UglifyJS = require('uglify-es');
const pkg = require('../package.json');

const OPTS = {
  compress: {
    ecma: 7,
    passes: 2,
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
fs.writeFileSync(pkg.main, res, 'utf8');
