import Promise from 'bluebird'
import PostFilter from './filter/post'
import InjectFilter from './filter/inject'
import ImageProcessor from './processor'
import { getOptions } from './option'

export default class Responsive {
  constructor (hexo, opts) {
    this.hexo = hexo
    // opts will override hexo.config.responsive
    this.opts = getOptions(opts || hexo.config.responsive)
    this.filters = [
      new PostFilter(this),
      new InjectFilter(this)
    ]
    this.processor = new ImageProcessor(this.opts)
    this._tasks = {}
  }

  register () {
    this.filters.forEach((f) => f.register())
  }

  queueImages (id, images) {
    // TODO: throw error on duplication
    this.hexo.log.info(`Queue ${images.length} images from: ${id}`)
    let task = Promise.map(images, (img) => this.processor.process(img))
      .reduce((all, curr) => all.concat(curr), [])
    // TODO: handle image errors
    // TODO: generate routes for newly created images
    this._tasks[id] = task
  }

  waitForImages (id) {
    this.hexo.log.info(`Get task: ${id}`)
    return this._tasks[id]
  }
}
