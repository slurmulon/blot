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

  constructor(data: String) {
    this.data = data
  }

  get config() {
    return Document.config()
  }

  get query() {
    return Document.query(this.data)
  }

  static config() {
    return env.current().view
  }

  static query(data: String) {
    return cheerio.load(data)
  }

  static main(data: String): String {
    return Document.query(data)(Document.config().elems.main || '*') 
  }

  static scrub(data: String): String {
    const config = Document.config().elems.scrub

    // TODO - also check elems.comments config
    if (_.isArray(config) && !_.isEmpty(config)) {
      return Document.query(data)(config.join(' '))
    }

    return data
  }

  static dest(data: String) {
    // TODO
  }

  static fromBlueprint(blueprint: Blueprint): Promise {
    return new Promise((resolve, reject) => {
      log().info('creating html from blueprint')

      if (blueprint instanceof Blueprint) {
        // aglio configuraton (options) and template variables (locals)
        const locals  = {locals: {blot: env, fixtures: blueprint.fixtures()}}
        const options = Object.assign(locals, Document.config().view.theme)

        aglio.render(blueprint.compiled.markdown, options, (err, html, warnings) => {
          if (warnings) {
            log('aglio').warn(`${warnings}`)
          }

          if (!err) {
            log('aglio').info('created html')

            resolve(new Document(html))
          } else {
            log('aglio').error(`${err}`)

            reject(err)
          }
        })
      } else {
        reject('must provide valid API blueprint')
      }
    })
  }

}

export const log = (sub) => logger().child({module: sub ? `html.${sub}` : 'html'})
