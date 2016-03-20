if (!global._babelPolyfill) require('babel-polyfill')

import Responsive from './responsive'

let responsive = hexo.responsive = new Responsive(hexo)
responsive.register()
