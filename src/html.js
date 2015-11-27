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

  get config() {
    return Document.config()
  }

  get query() {
    return Document.query(this.html)
  }

  get main() {
    return Document.main(this.html)
  }

  get removed() {
    return Document.scrub(this.html)
  }

  get filtered() {
    return Document.filtered(this.html)
  }

  static config() {
    return env.current().view
  }

  static query(html: String) {
    return cheerio.load(html)
  }

  static main(html: String): String {
    return Document.query(html)(Document.config().elements.main || '*')
  }

  static select(html: String, configKey: String): String {
    const config   = Document.config().elements[configKey]
    const selector = Document.query(html)

    if (_.isArray(config) && !_.isEmpty(config)) {
      return selector(config.join(', '))
    }

    return selector
  }

  static remove(html: String): String {
    return Document.select(html, 'scrub').remove()
  }

  // TODO - add this to cheerio, do PR
  // static unwrap(html: String): String {
  //   return Document.selector(html, 'unwrap').unwrap()
  // }

  static filter(html: String): String {
    const mainElems  = Document.main(html)
    const finalElems = Document.remove(mainHtml)

    return finalElems.html()
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

  static fromBlueprint(blueprint: Blueprint): Promise {
    return new Promise((resolve, reject) => {
      log('aglio').info('creating html from API blueprint')

      if (blueprint instanceof Blueprint) {
        const locals  = {blot: env, fixtures: blueprint.fixtures()}
        const options = _.merge({locals}, Document.config().view.options)

        aglio.render(blueprint.compiled.markdown, options, (err, html, warnings) => {
          if (warnings)
            log('aglio').warn(`${warnings}`)

          if (!err) {
            log('aglio').info('parsed as html')

            resolve(new Document(html).filtered)
          } else {
            log('aglio').error(`${err}`)

            reject(err)
          }
        })
      } else {
        reject('must provide a valid API blueprint')
      }
    })
  }

}

export const log = (sub) => logger().child({module: sub ? `html.${sub}` : 'html'})
