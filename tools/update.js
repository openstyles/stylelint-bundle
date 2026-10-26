'use strict';

const fs = require('fs');
const PATH = __dirname + '/../';
const pkg = require(PATH + 'package.json');
const newVer = pkg.devDependencies.stylelint;

if (newVer !== pkg.version) {
  pkg.version = newVer;
  fs.writeFileSync(PATH + 'package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}
