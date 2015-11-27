'use strict'

import {Blueprint} from './apib'
import * as env from './env'

import hazy from 'hazy'
import cheerio from 'cheerio'
import aglio from 'aglio'

import _ from 'lodash'

import {logger} from './log'

// https://www.npmjs.com/package/html-parser#using-callbacks
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

  static config() {
    return env.current().view
  }

  static query(html: String) {
    return cheerio.load(html)
  }

  static main(html: String): String {
    return Document.query(html)(Document.config().elems.main || '*')
  }

  static scrub(html: String): String {
    const config = Document.config().elems.scrub

    // TODO - also check elems.comments config
    if (_.isArray(config) && !_.isEmpty(config)) {
      return Document.query(html)(config.join(' '))
    }

    return html
  }

  static dest(html: String) {
    // TODO
  }

  static fromBlueprint(blueprint: Blueprint): Promise {
    return new Promise((resolve, reject) => {
      log().info('creating html from blueprint')

      if (blueprint instanceof Blueprint) {
        // aglio configuraton (options) and template variables (locals)
        const locals  = {locals: {blot: env, fixtures: blueprint.fixtures()}}
        const options = _.merge(locals, Document.config().view.theme)

        aglio.render(blueprint.compiled.markdown, options, (err, html, warnings) => {
          if (warnings)
            log('aglio').warn(`${warnings}`)

          if (!err) {
            log('aglio').info('created html')
            resolve(new Document(html))
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
