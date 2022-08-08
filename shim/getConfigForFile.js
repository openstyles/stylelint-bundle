import normalize from "stylelint/lib/normalizeAllRuleSettings";

export default async stylelint => ({
  config: normalize(stylelint._options.config)
});
