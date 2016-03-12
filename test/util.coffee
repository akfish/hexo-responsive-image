Promise = require('bluebird')
path = require('path')
Responsive = require('../src/responsive')

module.exports =
  initHexo: (name, opts = register: true) ->
    site_dir = "./test/site"
    if !fs.existsSync(site_dir) then throw new Error("Test site not found. Run `gulp asset:test` first.")
    base_dir = path.join(__dirname, name)
    hexo = new Hexo(base_dir, silent: true)
    responsive = new Responsive(hexo)
    if opts.register
      responsive.register()

    setup = ->
      fs.copyDir(site_dir, base_dir).then(-> hexo.init())
        .then(->
          Promise.map([
            'hexo-renderer-marked'
            'hexo-renderer-ejs'
          ], (m) -> hexo.loadPlugin(require.resolve(m)))
        )

    teardown = ->
      fs.rmdir(base_dir)

    deployAssets = (src, relative_dst) ->
      dst = path.join(base_dir, relative_dst)
      fs.copyDir(src, dst)

    locals = ->
      hexo.locals.invalidate()
      hexo.locals.toObject()

    return {
      base_dir,
      hexo,
      setup,
      teardown,
      deployAssets,
      locals,
      responsive
    }
