export default class Inject {
  constructor ({ hexo }) {
    this.hexo = hexo
  }
  register () {
    let { filter } = this.hexo.extend
    filter.register('inject_ready', this._transform.bind(this))
  }
  _transform (inject) {
    inject.headEnd.require('../../node_modules/picturefill/dist/picturefill.min.js', {
      inline: false
    })
  }
}
