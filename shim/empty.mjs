function noop() {
  return noop;
}
noop.default = noop.catch = noop;
export default noop;

