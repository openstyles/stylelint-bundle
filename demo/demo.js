const DEFAULT_SOURCE = `body {
  fonts: 14px/1.5 Helvetica, arial, sans-serif;
  color: #FFDFF;
}`;

const CONFIG = {rules: {
  // https://github.com/stylelint/stylelint-config-recommended/blob/main/index.js
  'annotation-no-unknown': true,
  'at-rule-no-unknown': true,
  'block-no-empty': true,
  'color-no-invalid-hex': true,
  'comment-no-empty': true,
  'custom-property-no-missing-var-function': true,
  'declaration-block-no-duplicate-custom-properties': true,
  'declaration-block-no-duplicate-properties': [
    true,
    {
      ignore: ['consecutive-duplicates-with-different-values'],
    },
  ],
  'declaration-block-no-shorthand-property-overrides': true,
  'font-family-no-duplicate-names': true,
  'font-family-no-missing-generic-family-keyword': true,
  'function-calc-no-unspaced-operator': true,
  'function-linear-gradient-no-nonstandard-direction': true,
  'function-no-unknown': true,
  'keyframe-block-no-duplicate-selectors': true,
  'keyframe-declaration-no-important': true,
  'media-feature-name-no-unknown': true,
  'named-grid-areas-no-invalid': true,
  'no-descending-specificity': true,
  'no-duplicate-at-import-rules': true,
  'no-duplicate-selectors': true,
  'no-empty-source': true,
  'no-extra-semicolons': true,
  'no-invalid-double-slash-comments': true,
  'no-invalid-position-at-import-rule': true,
  'no-irregular-whitespace': true,
  'property-no-unknown': true,
  'selector-pseudo-class-no-unknown': true,
  'selector-pseudo-element-no-unknown': true,
  'selector-type-no-unknown': [
    true,
    {
      ignore: ['custom-elements'],
    },
  ],
  'string-no-newline': true,
  'unit-no-unknown': true,
}};

const textarea = document.querySelector("textarea");
const output = document.querySelector("output");

let timer = null;
textarea.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(update, 500);
});
textarea.addEventListener("change", () => {
  if (timer === null) {
    return;
  }
  clearTimeout(timer);
  update();
});
textarea.value = DEFAULT_SOURCE;
update();
function update() {
  timer = null;
  stylelint.lint({
    config: CONFIG,
    code: textarea.value,
    formatter: () => {}
  })
    .then(result => {
      output.textContent = JSON.stringify(result.results, null, 2);
      output.classList.remove("error");
    })
    .catch(err => {
      output.textContent = String(err);
      output.classList.add("error");
      console.error(err);
    });
}
