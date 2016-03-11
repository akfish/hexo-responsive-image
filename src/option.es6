import _ from 'underscore'

export const DEFAULT_OPTS = {
  front_matter_fields: [],
  file_name_pattern: ':name-:hash-:width-:type:ext',
  media_template: '(min-width: <%= opts.width %>px)',
  srcset: {
    large: {
      width: 1024
    },
    medium: {
      width: 640,
      default: true
    },
    small: {
      width: 320
    }
  }
}

function compileMediaTemplate (opts) {
  if (_.isString(opts.media_template)) opts.media = _.template(opts.media_template)
  _.each(opts.srcset, (o) => {
    if (_.isString(o.media_template)) o.media = _.template(o.media_template)
  })
  return opts
}

export function getOptions (opts) {
  opts = _.defaults({}, opts, DEFAULT_OPTS)
  return compileMediaTemplate(opts)
}
