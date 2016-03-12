import _ from 'underscore'

// const IMAGE_TAG_HEXO_REGEX = /{%\s+(asset_img|img)\s+(.*?)\s+%}/g
const IMAGE_TAG_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)(?:\s+['"]?(.*?)['"]?)?\)/g
const IMAGE_TAG_HTML_REGEX = /<img\s+(.*?)\s*\/?>/g
const HTML_ATTR_REGEX = /(\w+)=['"](.*?)['"]/

export class Range {
  static fromMatch (m) {
    let start = m.index
    let content = m[0]
    let length = content.length
    let end = start + length - 1
    return new Range(start, end, content)
  }
  constructor (start, end, content) {
    let length = content.length
    this.start = start
    this.end = end
    this.content = content
    this.length = length
  }
}

export class Token {
  static execAll (T, text) {
    let m = T.REGEX.exec(text)
    let matches = []
    while (m) {
      let token = new T(m)
      token.range = Range.fromMatch(m)
      matches.push(token)
      m = T.REGEX.exec(text)
    }
    return matches
  }
  static get (text, rules = []) {
    return rules.map((n) => Token.execAll(Token.RULES[n], text))
      .reduce((all, curr) => all.concat(curr), [])
      .sort((a, b) => a.range.start - b.range.start)
  }
  constructor (m, type = 'text') {
    this.type = type
    this.init(m)
  }
  init (m) {

  }
}

export class ImageTag extends Token {
  toHTML (opts = {}) {
    let srcset = ''
    let src = this.src
    if (Array.isArray(this.srcset)) {
      srcset = this.srcset.map((s) => {
        let mediaFn = opts.media || s.media
        let media = _.isFunction(mediaFn) ? mediaFn(s) : ''
        return `<source srcset='${s.src}' media='${media}'>`
      }).join('')
      src = (this.srcset.find((s) => s.opts.default === true) || this).src
    }
    // TODO: other attributes
    let html = `<picture>${srcset}<img src='${src}' alt="${this.alt || ''}" /></picture>`
    return html
  }
}

export class MarkdownImageTag extends ImageTag {
  constructor (m) {
    super(m, 'markdown')
  }
  init (m) {
    let [, alt, src, title] = m
    this.alt = alt
    this.src = src
    this.title = title
  }
}
MarkdownImageTag.REGEX = IMAGE_TAG_MARKDOWN_REGEX

export class HtmlImageTag extends ImageTag {
  constructor (m) {
    super(m, 'html')
  }
  init (m) {
    m[1].split(' ')
      .map((attr) => attr.match(HTML_ATTR_REGEX))
      .filter((m) => m != null)
      .forEach((m) => {
        let [, key, value] = m
        this[key] = value
      })
  }
}
HtmlImageTag.REGEX = IMAGE_TAG_HTML_REGEX

Token.RULES = {
  'Markdown': MarkdownImageTag,
  'Html': HtmlImageTag
}
