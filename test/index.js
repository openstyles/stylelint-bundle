"use strict";

const stylelint = require("stylelint");
const assert = require('assert');

const defaultSeverity = {severity: 'warning'};
const config = {
  // 'sugarss' is a indent-based syntax like Sass or Stylus
  // ref: https://github.com/postcss/postcss#syntaxes
  syntax: 'sugarss',
  // ** recommended rules **
  // ref: https://github.com/stylelint/stylelint-config-recommended/blob/master/index.js
  rules: {
    'at-rule-no-unknown': [true, defaultSeverity],
    'block-no-empty': [true, defaultSeverity],
    'color-no-invalid-hex': [true, defaultSeverity],
    'declaration-block-no-duplicate-properties': [true, {
      'ignore': ['consecutive-duplicates-with-different-values'],
      'severity': 'warning'
    }],
    'declaration-block-no-shorthand-property-overrides': [true, defaultSeverity],
    'font-family-no-duplicate-names': [true, defaultSeverity],
    'function-calc-no-unspaced-operator': [true, defaultSeverity],
    'function-linear-gradient-no-nonstandard-direction': [true, defaultSeverity],
    'keyframe-declaration-no-important': [true, defaultSeverity],
    'media-feature-name-no-unknown': [true, defaultSeverity],
    /* recommended true */
    'no-empty-source': false,
    'no-extra-semicolons': [true, defaultSeverity],
    'no-invalid-double-slash-comments': [true, defaultSeverity],
    'property-no-unknown': [true, defaultSeverity],
    'selector-pseudo-class-no-unknown': [true, defaultSeverity],
    'selector-pseudo-element-no-unknown': [true, defaultSeverity],
    'selector-type-no-unknown': false, // for scss/less/stylus-lang
    'string-no-newline': [true, defaultSeverity],
    'unit-no-unknown': [true, defaultSeverity],

    // ** non-essential rules
    'comment-no-empty': false,
    'declaration-block-no-redundant-longhand-properties': false,
    'shorthand-property-no-redundant-values': false
  }
};

describe( "Stylint tests", () => {
  describe( "Stylelint exists", () => {
    it("should load using require", () => {
      assert.equal(typeof stylelint, "function");
    });
    it("should make the lint function available", () => {
      assert.equal(typeof stylelint.lint, "function");
    });
  });

  describe( "Stylelint check", () => {
    it("should work", done => {
      stylelint.lint({
        code: "a {color: #FFDFF; }",
        config: config,
        formatter: "string"
      })
      .then(({results}) => {
        assert.equal(results[0].warnings[0].rule, "color-no-invalid-hex");
        done();
      })
      .catch(err => {
        console.error(err.stack);
        done();
      });
    });
  });

});
