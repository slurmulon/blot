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

  static query(html: String): Object {
    return cheerio.load(html)
  }

  static select(html: String, configKey: String): Object {
    const config   = Document.config().elements[configKey]
    const selector = Document.query(html)

    if (_.isArray(config) && !_.isEmpty(config)) {
      return selector(config.join(' ').trim())//.get() // ', '
    } else if (_.isString(config)) {
      return selector(config)
    }

    return selector//.get()
  }

  static container(html: String): Object {
    log().info('extracting main container element')

    // TODO - incorporate Booleans elements.scripts, elements.comments
    const elem  = Document.config().elements.container
    const query = Document.select(html, 'container')

    return query
    // return query.get()
  }

  // FIXME - has issues, filtering all elems
  static stripped(html: String): Object {
    log().info('stripping configured elements')

    return Document.query(html)
    // return Document.select(html, 'strip').not()
  }

  // TODO - add this to cheerio, do PR
  // static unwrap(html: String): String {
  //   return Document.selector(html, 'unwrap').unwrap()
  // }

  static filtered(html: String): Object { // TODO - change to 'process'
    log().info('applying HTML filters')

    const containerDom = Document.container(html)
    const finalDom = Document.stripped(containerDom)

    return containerDom //finalDom 
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
