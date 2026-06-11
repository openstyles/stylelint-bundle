'use strict';

const assert = require("assert");
const stylelint = require("../dist/stylelint-bundle.min");

const CODE_LESS = '#a { top: foo } b { #a() }';
const cases = [
  {
    id: 'color-no-invalid-hex',
    code: 'a {color: #FFDFF; }'
  }, {
    id: 'CssSyntaxError',
    cmt: ' without LESS parser',
    code: CODE_LESS,
  }, {
    id: 'declaration-property-value-no-unknown',
    cmt: ' with LESS parser',
    code: CODE_LESS,
    options: {
      customSyntax: stylelint.syntax.less,
    },
  }
];

for (const c of cases) {
  it(c.id + (c.cmt || ''), async () => {
    const {results: [res]} = await stylelint.lint({
      code: c.code,
      config: {
        rules: {
          [c.id]: [true, {severity: 'warning'}],
        },
      },
      ...c.options,
    });
    assert.equal(res.warnings.length, 1);
    assert.equal(res.warnings[0].rule, c.id);
  });
}
