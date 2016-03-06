'use strict'

import {Blueprint} from './apib'
import * as env from './env'
import * as io from './io'

import hazy from 'hazy'
import cheerio from 'cheerio'
import aglio from 'aglio'

import {logger} from './log'

/**
 * Represents a collection of HTML DOM elements.
 * Contains functionality for working with API Blueprints
 * and their view representations.
 */
export class Document {

  /**
   * @param {String} html encoded HTML string
   */
  constructor(html: String) {
    this.html = html
  }

  /**
   * Provides project configuration options for HTML views
   *
   * @returns {Object}
   */
  get config(): Object {
    return Document.config()
  }

  /**
   * Returns a jQuery-like version of internal HTML
   *
   * @returns {$}
   */
  get query(): Object {
    return Document.query(this.html)
  }

  /**
   * Returns the container object of a template
   * if one is configured in environment/project
   *
   * @returns {$}
   */
  get container(): Object {
    return Document.container(this.html)
  }

  /**
   * Strips out elements from HTML based on
   * environment/project configuration
   *
   * @returns {$}
   */
  get stripped(): Object {
    return Document.stripped(this.html)
  }

  /**
   * Processes all element configuration filters against HTML
   * and returns the resulting document
   *
   * @returns {$}
   */
  get processed(): Object {
    return Document.process(this.html)
  }

  /**
   * Writes out compiled HTML to a filepath (UTF-8)
   *
   * @param {?String} filepath
   * @param {?String} html
   * @returns {Promise}
   */
  dest(filepath?: String, html?: String): Promise {
    return Document.dest(filepath || this.config.dest, html || this.html)
  }

  /**
   * Provides environment configuration options for HTML views
   *
   * @returns {Object}
   */
  static config(): Object {
    return env.current().view
  }

  /**
   * Determines element selector from environment/project configuration key
   *
   * @param {?String} configKey top-level key of "views.element" in config file
   * @returns {Object}
   */
  static elementConfig(configKey: String) {
    const config = Document.config().elements[configKey]

    if (_.isArray(config) && !_.isEmpty(config)) {
      return config.length > 1 ? config.join(', ').trim() : config[0]
    }

    return config
  }

  /**
   * Returns a jQuery-like version of internal HTML
   *
   * @param {String} html
   * @returns {$}
   */
  static query(html: String): Object {
    return cheerio.load(html)
  }

  /**
   * Returns the container object of a template
   * if one is configured in environment/project
   *
   * @param {String} html
   * @returns {$}
   */
  static container(html: String): Object {  
    log('$').info('extracting main container element')

    const selector = Document.elementConfig('container')

    if (html && selector) {
      return Document.query(html)(selector)
    }

    return Document.query(html)
  }

  /**
   * Plucks out and reduces elements from HTML based on
   * environment/project configuration
   *
   * @param {String} html
   * @returns {$}
   */
  static pluck(html: String): Object {
    log('$').info('plucking configured elements')
    
    const selector = Document.elementConfig('pluck')
    const query    = Document.query

    if (html && selector) {
      return query(
        selector
          .split(',')
          .map($ => query(html)($).map((i, elem) => query(elem).html()).get())
          .reduce((a,b) => a + b)
      )
    } else {
      return query(html)
    }
  }

  /**
   * Strips out (removes) elements from HTML based on
   * environment/project configuration
   *
   * @param {String} html
   * @returns {$}
   */
  static strip(html: String): Object {
    log('$').info('stripping configured elements')

    if (html) {
      const selector = Document.elementConfig('strip')
      const query    = Document.query(html)

      if (selector)
        query(selector).remove()

      return query
    } else {
      return Document.query(html)
    }
  }

  /**
   * Performs templated regex replacements on HTML based on
   * environment/project configuration.
   *
   * Matches may be dynamically referenced in templates
   * by referencing the interpolation token |=$match|
   *
   * @param {String} html
   * @returns {String} resulting HTML
   */
  static replace(html: String): String {
    log('$').info('replacing configured elements')

    if (html) {
      const replace = Document.config().replace
      let result = html

      if (_.isArray(replace)) {
        replace.forEach(conf => {
          const pattern  = new RegExp(conf.match, 'gi')
          const template = conf.template

          if (pattern && template) {
            result = result.replace(pattern, ($match, ...$sub) =>
              hazy.lang.evaluate(template, {$match, $sub})
            )
          } else {
            log('$').warn('malformed element replacement configuration', conf)
          }
        })
      }

      return result //Document.query(result) // FIXME - cheerio is escaping only replacements, wut?
    }

    return html // Document.query(html)
  }

  /**
   * Processes all element configuration filters against HTML
   * and returns the resulting HTML string
   *
   * @param {String} html
   * @returns {String}
   */
  static process(html: String): String {
    log('$').info('processing HTML elements')

    if (Document.config().elements) {
      const containerDom = Document.container(html)
      const pluckedDom   = Document.pluck(containerDom.html())
      const strippedDom  = Document.strip(pluckedDom.html())
      const bakedHtml    = Document.replace(strippedDom.html())

      return bakedHtml
    }

    return html
  }

  /**
   * Writes out compiled HTML to a filepath (UTF-8)
   *
   * @param {String} filepath
   * @param {String} html
   * @returns {Promise}
   */
  static dest(filepath: String, html: String): Promise {
    log('$').info('writing out HTML')

    return new Promise((resolve, reject) => {
      if (filepath) {
        io.util.fs
          .dest(filepath, html)
          .then(resolve)
          .catch(reject)
      } else {
        reject('HTML filepath required')
      }
    })
  }

  /**
   * Converts a collection of compiled Blueprints
   * into HTML via Aglio
   *
   * @param {Array<Blueprint>} blueprints
   * @returns {Promise}
   */
  static fromBlueprints(blueprints: Array): Promise {
    return Promise.all(
      blueprints.map(Document.fromBlueprint)
    )
  }

  /**
   * Converts a compiled Blueprint into HTML via Aglio
   *
   * @param {Blueprint} blueprint
   * @returns {Promise}
   */
  static fromBlueprint(blueprint: Blueprint): Promise {
    log('aglio').info('creating HTML from API blueprint')

    return new Promise((resolve, reject) => {
      if (blueprint instanceof Blueprint && blueprint.compiled) {
        const locals  = {blot: env.current().name, fixtures: blueprint.compiled.fixtures}
        const options = _.merge({locals}, Document.config().options)

        aglio.render(blueprint.compiled.markdown, options, (err, html, warnings) => {
          if (!_.isEmpty(warnings)) {
            log('aglio').warn(`aglio warned: ${warnings}`)
          }

          if (!err) {
            log('aglio').info('parsed HTML')

            resolve(new Document(html))
          } else {
            log('aglio').error(`aglio errored: ${err}`)

            reject(err)
          }
        })
      } else {
        reject('compiled API blueprint required')
      }
    })
  }

}

/**
 * Module-level bunyan logger
 */
export const log = (sub) => logger().child({module: sub ? `html.${sub}` : 'html'})
