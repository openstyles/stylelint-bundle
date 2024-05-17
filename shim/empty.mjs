function noop() {
  return noop;
}
noop.default = noop.catch = noop.env = noop.cwd = noop;
export default noop;

export {noop as isAbsolute, noop as dirname, noop as join, noop as normalize, noop as relative, noop as sep, noop as resolve,
noop as SourceMapConsumer, noop as SourceMapGenerator };
