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
  _loadImage ({ absoluteSrc }) {
    return fs.readFile(absoluteSrc, { encoding: null, escape: false })
      .then((buf) => {
        let hash = createHash('sha256')
        hash.update(buf)

        let sha = hash.digest('hex')
        return [buf, sha]
      })
  }
  _getFileNames (image, sha) {
    let { sizes, file_name_pattern } = this.opts
    let { absoluteSrc } = image
    let hash = sha.substr(0, 6)
    let ext = path.extname(absoluteSrc)
    let fullName = path.basename(absoluteSrc)
    let base = path.dirname(absoluteSrc)
    let name = fullName.substr(0, fullName.length - ext.length)
    let args = { ext, name, hash }
    let pattern = Pattern.parse(file_name_pattern)

    return _.map(sizes, (o, type) => {
      let fileName = pattern.stringify(_.extend(args, o, { type }))
      let filePath = path.resolve(base, fileName)
      return {
        type,
        opts: o,
        base,
        fileName,
        filePath
      }
    })
  }
  _doResize (buf, dstFileInfo) {
    let { filePath, fileName, opts } = dstFileInfo
    let g = gm(buf)
    return g.sizeAsync()
      .then((size) => {
        if (size.width < opts.width || size.height < opts.height) throw new RangeError(`Cannot generate ${fileName}: original image is too small`)
        g.resize(opts.width, opts.height, '^')
        return g.writeAsync(filePath)
      })
      .then(() => ({ status: 'created' }))
  }
  _resize (buf, dstFileInfo) {
    let { filePath } = dstFileInfo
    return fs.exists(filePath)
      .then((exists) => {
        return exists ? { status: 'cached' } : this._doResize(buf, dstFileInfo)
      })
      .then(({ status }) => {
        dstFileInfo.status = status
        return dstFileInfo
      })
      .catch((e) => {
        dstFileInfo.status = 'error'
        dstFileInfo.error = e
        return dstFileInfo
      })
  }
  process (image) {
    let task = this._tasks[image.absoluteSrc]

    // lookup existing promise by path
    if (task) return task

    this._tasks[image.absoluteSrc] = task = this._loadImage(image)
      .spread((buf, sha) => {
        let dstFiles = this._getFileNames(image, sha)
        return Promise.map(dstFiles, (file) => this._resize(buf, file))
      })
      .then((srcset) => {
        image.srcset = srcset
        return image
      })

    return task
  }
}
