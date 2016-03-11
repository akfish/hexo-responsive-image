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
      theme.base
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
  _buildResponsiveImg (image) {
    // TODO: use config
    let srcset = image.srcset.map((s) => `<source srcset='${s.src}' media='(min-width: ${s.opts.width}px)'>`).join('')
    // TODO: use config
    let src = image.srcset.find((s) => s.type === 'medium').src || image.src
    // TODO: other attributes
    return `<picture>
      ${srcset}
      <img src='${src}' alt='${image.alt}' />
    </picture>`
  }
  async _apply (data) {
    let { parser } = this
    let images = await this.responsive.waitForImages(data._id)

    data.images = images

    let imageMap = {}
    // Check for errors
    images.forEach((image) => {
      imageMap[image.src] = image
      image.srcset = image.srcset.filter((i) => i.status !== 'error')
    })
    // extract all <img> tags in rendered HTML
    // TODO: replace with <picture>
    let tokens = parser.tokenize(data.content, ['Html'])
    data.content = tokens.map((token) => {
      let { type, range } = token
      if (type === 'text') return range.content
      let image = imageMap[token.src]
      // return image ? this._buildResponsiveImg(image) : range.content
      return image ? image.toHTML(this.opts) : range.content
    }).join('')
    return data
  }
}
