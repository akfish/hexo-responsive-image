import _ from 'underscore'
import Promise from 'bluebird'
import PostFilter from './filter/post'
import ImageProcessor from './processor'
import ImageGenerator from './generator/image'
import { getOptions } from './option'

export default class Responsive {
  constructor (hexo, opts) {
    this.hexo = hexo
    // opts will override hexo.config.responsive
    this.opts = getOptions(opts || hexo.config.responsive)
    this._imageGenerator = new ImageGenerator(this)
    this._postFilter = new PostFilter(this)
    this.plugins = [
      this._postFilter,
      this._imageGenerator
    ]
    this.processor = new ImageProcessor(this.opts)
    this._tasks = {}
  }

  register () {
    this.plugins.forEach((f) => f.register())
  }

  handleError (data, images) {
    let { log } = this.hexo
    let errors = {}
    let errorCount = 0
    images.forEach(({ srcset, src }) => {
      let errs = srcset.filter((i) => i.status === 'error')
      if (errs.length > 0) {
        errorCount += errs.length
        errors[src] = errs
      }
    })
    log.info(`[hexo-responsive-image] <${data.title}> processed ${images.length} images with ${errorCount} errors`)
    if (errorCount > 0) {
      _.each(errors, (errs, img) => {
        log.error(img)
        errs.forEach((e) => log.error('> ' + e.error.message))
      })
    }
  }

  handleCreated (data, images) {
    images.forEach(({ srcset }) => {
      let created = srcset.filter((i) => i.status === 'created')
      created.forEach((img) => {
        this._imageGenerator.push(img)
      })
    })
  }

  queueImages (data, images) {
    let { log } = this.hexo
    let id = data._id
    images = _.uniq(images, (img) => img.src)
    // TODO: throw error on duplication
    log.info(`Queue ${images.length} images from: ${id}`)
    let task = Promise.map(images, (img) => this.processor.process(img))
      .reduce((all, curr) => all.concat(curr), [])
      .tap((images) => this.handleError(data, images))
      .tap((images) => this.handleCreated(data, images))
    // TODO: generate routes for newly created images
    this._tasks[id] = task
  }

  waitForImages (id) {
    this.hexo.log.info(`Get task: ${id}`)
    return this._tasks[id]
  }
}
