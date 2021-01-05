'use strict';

const assert = typeof require === 'function' ? require('assert') : {
  equal(actual, expected, message) {
    if (actual != expected) { // eslint-disable-line eqeqeq
      throw new Error(message || `${actual} == ${expected}`);
    }
  },
};

for (const suffix of ['', '.min']) {
  const fileName = `stylelint-bundle${suffix}.js`;
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && !document.querySelector(`script[src$="${fileName}"]`)) {
    continue;
  }
  const stylelint = isBrowser ? window.stylelint : require(`../dist/${fileName}`);

  describe(fileName, () => {

    describe('exists:', () => {
      it(`loads using ${isBrowser ? 'window.stylelint' : 'require()'}`, () => {
        assert.equal(typeof stylelint, 'function');
      });
      it('has lint() function', () => {
        assert.equal(typeof stylelint.lint, 'function');
      });
    });

    describe('works:', () => {
      const ID = 'color-no-invalid-hex';
      it(ID + ' rule works', async () => {
        const {results: [res]} = await stylelint.lint({
          code: 'a {color: #FFDFF; }',
          config: {
            rules: {
              [ID]: [true, {severity: 'warning'}],
            },
          },
          formatter: 'string',
        });
        assert.equal(res.warnings[0].rule, ID);
      });
    });

  });
}
