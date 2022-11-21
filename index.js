import stylelint from "stylelint";
import sugarss from "sugarss";
import SugarSSParser from "./node_modules/sugarss/parser.js";
const _lint = stylelint.lint;
stylelint.lint = options => {
  if (options?.config?.customSyntax === "sugarss") {
    options.config.customSyntax = sugarss;
  }
  return _lint.call(stylelint, options);
}
stylelint.SugarSSParser = SugarSSParser;
export {stylelint as default};
