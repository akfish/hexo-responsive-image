export default class PostFilter {
  constructor (responsive) {
    this.responsive = responsive
    this.hexo = responsive.hexo
  }
  register () {
    let { filter } = this.hexo.extend
    filter.register('before_post_render', this._process.bind(this))
    filter.register('after_post_render', this._apply.bind(this))
  }
  _process (data) {
    // TODO: extract all images in content
    // TODO: extract images from fields in front matter specified by config
    // this.responsive.queueImages(data.id, images)
    // In processor:
  }
  _apply (data) {
    return this.responsive.waitForImages(data.id)
      .then((images) => {
        // TODO: extract all <img> tags in rendered HTML
        // TODO: find srcsets by url
        // TODO: replace with <picture>
      })
  }
}
