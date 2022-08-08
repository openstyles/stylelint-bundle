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

const DEBUG = process.env.DEBUG === "1";

export default {
  input: {
    "stylelint-bundle.min": 'index.js'
  },
  output: [
    {
      dir: "dist",
      format: 'es',
      sourcemap: true,
      freeze: false
    }
  ],
  // shimMissingExports: true,
  plugins: [
    re({
      patterns: [
        {
          match: /.*/,
          test: /const _?importLazy\s*=.+?;/g,
          replace: ''
        },
        {
          match: /.*/,
          test: /\bimportlazy\(/gi,
          replace: 'require('
        },
        {
          match: /lib\/rules\/function-no-unknown\/index\.js/,
          test: /fs\.readFileSync\(functionsListPath\.toString\(\), 'utf8'\)/,
          replace: JSON.stringify(fs.readFileSync(require.resolve('css-functions-list/index.json'), 'utf8')),
        },
      ]
    }),
    alias({
      entries: {
        util: require.resolve("./shim/util"),
        tty: require.resolve("./shim/tty"),
        os: require.resolve("./shim/os"),
        [require.resolve("stylelint/lib/getConfigForFile")]: require.resolve("./shim/getConfigForFile"),
        [require.resolve("stylelint/lib/isPathIgnored")]: require.resolve("./shim/isPathIgnored"),
        ...Object.fromEntries([
          "cosmiconfig",
          "css-functions-list",
          "debug",
          "fast-glob",
          "file-entry-cache",
          "global-modules",
          "globby",
          "ignore",
          "import-lazy",
          "meow",
          "micromatch",
          "path",
          "picomatch",
          "resolve-from",
          "source-map-js",
          "table",
          "v8-compile-cache",
          "write-file-atomic",
          require.resolve("stylelint/lib/utils/getFileIgnorer"),
        ].map(k => [k, require.resolve("./shim/empty")])),
      }
    }),
    resolve(),
    json(),
    cjs({nested: true}),
    inject({
      process: require.resolve("./shim/process")
    }),
    iife({
      names: id => {
        if (/stylelint-bundle\.min\.js/.test(id)) {
          return "stylelint";
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
            firefox: "53"
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
    DEBUG && analyzer()
  ]
};
