function noop() {
  return noop;
}
noop.default = noop.catch = noop.env = noop.cwd = noop;
export default noop;

export {
  noop as SourceMapConsumer,
  noop as SourceMapGenerator,
  noop as dirname,
  noop as globby,
  noop as isAbsolute,
  noop as join,
  noop as normalize,
  noop as relative,
  noop as resolve,
  noop as sep,
  noop as table,
};
