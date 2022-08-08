const DEFAULT_SOURCE = `body {
  fonts: 14px/1.5 Helvetica, arial, sans-serif;
  color: #FFDFF;
}`;

const CONFIG = {rules: {}};
for (const key in stylelint.rules) {
  CONFIG.rules[key] = true;
}

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
