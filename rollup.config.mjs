import fs from "fs";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import iife from "rollup-plugin-iife";
import alias from "@rollup/plugin-alias";
import re from "rollup-plugin-re";
import analyzer from "rollup-plugin-analyzer";
import inject from "@rollup/plugin-inject";
import esInfo from "rollup-plugin-es-info";
import {visualizer} from "rollup-plugin-visualizer";
import chalk from "chalk";
import {fileURLToPath} from "url";
import {resolve as resolvePath} from "path";

function resolvePkg(id) {
  const url = import.meta.resolve(id);
  return fileURLToPath(url)
}

const DEBUG = process.env.DEBUG === "1";
const NO_TERSER = DEBUG || process.env.NO_TERSER === "1";

export default {
  input: {
    "stylelint-bundle.min": "index.js",
  },
  output: [
    {
      dir: "dist",
      format: "umd",
      name: "stylelint",
      sourcemap: true,
      freeze: false,
      inlineDynamicImports: true
    }
  ],
  // shimMissingExports: true,
  plugins: [
    re({
      patterns: [
        {
          match: /stylelint[\\/]lib[\\/]cli\.mjs/,
          test: /if \(isString\(customFormatter.*?} else/s,
          replace: "",
        },
        {
          match: /stylelint[\\/]lib[\\/]rules[\\/]index\.mjs/,
          test: /^.*?const ruleNames = \[\s*(.+?\n)\s*].+(export default )rules;\s*$/s,
          replace: (_, rules, ex) => {
            let i = 0, res = '{';
            res = rules.replace(/'(.+?)',/g, (_, a) =>
              `import r${++i} from '${res += `'${a}': r${i},`, './' + a}';`) +
              ex + res + '};';
            return res;
          },
        },
        {
          match: /stylelint[\\/]lib[\\/]formatters[\\/]index\.mjs/,
          test: /(const formatters = {\s*).*?('[^']+?jsonFormatter\.mjs').+\n};/s,
          replace: "import json from $2; $1json};",
        },
        {
          match: /stylelint[\\/]lib[\\/]createStylelint\.mjs/,
          test: /_fileCache:.*|_extendExplorer:[\s\S]*?\n\s+}\),|_(augmented|specified)ConfigCache:.*|^import.*?(augmentConfig|FileCache)\.mjs';/g,
          replace: "",
        },
        {
          match: /stylelint[\\/]lib[\\/]getPostcssResult\.mjs/,
          test: regexpFromArray([
            /import \{ readFile } from .+/,
            /if \(filePath\) \{/,
          ]),
          replace: (s, a) => a ? "" : "if (false) {",
        },
        {
          match: /stylelint[\\/]lib[\\/]lintPostcssResult\.mjs/,
          test: "if (timing.enabled) {",
          replace: "if (false) {",
        },
        {
          match: /stylelint[\\/]lib[\\/]lintSource\.mjs/,
          test: regexpFromArray([
            /if \(options\.cache\) {/,
            /config\._resolvedCustomSyntax/,
            /(?<=const referenceRoots = ).+|import getReferenceRoots.+/,
          ]),
          replace: (s, a, b, c) =>
            a ? "if (false) {" :
              b ? "stylelint._options.customSyntax"
                : "[]",
        },
        {
          match: /stylelint[\\/]lib[\\/]standalone\.mjs/,
          test: regexpFromArray([
            /(?<=const formatterFunction = ).+/,
            /import (?:getFormatter|pathExists|resolveFilePath|toPath|\{ SuppressionsService) .+/,
            /const absoluteCodeFilename =[\s\S]+?\n\s+}\s+(?=let stylelintResult)/,
            /let fileList = [\s\S]+?return result;\n(?=})/,
            /, absoluteCodeFilename/,
            /codeFilename: absoluteCodeFilename,/,
          ]),
          replace: (s, a) => a ? "()=>''" : "",
        },
        {
          match: /stylelint[\\/]lib[\\/]reference[\\/]atKeywords\.mjs/,
          test: "'apply',",
          replace: "'-moz-document', 'apply',",
        },
        {
          match: /stylelint[\\/]lib[\\/]utils[\\/]getFormatter\.mjs/,
          test: /if \(await pathExists\(formatter.*?dynamicImport.*?} else/s,
          replace: "",
        },
        {
          match: /postcss[\\/]lib[\\/](input|css-syntax-error)\.js/,
          test: /(let ((path|sourceMap)Available|terminalHighlight|pico) =).*/g,
          replace: "$1 false;",
        },
        {
          match: /postcss[\\/]lib[\\/]css-syntax-error\.js/,
          test: "if (color",
          replace: "if (false",
        },
        {
          match: /postcss[\\/]lib[\\/]/,
          test: "require('./previous-map')",
          replace: "false",
        },
        {
          match: /postcss[\\/]lib[\\/]postcss\\.js/,
          test: "postcss.fromJSON = fromJSON",
          replace: "",
        },
        {
          match: /.*/,
          test: /source-map-js[\\/]lib[\\/]source-map-generator\.js/,
          replace: resolvePkg("./shim/source-map-generator").replace(/\\/g, "/"),
        },
      ]
    }),
    alias(makeAlias({
      alias: {
        "css-tree": "css-tree/dist/csstree.esm",
      },
      noop: [
        "*/FileCache",
        "*/getFileIgnorer",
        "*/resolveSilent",
        "css-functions-list",
        "debug",
        "fast-glob",
        "file-entry-cache",
        "global-modules",
        "globby",
        "ignore",
        "meow",
        "micromatch",
        "node:path",
        "node:process",
        "picomatch",
        "resolve-from",
        "source-map-js/*",
        "sourceMap",
        "table",
        "v8-compile-cache",
        "write-file-atomic",
      ],
      shim: [
        "*/getConfigForFile",
        "*/isPathIgnored",
        "*/mathMLTags",
        "*/normalizeFilePath",
        "cosmiconfig",
        "node:os",
        "node:tty",
        "node:url",
        "node:util",
      ]
    })),
    resolve(),
    json(),
    commonjs(),
    inject({
      process: resolvePkg("./shim/process")
    }),
    babel({
      babelHelpers: "bundled",
      presets: [
        ["@babel/env",
        {
          targets: {
            /* https://github.com/openstyles/stylus/blob/master/manifest.json
             * Chrome: minimum_chrome_version
             * FF: strict_min_version
             */
            chrome: "86",
            firefox: "68"
          },
          // https://github.com/facebook/regenerator/issues/276
          include: ["transform-template-literals"],
          exclude: ["transform-regenerator"]
        }]
      ]
    }),
    !NO_TERSER && terser({
      module: false
    }),
    DEBUG && esInfo({
      file: "stats.json"
    }),
    DEBUG && analyzer(),
    DEBUG && visualizer({
      open: true
    })
  ]
};

function makeAlias({alias, noop, shim, ...opts}) {
  const entries = [];
  const compilePattern = pattern => {
    if (typeof pattern === "string") {
      const match = pattern.match(/^(\*\/)?(node:)?(.*)(\/\*)?$/);
      if (match) {
        let rx = match[3];
        if (match[2]) {
          rx = `(node:)?${rx}`;
        }
        if (match[1]) {
          rx = `.*/${rx}`;
        }
        if (match[4]) {
          rx = `${rx}(/.*)?`;
        } else if (match[1]) {
          rx = `${rx}(\\.[cm]?js)?`;
        }
        rx = `^${rx}$`;
        return {find: new RegExp(rx), name: match[3]};
      }
    }
    return {find: pattern};
  };
  for (const key in alias) {
    const {find} = compilePattern(key);
    entries.push({find, replacement: alias[key]});
  }
  for (const key of noop) {
    const {find} = compilePattern(key);
    entries.push({find, replacement: resolvePath("shim/empty")});
  }
  for (const key of shim) {
    const {find, name} = compilePattern(key);
    entries.push({find, replacement: resolvePath(`shim/${name}`)});
  }
  return {entries, ...opts};
}

function regexpFromArray(arr, flags = "g") {
  return RegExp(arr.map(rx => `(${rx.source})`).join('|'), flags);
}
