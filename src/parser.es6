import _ from 'underscore'

const IMAGE_TAG_HEXO_REGEX = /{%\s+(asset_img|img)\s+(.*?)\s+%}/g
const IMAGE_TAG_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)(?:\s+['"]?(.*?)['"]?)?\)/g
const IMAGE_TAG_HTML_REGEX = /<img\s+(.*?)\s*\/>/g
const HTML_ATTR_REGEX = /(\w+)=['"](.*?)['"]/

function execAll (r, text) {
  let m = r.exec(text)
  let matches = []
  while (m) {
    matches.push(m)
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

    return _.map(_.pick(data, opts.front_matter_fields), (src, key) => {
      return {
        type: 'front_matter',
        key,
        src
      }
    })
  }
  _parseHexoImages (text) {
    execAll(IMAGE_TAG_HEXO_REGEX, text)
      .map((m) => {
        let [, type, args] = m
        let img = { type }
        args = args.split(' ').filter((a) => a.length > 0)
        return img
      })
  }
  _parseMarkdownImages (text) {
    return execAll(IMAGE_TAG_MARKDOWN_REGEX, text)
      .map((m) => {
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
    return execAll(IMAGE_TAG_HTML_REGEX, text)
      .map((m) => {
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
  parse (text) {
    return [
      // 'Hexo',
      'Markdown',
      'Html'
    ].map((n) => this[`_parse${n}Images`](text))
      .reduce((all, curr) => all.concat(curr), [])
  }
  parseData (data) {
    return this.parse(data.content).concat(this._extractFrontMatterImages(data))
  }
}
