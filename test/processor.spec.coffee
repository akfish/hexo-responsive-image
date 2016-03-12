Processor = require('../src/processor')
{ ImageTag } = require('../src/parser/token')
{ DEFAULT_OPTS, getOptions } = require('../src/option')
path = require('path')
_ = require('underscore')

describe "Processor", ->
  processor = new Processor(DEFAULT_OPTS)
  asset_dir = path.join(__dirname, 'asset')
  tmp_dir = path.join(__dirname, 'test_processor')

  foo_expected_files =
    large: 'foo-02a7b7-1024-large.jpg'
    medium: 'foo-02a7b7-640-medium.jpg'
    small: 'foo-02a7b7-320-small.jpg'

  baz_expected_files =
    large: 'baz-eab4bf-1024-large.jpg'
    medium: 'baz-eab4bf-640-medium.jpg'
    small: 'baz-eab4bf-320-small.jpg'

  before ->
    fs.mkdirs(tmp_dir)
      .then -> fs.copyDir(asset_dir, tmp_dir)

  after ->
    fs.rmdir(tmp_dir)

  mockImage = (src) ->
    image = new ImageTag(null, 'mock')
    image.src = src
    image.absoluteSrc = path.join(tmp_dir, 'source', src)

    image

  it "should process an image into multiple sizes", ->
    this.timeout(0)
    img = mockImage('/images/foo.jpg')

    processor.process(img)
      .then (img) ->
        img.srcset.should.be.an('array').of.length(3)
        img.srcset.forEach (s) ->
          s.status.should.equal('created')
          s.fileName.should.equal(foo_expected_files[s.type])
          fs.exists(s.filePath).should.eventually.be.true

  it "should skip if an image is already processed", ->
    this.timeout(0)
    another_processor = new Processor(DEFAULT_OPTS)
    img = mockImage('/images/foo.jpg')

    another_processor.process(img)
      .then (img) ->
        img.srcset.should.be.an('array').of.length(3)
        img.srcset.forEach (s) ->
          s.status.should.equal('cached')
          s.fileName.should.equal(foo_expected_files[s.type])
          fs.exists(s.filePath).should.eventually.be.true

  it "should process each file exactly once", ->
    this.timeout(0)
    img = mockImage('/images/bar.jpg')

    p1 = processor.process(img)
    p2 = processor.process(img)

    p1.should.equal(p2)

    p1

  it "should skip sizes that are larger than the original", ->
    this.timeout(0)
    img = mockImage('/images/baz.jpg')

    processor.process(img)
      .then (img) ->
        img.srcset.should.be.an('array').of.length(3)
        img.srcset.forEach (s) ->
          s.fileName.should.equal(baz_expected_files[s.type])
          if s.type == 'large'
            s.status.should.equal('error')
            fs.exists(s.filePath).should.eventually.be.false
          else
            s.status.should.equal('created')
            fs.exists(s.filePath).should.eventually.be.true

  it "should generate HTML tag from processed image", ->
    this.timeout(0)
    foo = mockImage('/images/foo.jpg')

    expected = "<picture><source srcset='/images/foo-02a7b7-1024-large.jpg' media='(min-width: 1024px)'><source srcset='/images/foo-02a7b7-640-medium.jpg' media='(min-width: 640px)'><source srcset='/images/foo-02a7b7-320-small.jpg' media='(min-width: 320px)'><img src='/images/foo-02a7b7-640-medium.jpg' alt=\"\" /></picture>"
    processor.process(foo)
      .then (foo) ->
        foo.toHTML(getOptions()).should.equal(expected)
