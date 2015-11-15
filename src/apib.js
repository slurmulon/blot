'use strict'

import hazy from 'hazy'
import protagonist from 'protagonist'
import hercule from 'hercule'

import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'

import {logger} from './log'

/**
 * Parses, transcludes and compiles API blueprint files
 * and their associated fixtures. Allows compiled
 * API blueprints to be exported to the filesystem
 */
export class Blueprint {

  /**
   * @param {String} markdown Valid API blueprint markdown
   */
  constructor(markdown: String) {
    this.markdown = markdown

    const markdownFuncs = ['compile', 'fixtures', 'interpolate', 'parse', 'transclude']

    markdownFuncs.forEach(method => {
      this[method] = () => Blueprint[method](this.markdown)
    })
  }

  /**
   * Compiles API blueprint markdown data by translcuding it and then parsing it for fixtures
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static compile(markdown: String): Promise {
    log.info('compiling contents')

    return Blueprint
      .transclude(markdown)
      .then(embedMd => Blueprint.interpolate(embedMd))
      .then(finalMd => Blueprint.fixtures(finalMd).then(fixtures =>
        Object.assign({compiled: {fixtures, markdown: finalMd}}, this)
      ))
  }

  /**
   * Extracts JSON fixtures from API blueprint markdown
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static fixtures(markdown: String): Promise {
    log.info('extracting fixtures')

    return new Promise((resolve, reject) => {
      let fixtures = []
      const jsonStrMatches = (markdown.match instanceof Function) ? markdown.match(plainJson) : []

      jsonStrMatches && jsonStrMatches.forEach(jsonStr => {
        try {
          const fixture = JSON.parse(jsonStr)

          fixtures.push(fixture)
        } catch (e) {
          log.warn(`attempted to parse invalid JSON in API blueprint: ${jsonStr}`, e)
        }
      })

      resolve(fixtures)
    })
  }

  /**
   * Parses markdown into a usable object via protagonist
   *
   * @param {String} markdown Valid API blueprint markdown
   */
  static parse(markdown: String): Promise {
    log.info('parsing content into protagonist object')

    return new Promise((resolve, reject) => {
      if (markdown) {
        protagonist.parse(markdown, (err, blueprint) => {
          if (!err) {
            resolve(blueprint)
          } else {
            reject(`failed to parse file as valid API blueprint: ${err}`)
          }
        })
      } else {
        reject(`markdown data required`)
      }
    })
  }

  /**
   * Scans API blueprint markdown for Hercule references and transcludes them
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static transclude(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      log.info('transcluding hercule content')

      if (markdown) {
        hercule.transcludeString(markdown, (transMd) => {
          if (transMd) {
            resolve(transMd)
          } else {
            reject('failed to parse markdown for Hercule transclusions')
          }
        })
      } else {
        reject('valid markdown required for transclusion')
      }
    })
  }

  /**
   * Interpolates markdown with relevant replacements. Uses hazy's random
   * fixture data interpolator by default
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static interpolate(markdown: String): Promise {
    log.info('interpolating random tokens')

    return new Promise((resolve, reject) => resolve(interpolator(markdown)))
  }

  /**
   * Attempts to marshall API blueprint content into a specific filetype
   *
   * @param {String} markdown
   * @param {String} filetype 'apib' or 'json'
   * @returns {Promise}
   */
  static marshall(markdown: String, filetype: String): Promise {
    return new Promise((resolve, reject) => {
      log.info(`marshalling markdown to ${filetype}`)

      const filetypes = {
        apib: () => resolve(markdown),
        json: () => Blueprint.fixtures(markdown).then(resolve)
      }

      if (filetype in filetypes) {
        return filetypes[filetype || 'apib']()
      } else {
        reject(`unsupported filetype: ${filetype}`)
      }
    })
  }

}

/**
 * Bunyan log for the API Blueprint module
 */
export const log = logger.child({module: 'blueprint'})

/**
 * Allows developers to configure and override the default interpolator (hazy.lang.process)
 */
export var interpolator = hazy.lang.process

/**
 * A janky regex for finding "JSON" objects in markdown. Need a more loveable solution
 */
export const plainJson = /\{(.*?)\}/gm
