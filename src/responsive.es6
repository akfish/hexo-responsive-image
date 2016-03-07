import _ from 'underscore'
import PostFilter from './filter/post'
import InjectFilter from './filter/inject'

const DEFAULT_OPTS = {

}

export default class Responsive {
  constructor (hexo, opts) {
    this.hexo = hexo
    this.opts = _.defaults({}, opts, DEFAULT_OPTS)
    this.filters = [
      new PostFilter(this),
      new InjectFilter(this)
    ]
  }

  register () {
    this.filters.forEach((f) => f.register())
  }

  queueImages (id, images) {
    // TODO: check if images are processed, if not, do so
    // TODO: store processing results
    // TODO: store promises id => Promise.all([image_promises])
  }

  waitForImages (id) {
    // TODO: find the promise by id
  }
}

Responsive.DEFAULT_OPTS = DEFAULT_OPTS
