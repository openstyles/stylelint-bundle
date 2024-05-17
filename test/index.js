'use strict';

const assert = require("assert");
const fs = require("fs");

const cases = [
  {
    id: 'color-no-invalid-hex',
    code: 'a {color: #FFDFF; }'
  }
];

(0, eval)(fs.readFileSync(require.resolve("../dist/stylelint-bundle.min"), "utf8"));

for (const c of cases) {
  it(c.id, async () => {
    const {results: [res]} = await stylelint.lint({
      code: c.code,
      config: {
        rules: {
          [c.id]: [true, {severity: 'warning'}],
        },
      },
      // FIXME: the table package is excluded so the formatter doesn't work. Maybe we should exclude all default formatters?
      // formatter: 'string',
      formatter: () => {},
    });
    assert.equal(res.warnings.length, 1);
    assert.equal(res.warnings[0].rule, c.id);
  })
}

