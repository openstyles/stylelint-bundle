# Stylelint Bundle

This repository branch modifies Stylelint and creates a bundle:

* To allow bundling of the code.
* To reduce the file size of the standalone version.
* It removes excessive code to make it efficient to use with the [Stylus](https://github.com/openstyles/stylus) browser extension.
* The bundle includes the sugarss syntax. It will be used when `config.customSyntax === "sugarss"`.

[Demo](https://raw.githack.com/openstyles/stylelint-bundle/master/demo/index.html)

## Create the bundle

* Download or clone this repository.
* Run `npm install`
* Run `npm run build`.
* An IIFE bundle `stylelint-bundle.min.js` is created in `dist` directory using the modified version of Stylelint.
* Run `npm test` for testing.

## Limitations

The resulting bundle:

* Exposes the standalone version of Stylelint.
* It does not work from the command line:
  * All code that uses the node file system (`fs`) or path (`path`) are bypassed or removed.
  * All command-line interface (CLI) code is bypassed or removed.

## Usage

* Within your HTML page, load the bundle.

  ```html
  <script src="stylelint-bundle.min.js"></script>
  ```

* Access the `stylelint` global:

  ```js
  stylelint.lint({
    code: "body { color: #000; }",
    config: {
      customSyntax: 'sugarss',
      rules: { /*...*/ },
      formatter: () => {}
    }
  }).then(({results}) => {
    console.log(results[0]);
  });
  ```

  To get more details, including all the options and return promise values, see the [stylelint Node API](https://stylelint.io/user-guide/node-api/) page; but, don't forget the limitations of this bundle!

## For contributors

To update to a new version of Stylelint:

```
npm install stylelint@latest
npm run build
```

It will install the latest stylelint, bump the version number in `package.json` and `package-lock.json`, then build the bundle.

To test it:

```
npm test
```

## Debug the bundle

Set environment variable `DEBUG` to `1` then run `npm run build`:

1. You will get a webpage visualization of modules included in the bundle.
2. Detailed module information in `stats.json`.
3. The bundle is no longer minimized.

