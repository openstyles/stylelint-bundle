import stylelint from "stylelint";
import postcssLess from "postcss-less";
import sugarss from "sugarss";
import SugarSSParser from "./node_modules/sugarss/parser.js";

sugarss.Parser = SugarSSParser;
stylelint.syntax = {
  sugarss,
  less: postcssLess,
};
export default stylelint;
