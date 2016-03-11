import _ from 'underscore'
import { Token, Range } from './token'

export default class Parser {
  constructor (opts = {}) {
    this.opts = opts
  }
  _extractFrontMatterImages (data) {
    let { opts } = this

    return _.chain(data)
      .pick(opts.front_matter_fields)
      .map((src, key) => {
        return {
          type: 'front_matter',
          key,
          src
        }
      })
      .value()
  }
  parse (text, rules = ['Markdown', 'Html']) {
    return Token.get(text, rules)
  }
  tokenize (text, rules) {
    let images = this.parse(text, rules)
    let last = 0
    let tokens = []
    function pushTextToken (end) {
      let n = end - last + 1
      let token = new Token(null, 'text')
      token.range = new Range(last, end, text.substr(last, n))
      tokens.push(token)
    }
    images.forEach((img) => {
      let { range } = img
      let { start, end } = range
      if (start > last) pushTextToken(start - 1)
      tokens.push(img)
      last = end + 1
    })
    if (last < text.length) pushTextToken(text.length - 1)
    return tokens
  }
  parseData (data) {
    return this.parse(data.content).concat(this._extractFrontMatterImages(data))
  }
}
