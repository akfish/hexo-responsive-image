import _ from 'underscore'
import Parser from '../parser'

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
  _resolveImagePath (image) {
    // TODO: site source, theme source, asset folder
    // TODO: image.absoluteSrc = xxx
  }
  _process (data) {
    let { parser } = this
    parser.parseData(data)
      .map(this._resolveImagePath.bind(this))
      .forEach((imgs) => this.responsive.queueImages(data.id, imgs))
    return data
  }
  _apply (data) {
    return this.responsive.waitForImages(data.id)
      .then((images) => {
        // TODO: extract all <img> tags in rendered HTML
        // TODO: find srcsets by url
        // TODO: replace with <picture>
        return data
      })
  }
}
