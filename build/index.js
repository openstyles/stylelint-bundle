"use strict";

const del = require("del");
const {readFile, writeFile} = require("./files");

let maybeCompatible = true;

// Location of the module
const fileLoc = "node_modules/stylelint/";

// Files to delete; to ensure browserify doesn't bundle them
const remove = [
  "bin",
  "docs",
  "*.md",
  "lib/**/__tests__",
  "lib/rules/**/__tests__",
  "lib/testUtils",
  "lib/utils/isAutoprefixable.js",
  "lib/rules/at-rule-no-vendor-prefix",
  "lib/rules/media-feature-name-no-vendor-prefix",
  "lib/rules/property-no-vendor-prefix",
  "lib/rules/selector-no-vendor-prefix",
  "lib/rules/value-no-vendor-prefix",
  "lib/formatters/needlessDisablesStringFormatter.js",
  "lib/formatters/stringFormatter.js",
  "lib/formatters/verboseFormatter.js"
];

// Specific file modifications
// Remove use of "fs", "path" and
// "autoprefixer" - which includes prefixes downloaded from caniuse
const modify = {
  "lib/formatters/index.js": file => {
    return replaceBlocks(file, [
      [
        // Replace https://github.com/stylelint/stylelint/blob/master/lib/formatters/index.js#L5-L6
        // with empty functions
        /(string: require\(\"\.\/stringFormatter"\),\s*verbose: require\("\.\/verboseFormatter"\))/,
        "  string: () => {},\n  verbose: () => {}"
      ]
    ]);
  },
  "lib/index.js": file => {
    return commentOut(file, [
      "const createRuleTester =",
      "api.createRuleTester ="
    ]);
  },
  "lib/rules/index.js": file => {
    return commentOut(file, [
      "const atRuleNoVendorPrefix",
      "const mediaFeatureNameNoVendorPrefix",
      "const propertyNoVendorPrefix",
      "const selectorNoVendorPrefix",
      "const valueNoVendorPrefix",
      "\"at-rule-no-vendor-prefix\"",
      "\"media-feature-name-no-vendor-prefix\"",
      "\"property-no-vendor-prefix\"",
      "\"selector-no-vendor-prefix\"",
      "\"value-no-vendor-prefix\""
    ]);
  },
  "lib/standalone.js": file => {
    file = commentOut(file, [
      "const fs = require(\"fs\");",
      "const path = require(\"path\");",
      "const pify = require(\"pify\");",
      "const pkg = require(\"../package.json\");",
      "ignoreText = fs.",
      "if (readError.code !=="
    ]);
    return replaceBlocks(
      file,
      [
        [
          // Replace https://github.com/stylelint/stylelint/blob/master/lib/standalone.js#L60-L62
          // without using path
          /(const absoluteIgnoreFilePath = path\.isAbsolute\(ignoreFilePath\)\s*\? ignoreFilePath\s*: path\.resolve\(process.cwd\(\), ignoreFilePath\);)/,
          "  const absoluteIgnoreFilePath = ignoreFilePath;"
        ], [
          // Replace https://github.com/stylelint/stylelint/blob/master/lib/standalone.js#L110-L113
          // without using path
          /(const absoluteCodeFilename =\s*codeFilename \!== undefined && \!path\.isAbsolute\(codeFilename\)\s*\? path\.join\(process\.cwd\(\), codeFilename\)\s*: codeFilename;)/,
          "    const absoluteCodeFilename = codeFilename;"
        ],
        /* [
          // Replace https://github.com/stylelint/stylelint/blob/master/lib/standalone.js#L127-L133
          // immediately resolve
          /(fs\.stat\(absoluteCodeFilename, err => {\s*if \(err\) {\s*reject\(\);\s*} else {\s*resolve\(\);\s*}\s*}\);)/,
          "          resolve();"
        ], */
        [
          // Replace https://github.com/stylelint/stylelint/blob/master/lib/standalone.js#L127-L209
          // return empty string
          /(let fileList = files\;[\s\S]+function prepareReturnValue)/,
          "  return \"\";\n\n  function prepareReturnValue"
        ]
      ]
    );
  },
  "package.json": file => {
    return file
      .replace(/"autoprefixer": ".+",/, "")
      .replace(/"chalk": ".+",/, "");
  }
};

function commentOut(file, lines) {
  lines.forEach(line => {
    const index = file.indexOf(line);
    if (index > -1) {
      file = file
        .replace(line, `// ${line}`)
        // Don't let these accumulate
        .replace("// //", "//");
    } else {
      maybeCompatible = false;
      console.log(`*** Error: Could not comment out "${line}"`);
    }
  });
  return file;
}

// Non-destructive replacement. The block is commented out by adding an
// opening /* and closing */. It does not account for internal block comments!
function replaceBlocks(file, blocks) {
  blocks.forEach(block => {
    const index = file.search(block[0]);
    if (index > -1) {
      // Don't comment out blocks that have already been processed
      if (file.substring(index - 3, index) !== "/* ") {
        file = file.replace(block[0], "/* $1 */\n" + block[1]);
      }
    } else {
      maybeCompatible = false;
      console.log(`*** Error: RegExp ${block[0].toString()} did not match anything`);
    }
  });
  return file;
}

Promise.all(remove.map(file => del(fileLoc + file)))
  .then(
    Promise.all(
      Object.keys(modify).map(file => {
        readFile(fileLoc + file)
          .then(data => modify[file](data))
          .then(data => writeFile(fileLoc + file, data));
      })
    )
  )
