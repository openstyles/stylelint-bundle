"use strict";

const pkg = require("../node_modules/stylelint/package.json");
const {readFile, writeFile} = require("./files");

const bundle = "stylelint-bundle.js";
const workerBundle = "stylelint-bundle-worker.js";
const modComment = `/*!= Stylelint v${pkg.version} bundle =*/\n/* See https://github.com/openstyles/stylelint-bundle */\n`;

readFile(bundle)
  .then(data => {
    writeFile(bundle, modComment + data);
    return modComment + data;
  })
  .then(data => {
    readFile("./build/worker.js").then(worker => {
      writeFile(workerBundle, data + worker);
    });
  });
