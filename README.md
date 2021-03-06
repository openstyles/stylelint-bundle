# Stylelint Bundle

This repository branch modifies Stylelint and creates a bundle:

* To allow bundling of the code.
* To reduce the file size of the standalone version.
* It removes excessive code to make it efficient to use with the [Stylus](https://github.com/openstyles/stylus) browser extension.
* Using `browserify -r stylelint -o stylelint-bundle.js`:
  * Bundle size before build: `3,862 KB`.
  * Bundle size after build: `2,577 KB` (`686 KB` minified)

## Create the bundle

* Download or clone this repository.
* Run `npm install`
* Run `npm run build` (will refresh the version of stylelint).
* The `stylelint-bundle.js` and `stylelint-bundle.min.js` are created in `dist` directory using the modified version of Stylelint.
* Tests are automatically run; or can be manually run using `npm test`.

## Limitations

The resulting bundle:

* Exposes the standalone version of Stylelint.
* It does not work from the command line:
  * All code that uses the node file system (`fs`) or path (`path`) are bypassed or removed.
  * All command-line interface (CLI) code is bypassed or removed.
* Vendor prefixed rules and formatters have been removed. Including the following rules:
  * `at-rule-no-vendor-prefix`.
  * `media-feature-name-no-vendor-prefix`.
  * `property-no-vendor-prefix`.
  * `selector-no-vendor-prefix`.
  * `value-no-vendor-prefix`.

## Usage

* Within your HTML page, load the bundle.

  ```html
  <script src="stylelint-bundle.min.js"></script>
  ```

* Use CommonJS `require` or AMD `define` or a global `stylelint` (if you don't use modules) to load the bundled script, then access the `lint` function:

  ```js
  // const stylelint = require("stylelint"); // uncomment if you use modules
  stylelint.lint({
    code: "body { color: #000; }",
    config: {
      syntax: 'sugarss',
      rules: { /*...*/ },
      formatter: "string"
    }
  }).then(({results}) => {
    console.log(results[0]);
  });
  ```

  To get more details, including all the options and return promise values, see the [stylelint Node API](https://stylelint.io/user-guide/node-api/) page; but, don't forget the limitations of this bundle!

## For contributors

To update to a new version of Stylelint specify an **exact version** in package.json `dependencies`:

```
  "dependencies": {
    "stylelint": "13.8.0"
  },
```
Then run the `build` script. In case of failure update the rules in `build/index.js`.
