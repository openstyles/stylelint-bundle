import fs from "fs";
import cjs from "rollup-plugin-cjs-es";
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
      format: "es",
      sourcemap: true,
      freeze: false,
      inlineDynamicImports: true
    }
  ],
  onwarn(e) {
    if (!/doesn't export names expected by/.test(e.message)
      && e.code !== "UNUSED_EXTERNAL_IMPORT") {
      console.warn(!e.loc ? e : (e.plugin ? `[${e.plugin}] ` : "") +
        e.loc.file + "\n" +
        chalk.red(`${e.loc.line}:${e.loc.column}: ${e.message}`) + "\n" +
        chalk.gray(e.frame) + "\n\n");
    }
  },
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
          test: "if (filePath) {",
          replace: "if (false) {",
        },
        {
          match: /stylelint[\\/]lib[\\/]lintPostcssResult\.mjs/,
          test: "if (timing.enabled) {",
          replace: "if (false) {",
        },
        {
          match: /stylelint[\\/]lib[\\/]lintSource\.mjs/,
          test: "if (options.cache) {",
          replace: "if (false) {",
        },
        {
          match: /stylelint[\\/]lib[\\/]standalone\.mjs/,
          test: /const absoluteCodeFilename =.+?\n\s+}\s+(?=let stylelintResult)|let fileList = .+?return result;\n(?=})|, absoluteCodeFilename|codeFilename: absoluteCodeFilename,/gs,
          replace: "",
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
    cjs({nested: true}),
    inject({
      process: resolvePkg("./shim/process")
    }),
    iife({
      names: id => {
        if (/stylelint-bundle\.min\.js/.test(id)) {
          return "stylelint";
        }
        if (/^node:/.test(id)) {
          // we only modify internal id so we can get an error when an external id goes wrong
          id = id.replace(/^node:/, "node_");
        }
        return `_external_${id}`;
      }
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
