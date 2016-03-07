export default class Inject {
  constructor ({ hexo }) {
    this.hexo = hexo
  }
  register () {
    let { filter } = this.hexo.extend
    filter.register('after_render:html', this._transform.bind(this))
  }
  _transform (src) {

  }
}
