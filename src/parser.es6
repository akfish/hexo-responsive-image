import _ from 'underscore'

const IMAGE_TAG_HEXO_REGEX = /{%\s+(asset_img|img)\s+(.*?)\s+%}/g
const IMAGE_TAG_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)(?:\s+['"]?(.*?)['"]?)?\)/g
const IMAGE_TAG_HTML_REGEX = /<img\s+(.*?)\s*\/>/g
const HTML_ATTR_REGEX = /(\w+)=['"](.*?)['"]/

function execAll (r, text, tokenizer) {
  let m = r.exec(text)
  let matches = []
  let tokenize = typeof tokenizer === 'function'
  while (m) {
    let token = tokenize ? tokenizer(m) : m
    let start = m.index
    let content = m[0]
    let length = content.length
    let end = start + length - 1
    token.range = { content, start, end, length }
    matches.push(token)
    m = r.exec(text)
  }
  return matches
}

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
  _parseHexoImages (text) {
    return execAll(IMAGE_TAG_HEXO_REGEX, text, (m) => {
      let [, type, args] = m
      let img = { type }
      args = args.split(' ').filter((a) => a.length > 0)
      return img
    })
  }
  _parseMarkdownImages (text) {
    return execAll(IMAGE_TAG_MARKDOWN_REGEX, text, (m) => {
      let [, alt, src, title] = m
      return {
        type: 'markdown',
        alt,
        src,
        title
      }
    })
  }
  _parseHtmlImages (text) {
    return execAll(IMAGE_TAG_HTML_REGEX, text, (m) => {
      let img = m[1].split(' ')
        .map((attr) => attr.match(HTML_ATTR_REGEX))
        .filter((m) => m != null)
        .reduce((attrs, m) => {
          let [, key, value] = m
          attrs[key] = value
          return attrs
        }, {})

      img.type = 'html'
      return img
    })
  }
  parse (text, rules = ['Markdown', 'Html']) {
    return rules.map((n) => this[`_parse${n}Images`](text))
      .reduce((all, curr) => all.concat(curr), [])
      .sort((a, b) => a.range.start - b.range.start)
  }
  tokenize (text, rules) {
    let images = this.parse(text, rules)
    let last = 0
    let tokens = []
    function pushTextToken (end) {
      let n = end - last + 1
      tokens.push({
        type: 'text',
        range: {
          start: last,
          end: end,
          length: n,
          content: text.substr(last, n)
        }
      })
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
