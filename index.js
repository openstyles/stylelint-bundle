import stylelint from "stylelint";
import postcss from "postcss";
import postcssLess from "postcss-less";
import postcssStylus from "postcss-styl";
import sugarss from "sugarss";
import SugarSSParser from "./node_modules/sugarss/parser.js";

sugarss.Parser = SugarSSParser;
stylelint.postcss = postcss;
stylelint.syntax = {
  sugarss,
  less: postcssLess,
  stylus: postcssStylus,
};
export default stylelint;
