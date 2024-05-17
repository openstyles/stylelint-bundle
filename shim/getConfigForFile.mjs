import normalize from "../node_modules/stylelint/lib/normalizeAllRuleSettings.mjs";

export default async stylelint => ({
  config: await normalize(stylelint._options.config)
});
