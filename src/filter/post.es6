if (!global._babelPolyfill) require('babel-polyfill')
import _ from 'underscore'
import Parser from '../parser'
import fs from 'hexo-fs'
import path from 'path'
import Promise from 'bluebird'

export default class PostFilter {
  constructor (responsive) {
    this.responsive = responsive
    this.opts = responsive.opts
    this.hexo = responsive.hexo
    this.parser = new Parser(_.pick(this.opts, ['front_matter_fields']))
  }
  register () {
    let { filter } = this.hexo.extend
    filter.register('before_post_render', this._process.bind(this))
    filter.register('after_post_render', this._apply.bind(this))
  }
  async _resolveImagePath (image) {
    let { source, theme, log } = this.hexo
    let paths = [
      source.base,
      path.join(theme.base, 'source')
    ].map((p) => path.join(p, image.src))

    let exists = await Promise.map(paths, (p) => fs.exists(p))
    let hit = exists.indexOf(true)
    image.resolved = hit >= 0
    if (image.resolved) {
      image.absoluteSrc = paths[hit]
    } else {
      log.warn(`Cannot resolve image '${image.src}'`)
    }
    return image
  }
  async _process (data) {
    let { parser } = this
    let images = await Promise.map(parser.parseData(data), this._resolveImagePath.bind(this))
    this.responsive.queueImages(data, images.filter((image) => image.resolved))
    return data
  }
  async _apply (data) {
    let { parser, opts } = this
    let images = await this.responsive.waitForImages(data._id)

    data.images = images

    let imageMap = {}
    images.forEach((image) => {
      imageMap[image.src] = image
      image.srcset = image.srcset.filter((i) => i.status !== 'error')
    })
    // extract all <img> tags in rendered HTML
    let tokens = parser.tokenize(data.content, ['Html'])
    data.content = tokens.map((token) => {
      let { type, range } = token
      if (type === 'text') return range.content
      let image = imageMap[token.src]
      // return image ? this._buildResponsiveImg(image) : range.content
      return image ? image.toHTML(this.opts) : range.content
    }).join('')
    // create xxx_responsive fields in front-matter
    opts.front_matter_fields.forEach((f) => {
      let src = data[f]
      let image = imageMap[src]
      if (image) data[`${f}_responsive`] = image
    })
    return data
  }
}
