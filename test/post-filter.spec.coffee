util = require('./util')
_ = require('underscore')
path = require('path')
sinon = require('sinon')

describe "Post Filters", ->
  h = {hexo, locals, responsive, base_dir} = util.initHexo('test_filter', register: false)
  filter = responsive._postFilter

  posts = null
  image_post = null

  before ->
    this.timeout(0)
    h.setup()
      # .then(-> hexo.call('generate', {}))
      .then(-> hexo.load())
      .then(->
        posts = locals().posts
        image_post = posts.data.find((p) -> p.title == 'Images')
      )

  after ->
    this.timeout(0)
    h.teardown()

  describe "before_post_render", ->
    it "should enqueue images in post data for processing", ->
      sinon.stub(responsive, 'queueImages')
      filter._process(image_post)
        .then (data) ->
          data.should.equal(image_post)
          responsive.queueImages.calledOnce.should.be.true
          [d, images] = responsive.queueImages.getCall(0).args
          d.should.equal(data)
          images.should.be.an('array').of.length(4)
          images.forEach (img) ->
            img.type.should.equal('html')
            img.resolved.should.be.true
            fs.exists(img.absoluteSrc).should.eventually.be.true

        .finally ->
          responsive.queueImages.restore()

    it "should resolve image path in site source", ->
      img = src: '/images/foo.jpg'
      filter._resolveImagePath(img)
        .should.eventually.deep.equal(_.extend(img, {
          resolved: true,
          absoluteSrc: path.join(base_dir, 'source', img.src)
        }))
    it "should resolve image path in theme source", ->
      img = src: '/css/images/banner.jpg'
      filter._resolveImagePath(img)
        .should.eventually.deep.equal(_.extend(img, {
          resolved: true,
          absoluteSrc: path.join(base_dir, 'themes/landscape/source', img.src)
        }))
    it "should not resolve invalid image path", ->
      img = src: '/not/a/valid/path.jpg'
      filter._resolveImagePath(img)
        .should.eventually.deep.equal(_.extend(img, resolved: false))
  describe "after_post_render", ->
    processed = null
    before ->
      this.timeout(0)
      responsive.opts.front_matter_fields = ['foo']
      filter._process(image_post)
        .then(-> filter._apply(image_post))
        .then((data) -> processed = data)
    it "should insert responsive image sources in post data", ->
      processed.images.should.be.an('array').of.length(3)
      processed.images.forEach (image) ->
        image.srcset.should.be.an('array')
    it "should provide xxx_responsive field for configured front-matter fields", ->
      { foo, foo_responsive } = processed
      foo_responsive.should.be.an('object')
      foo_responsive.src.should.equal(foo)
      foo_responsive.srcset.should.be.an('array').of.length(3)
    it "should replace <img> tags with responsive <picture> in renderer HTML", ->
      fs.writeFile('f:\\temp\\content.txt', processed.content)
      expected = """\
      <p>This is a image test post.</p>
      <p><picture><source srcset='/images/foo-02a7b7-1024-large.jpg' media='(min-width: 1024px)'><source srcset='/images/foo-02a7b7-640-medium.jpg' media='(min-width: 640px)'><source srcset='/images/foo-02a7b7-320-small.jpg' media='(min-width: 320px)'><img src='/images/foo-02a7b7-640-medium.jpg' alt="" /></picture></p>
      <p><picture><source srcset='/images/foo-02a7b7-1024-large.jpg' media='(min-width: 1024px)'><source srcset='/images/foo-02a7b7-640-medium.jpg' media='(min-width: 640px)'><source srcset='/images/foo-02a7b7-320-small.jpg' media='(min-width: 320px)'><img src='/images/foo-02a7b7-640-medium.jpg' alt="" /></picture></p>
      <p><picture><source srcset='/images/bar-02a7b7-1024-large.jpg' media='(min-width: 1024px)'><source srcset='/images/bar-02a7b7-640-medium.jpg' media='(min-width: 640px)'><source srcset='/images/bar-02a7b7-320-small.jpg' media='(min-width: 320px)'><img src='/images/bar-02a7b7-640-medium.jpg' alt="" /></picture></p>
      <p><picture><source srcset='/images/baz-eab4bf-640-medium.jpg' media='(min-width: 640px)'><source srcset='/images/baz-eab4bf-320-small.jpg' media='(min-width: 320px)'><img src='/images/baz-eab4bf-640-medium.jpg' alt="" /></picture></p>
      """
      processed.content.trim().should.equal(expected.trim())
