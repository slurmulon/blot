'use strict'

import {Blueprint} from './apib'
import * as env from './env'
import * as io from './io'

import hazy from 'hazy'
import cheerio from 'cheerio'
import aglio from 'aglio'

import _ from 'lodash'

import {logger} from './log'

export class Document {

  constructor(html: String) {
    this.html = html
  }

  get config(): Object {
    return Document.config()
  }

  get query(): Object {
    return Document.query(this.html)
  }

  get main(): String {
    return Document.main(this.html)
  }

  get stripped(): String {
    return Document.stripped(this.html)
  }

  get filtered(): String {
    return Document.filtered(this.html)
  }

  dest(filepath?: String, html?: String): Promise {
    return Document.dest(filepath || this.config.dest, html || this.html)
  }

  static config(): Object {
    return env.current().view
  }

  static elementConfig(configKey: String): Object {
    const config = Document.config().elements[configKey]

    if (_.isArray(config) && !_.isEmpty(config)) {
      return config.length > 1 ? config.join(', ').trim() : config[0]
    }

    return config
  }

  static query(html: String): Object {
    return cheerio.load(html)
  }

  static container(html: String): Object {
    log().info('extracting main container element')

    const selector = Document.elementConfig('container')
    const query    = Document.query(html)(selector)

    return query
  }

  static stripped(html: String): Object {
    log().info('stripping configured elements')

    const selector = Document.elementConfig('strip')
    const query    = Document.query(html)

    if (selector)
      query(selector).remove()

    return query
  }

  static filtered(html: String): Object { // TODO - change to 'process'
    log().info('applying HTML filters')

    const containerDom = Document.container(html)
    const bakedDom = Document.stripped(containerDom.html())

    return bakedDom
  }

  static dest(filepath: String, html: String): Promise {
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

  static fromBlueprints(blueprints: Array): Promise {
    return Promise.all(blueprints.map(bp => Document.fromBlueprint(bp)))
  }

  static fromBlueprint(blueprint: Blueprint): Promise {
    return new Promise((resolve, reject) => {
      log('aglio').info('creating html from API blueprint')

      if (blueprint instanceof Blueprint && blueprint.compiled) {
        const locals  = {blot: env.current().name, fixtures: blueprint.compiled.fixtures}
        const options = _.merge({locals}, Document.config().options)

        aglio.render(blueprint.compiled.markdown, options, (err, html, warnings) => {
          if (!_.isEmpty(warnings)) {
            log('aglio').warn(`aglio warned: ${warnings}`)
          }

          if (!err) {
            log('aglio').info('parsed as html')

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

export const log = (sub) => logger().child({module: sub ? `html.${sub}` : 'html'})
