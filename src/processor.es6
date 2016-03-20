if (!global._babelPolyfill) require('babel-polyfill')

import Promise from 'bluebird'
import path from 'path'
import _ from 'underscore'
import fs from 'hexo-fs'
import gm from 'gm'
import { createHash } from 'crypto'
import Pattern from './util/pattern'

Promise.promisifyAll(gm.prototype)

export default class ImageProcessor {
  constructor (opts = {}) {
    this.opts = opts
    this._tasks = {}
  }
  async _loadImage ({ absoluteSrc }) {
    let buf = await fs.readFile(absoluteSrc, { encoding: null, escape: false })
    let hash = createHash('sha256')
    hash.update(buf)

    let sha = hash.digest('hex')
    return [buf, sha]
  }
  _getFileNames (image, sha) {
    let { srcset, file_name_pattern } = this.opts
    let { absoluteSrc, src } = image
    let srcBase = path.posix.dirname(src)
    let hash = sha.substr(0, 6)
    let ext = path.extname(absoluteSrc)
    let fullName = path.basename(absoluteSrc)
    let base = path.dirname(absoluteSrc)
    let name = fullName.substr(0, fullName.length - ext.length)
    let args = { ext, name, hash }
    let pattern = Pattern.parse(file_name_pattern)

    return _.map(srcset, (o, type) => {
      let fileName = pattern.stringify(_.extend(args, o, { type }))
      let filePath = path.resolve(base, fileName)
      let src = path.posix.join(srcBase, fileName)
      return {
        type,
        src,
        opts: o,
        base,
        fileName,
        filePath
      }
    })
  }
  async _doResize (buf, dstFileInfo) {
    let { filePath, fileName, opts } = dstFileInfo
    let g = gm(buf)
    let size = await g.sizeAsync()

    if (size.width < opts.width || size.height < opts.height) throw new RangeError(`Cannot generate ${fileName}: original image is too small`)
    g.resize(opts.width, opts.height, '^')
    await g.writeAsync(filePath)

    return { status: 'created' }
  }
  async _resize (buf, dstFileInfo) {
    try {
      let { filePath } = dstFileInfo
      let exists = await fs.exists(filePath)
      let { status } = exists ? { status: 'cached' } : await this._doResize(buf, dstFileInfo)
      dstFileInfo.status = status
    } catch (e) {
      dstFileInfo.status = 'error'
      dstFileInfo.error = e
    }

    return dstFileInfo
  }
  async _process (image) {
    let [ buf, sha ] = await this._loadImage(image)
    let dstFiles = this._getFileNames(image, sha)
    image.srcset = await Promise.map(dstFiles, (file) => this._resize(buf, file))
    return image
  }
  process (image) {
    let task = this._tasks[image.absoluteSrc]

    // lookup existing promise by path
    if (task) return task

    this._tasks[image.absoluteSrc] = task = this._process(image)

    return task
  }
}
