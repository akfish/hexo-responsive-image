import _ from 'underscore'
import Promise from 'bluebird'
import PostFilter from './filter/post'
import InjectFilter from './filter/inject'
import ImageProcessor from './processor'

const DEFAULT_OPTS = {
  front_matter_fields: [],
  file_name_pattern: ':name-:hash-:width-:type:ext',
  sizes: {
    large: {
      width: 1024
      // media: '(min-width: 36em)'
    },
    medium: {
      width: 640
    },
    small: {
      width: 320
    }
  }
}

export default class Responsive {
  constructor (hexo, opts) {
    this.hexo = hexo
    this.opts = _.defaults({}, opts, DEFAULT_OPTS)
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
    this._tasks[id] = task
  }

  waitForImages (id) {
    this.hexo.log.info(`Get task: ${id}`)
    return this._tasks[id]
  }
}

Responsive.DEFAULT_OPTS = DEFAULT_OPTS
