import stylelint from "stylelint";
import sugarss from "sugarss";
const _lint = stylelint.lint;
stylelint.lint = options => {
  if (options?.config?.customSyntax === "sugarss") {
    options.config.customSyntax = sugarss;
  }
  return _lint.call(stylelint, options);
}
export {stylelint as default};
