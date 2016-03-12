# hexo-responsive-image [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Responsive images for Hexo.

## Usage

### Install

```bash
$ npm install --save hexo-responsive-image
```

You'll also need to install [Graphics Magick](http://www.graphicsmagick.org/).

Any images referenced in your posts will be processed and rendered into multiple resolutions.
`<img>` tags will be replaced with responsive `<picture>` tags.

### Config (optional)

In your site's `_config.yml`:
```yaml
# Default options
responsive:
  front_matter_fields: []
  file_name_pattern: ":name-:hash-:width-:type:ext"
  media_template: "(min-width: <%= opts.width %>px)"
  srcset:
    large:
      width: 1024
    medium:
      width: 640
      default: true
    small:
      width: 320
```

Notes:
* If specified in `front_matter_fields`, a new `xxx_responsive` field will be generated for field `xxx`. `xxx` should contain a string that is a valid image `src`. This is useful for theme developers.
