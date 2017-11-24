"use strict";

const pkg = require("../package.json");
const {readFile, writeFile} = require("./files");

const name = "stylelint-bundle.js";
const modComment = `/*!= Stylelint v${pkg.version} bundle =*/\n/* See https://github.com/Mottie/stylelint-bundle */\n`;

readFile(name)
  .then(data => {
    writeFile(name, modComment + data);
  });
