import fs from "fs";
import cjs from 'rollup-plugin-cjs-es';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
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

function resolvePkg(id) {
  const url = import.meta.resolve(id);
  return fileURLToPath(url)
}

const DEBUG = process.env.DEBUG === "1";
const escapeStrRE = s => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const makeShim = (find, shim) => ({
  find,
  replacement: resolvePkg(shim + '.mjs').replace(/\.\w+$/, ''),
});

export default {
  input: {
    "stylelint-bundle.min": 'index.js'
  },
  output: [
    {
      dir: "dist",
      format: 'es',
      sourcemap: true,
      freeze: false,
      inlineDynamicImports: true
    }
  ],
  onwarn(e) {
    if (!/doesn't export names expected by/.test(e.message)) {
      console.warn(!e.loc ? e : (e.plugin ? `[${e.plugin}] ` : '') +
        e.loc.file + '\n' +
        chalk.red(`${e.loc.line}:${e.loc.column}: ${e.message}`) + '\n' +
        chalk.gray(e.frame) + '\n\n');
    }
  },
  // shimMissingExports: true,
  plugins: [
    re({
      patterns: [
        {
          match: /.*/,
          test: new RegExp(
            /\bget ('[^']+')\(\) {\s*return\s+/.source +
            escapeStrRE('Promise.resolve().then(() => /*#__PURE__*/_interopNamespaceDefaultOnly(') +
            /(require\('[^']+'\))/.source +
            escapeStrRE(')).then((m) => m.default);') +
            /\s*}/.source,
            'g'
          ),
          replace: '$1: $2'
        },
        {
          match: /lib.rules.function-no-unknown.index\.[cm]?js/,
          test: /JSON\.parse\(fs\.readFileSync\(functionsListPath\.toString\(\), 'utf8'\)\)/,
          replace: fs.readFileSync(resolvePkg('css-functions-list/index.json'), 'utf8'),
        },
        {
          match: /.*/,
          test: /source-map-js\/lib\/source-map-generator\.js/,
          replace: resolvePkg("./shim/source-map-generator").replace(/\\/g, '/'),
        },
      ]
    }),
    alias({
      entries: [
        { find: "css-tree", replacement: resolvePkg("css-tree/dist/csstree.esm") },
        { find: /^(node:)?util$/, replacement: resolvePkg("./shim/util") },
        { find: /^(node:)?tty$/, replacement: resolvePkg("./shim/tty") },
        { find: /^(node:)?os$/, replacement: resolvePkg("./shim/os") },
        makeShim(/.*\/mathMLTags/, "./shim/mathMLTags"),
        makeShim(/.*\/getConfigForFile/, "./shim/getConfigForFile"),
        makeShim(/.*\/isPathIgnored/, "./shim/isPathIgnored"),
        makeShim("cosmiconfig", "./shim/cosmiconfig"),
        ...[
          "css-functions-list",
          "debug",
          "fast-glob",
          "file-entry-cache",
          "global-modules",
          "globby",
          "ignore",
          "meow",
          "micromatch",
          /^(node:)?path$/,
          /^(node:)?process$/,
          "picomatch",
          "resolve-from",
          "sourceMap",
          /source-map-js(?!\/)/,
          "table",
          "v8-compile-cache",
          "write-file-atomic",
          /.*\/getFileIgnorer/,
          /.*\/FileCache/,
          /.*\/resolveSilent/,
        ].map(find => makeShim(find, "./shim/empty"))
      ]
    }),
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
          id = id.replace(/^node:/, 'node_');
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
            chrome: "55",
            firefox: "55"
          },
          // https://github.com/facebook/regenerator/issues/276
          include: ["transform-template-literals"],
          exclude: ["transform-regenerator"]
        }]
      ]
    }),
    !DEBUG && terser({
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
