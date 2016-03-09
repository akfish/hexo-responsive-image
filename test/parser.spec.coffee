Parser = require('../src/parser')
_ = require('underscore')

describe "Parser", ->
  opts = front_matter_fields: ["bar", "foo"]
  parser = new Parser(opts)
  results = null
  content = """
  {% asset_img asset_img.jpg This is an example image %}
  {% asset_img "spaced asset_img.jpg" "spaced title" %}
  {% img foo /path/to/tag_img %}
  {% img /path/to/tag_img title alt %}
  <img src="/path/to/img" alt="foo"   />
  <img />
  ![](/path/to/md_img1)
  ![Alt text](/path/to/md_img2.jpg)
  ![Alt text](/path/to/md_img3.jpg "Optional title")
  """
  data =
    foo: "/path/to/foo"
    bar: "/path/to/bar"
    barz: "not an image"
    content: content

  checkRange = ({ start, length, content: actual }) ->
    actual.should.equal(content.substr(start, length))

  before ->
    results = _.groupBy(parser.parseData(data), "type")

  it "should parse Markdown images", ->
    { markdown } = results
    markdown.should.be.an('array').of.length(3)
    [
      {
        type: 'markdown'
        alt: ''
        src: '/path/to/md_img1'
        title: undefined
      }
      {
        type: 'markdown'
        alt: 'Alt text'
        src: '/path/to/md_img2.jpg'
        title: undefined
      }
      {
        type: 'markdown'
        alt: 'Alt text'
        src: '/path/to/md_img3.jpg'
        title: 'Optional title'
      }
    ].forEach (exp) ->
      actual = markdown.find(({ src }) -> src == exp.src)
      checkRange(actual.range)
      _.omit(actual, 'range').should.deep.equal(exp)

  it "should parse <img> tags", ->
    { html } = results
    html.should.be.an('array').of.length(2)
    [
      {
        type: 'html'
      }
      {
        type: 'html'
        alt: 'foo'
        src: '/path/to/img'
      }
    ].forEach (exp) ->
      actual = html.find(({ src }) -> src == exp.src)
      checkRange(actual.range)
      _.omit(actual, 'range').should.deep.equal(exp)

  it "should parse Hexo image tags"

  it "should extract front matter fields as configured", ->
    { front_matter } = results
    { front_matter_fields } = opts

    front_matter.should.be.an('array').of.length(front_matter_fields.length)

    opts.front_matter_fields.forEach (key_name) ->
      front_matter.find(({ key }) -> key == key_name)
        .should.deep.equal {
          type: 'front_matter'
          key: key_name
          src: data[key_name]
        }

  it "should tokenize text", ->
    tokens = parser.tokenize(content)
    text = ""
    tokens.forEach ({ range }) ->
      checkRange(range)
      text += range.content

    text.should.equal(content)
