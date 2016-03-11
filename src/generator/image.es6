import fs from 'hexo-fs'
import _ from 'underscore'

export default class ImageGenerator {
  constructor (responsive) {
    let { hexo, opts } = responsive
    this.hexo = hexo
    this.opts = opts
    this._images = {}
  }
  register () {
    let { generator } = this.hexo.extend
    generator.register('responsive_image', this._getRoutes.bind(this))
  }
  push (image) {
    this._images[image.src] = image
  }
  _getRoutes (locals) {
    let { log } = this.hexo
    let images = _.values(this._images)
    return images.map(({ src, filePath }) => {
      log.info(`Created: ${src}`)
      return {
        path: src,
        data: () => fs.createReadStream(filePath)
      }
    })
  }
}
