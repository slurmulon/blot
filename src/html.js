'use strict'

import {Blueprint} from './apib'
import * as env from './env'
import * as io from './io'

import hazy from 'hazy'
import cheerio from 'cheerio'
import aglio from 'aglio'
import _ from 'lodash'

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
   * @param {?String} html
   * @returns {Promise}
   */
  static elementConfig(configKey: String): Object {
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
    const query    = Document.query(html)(selector)

    return query
  }

  /**
   * Strips out elements from HTML based on
   * environment/project configuration
   *
   * @param {String} html
   * @returns {$}
   */
  static strip(html: String): Object {
    log('$').info('stripping configured elements')

    const selector = Document.elementConfig('strip')
    const query    = Document.query(html)

    if (selector)
      query(selector).remove()

    return query
  }

  /**
   * Processes all element configuration filters against HTML
   * and returns the resulting document
   *
   * @param {String} html
   * @returns {$}
   */
  static process(html: String): Object {
    log('$').info('processing HTML elements')

    const containerDom = Document.container(html)
    const bakedDom     = Document.strip(containerDom.html())

    return bakedDom
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
      blueprints.map(bp => Document.fromBlueprint(bp))
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
