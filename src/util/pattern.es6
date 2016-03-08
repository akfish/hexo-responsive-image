const PATTERN_REG = /:(\w+)/g
const patterns = {}

export default class Pattern {
  static parse (pattern) {
    let p = patterns[pattern]
    if (!p) {
      patterns[pattern] = p = new Pattern(pattern)
    }
    return p
  }
  constructor (pattern) {
    this.pattern = pattern
    this._parse(pattern)
  }
  _parse (pattern) {
    let m = PATTERN_REG.exec(pattern)
    let tokens = []
    let actions = []
    let last = 0
    function str (s) { return s }
    function lookup (key, dict = {}) {
      return dict[key] || `:${key}`
    }
    while (m) {
      if (last !== m.index) {
        let txt = pattern.substr(last, m.index - last)
        tokens.push(txt)
        actions.push(str.bind(null, txt))
      }
      last = m.index + m[0].length
      tokens.push(m)
      actions.push(lookup.bind(null, m[1]))

      m = PATTERN_REG.exec(pattern)
    }
    this._tokens = tokens
    this._actions = actions
  }
  stringify (args) {
    return this._actions.map((action) => action(args)).join('')
  }
}
