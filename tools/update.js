'use strict';

const fs = require('fs');
const PATH = __dirname + '/../';
const pkg = require(PATH + 'package.json');
const newVer = pkg.dependencies.stylelint;

if (newVer !== pkg.version) {
  const pkg2 = require(PATH + 'package-lock.json');
  pkg.version = pkg2.version = newVer;
  fs.writeFileSync(PATH + 'package.json', JSON.stringify(pkg, null, 2), 'utf8');
  fs.writeFileSync(PATH + 'package-lock.json', JSON.stringify(pkg2, null, 2), 'utf8');
}
