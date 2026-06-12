import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import alias from "@rollup/plugin-alias";
import re from "rollup-plugin-re";
import analyzer from "rollup-plugin-analyzer";
import inject from "@rollup/plugin-inject";
import esInfo from "rollup-plugin-es-info";
import {visualizer} from "rollup-plugin-visualizer";
import {fileURLToPath} from "url";
import {resolve as resolvePath} from "path";

function resolvePkg(id) {
  const url = import.meta.resolve(id);
  return fileURLToPath(url);
}

const DEBUG = process.env.DEBUG === "1";
const NO_TERSER = DEBUG || process.env.NO_TERSER === "1";
const toMatch = new Set();

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
      inlineDynamicImports: true,
      globals: {
        stylus: "stylus",
      },
    }
  ],
  external: ["stylus"],
  // shimMissingExports: true,
  plugins: [
    re({
      patterns: [
        ["**/stylelint/lib/rules/index.mjs",
          /^.*?const ruleNames = \[\s*(.+?\n)\s*].+(export default )rules;\s*$/s,
          (_, rules, ex) => {
            let i = 0, res = "{";
            res = rules.replace(/'(.+?)',/g, (_, a) =>
                `import r${++i} from '${res += `'${a}': r${i},`, "./" + a}';`) +
              ex + res + "};";
            return res;
          },
        ],
        ["**/stylelint/lib/formatters/index.mjs",
          /(const formatters = {\s*).*?('[^']+?jsonFormatter\.mjs').+\n};/s,
          "import json from $2; $1json};",
        ],
        ["**/stylelint/lib/createStylelint.mjs",
          /_fileCache:.*|_extendExplorer:[\s\S]*?\n\s+}\),|_(augmented|specified)ConfigCache:.*|^import.*?(augmentConfig|FileCache)\.mjs';/g,
          "",
        ],
        ["**/stylelint/lib/getPostcssResult.mjs",
          regexpFromArray([
            /import \{ readFile } from .+/,
            /if \(filePath\) \{/,
          ]),
          (s, a) => a ? "" : "if (false) {",
        ],
        ["**/stylelint/lib/lintPostcssResult.mjs",
          "if (timing.enabled) {",
          "if (false) {",
        ],
        ["**/stylelint/lib/lintSource.mjs",
          regexpFromArray([
            /if \(options\.cache\) {/,
            /config\._resolvedCustomSyntax/,
            /(?<=const referenceRoots = ).+|import getReferenceRoots.+/,
          ]),
          (s, a, b, c) =>
            a ? "if (false) {" :
              b ? "stylelint._options.customSyntax"
                : "[]",
        ],
        ["**/stylelint/lib/standalone.mjs",
          regexpFromArray([
            /(?<=const formatterFunction = ).+/,
            /import (?:getFormatter|pathExists|resolveFilePath|toPath|\{ SuppressionsService) .+/,
            /const absoluteCodeFilename =[\s\S]+?\n\s+}\s+(?=let stylelintResult)/,
            /let fileList = [\s\S]+?return result;\n(?=})/,
            /, absoluteCodeFilename/,
            /codeFilename: absoluteCodeFilename,/,
          ]),
          (s, a) => a ? "()=>''" : "",
        ],
        ["**/stylelint/lib/reference/atKeywords.mjs",
          "'apply',",
          "'-moz-document', 'apply',",
        ],
        ["**/postcss/lib/{fromJSON.js,input.js}",
          "require('./previous-map')",
          "false",
        ],
        ["**/postcss/lib/postcss.js",
          "postcss.fromJSON = fromJSON",
          "",
        ],
        ["**/postcss-styl/lib/parser/index.js",
          /(this\.processRawBefore\(\{[^}]+)(parent),\s+}/,
          "$1},undefined,$2",
        ],
      ].map(mustMatch)
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
    {
      name: "<re> did not match some files",
      buildEnd(error) {
        if (toMatch.size) {
          throw new Error('\n' + [...toMatch].join(',\n'));
        }
      }
    },
    !NO_TERSER && terser({
      compress: {
        keep_fnames: /^[A-Z]/,
      },
      mangle: {
        keep_fnames: /^[A-Z]/,
      },
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
  return RegExp(arr.map(rx => `(${rx.source})`).join("|"), flags);
}

function mustMatch([match, test, replace]) {
  toMatch.add(match);
  return {
    match,
    transform(code, id) {
      const code2 = code.replace(test, replace);
      if (code2 === code) throw new Error(`${id}: could not find ${test}`);
      toMatch.delete(match);
      return code2;
    }
  };
}
