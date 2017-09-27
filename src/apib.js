'use strict'

import * as env from './env'
import {util} from './io'

import hazy from 'hazy'
import protagonist from 'protagonist'
import { transcludeString } from 'hercule'

import _glob from 'glob'
import path from 'path'

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
  constructor (markdown: String) {
    this.markdown = markdown

    const markdownFuncs = ['compile', 'fixtures', 'groups', 'interpolate', 'parse', 'transclude', 'validate']

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
  static compile (markdown: String): Promise {
    log().info('compiling')

    return Blueprint
      .transclude(markdown)
      .then(embedMd  => Blueprint.interpolate(embedMd))
      .then(staticMd => Blueprint.validate(staticMd))
      .then(finalMd  => Blueprint.fixtures(finalMd).then(fixtures =>
        Object.assign(new Blueprint(markdown), {compiled: {fixtures, markdown: finalMd}})
      ))
  }

  /**
   * Extracts JSON fixtures from API blueprint markdown
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  // TODO - add option that allows fixtures to be parsed from hazy pool
  static fixtures (markdown: String): Promise {
    log().info('extracting fixtures')

    return new Promise((resolve, reject) => {
      let fixtures = []
      const jsonStrMatches = (markdown.match instanceof Function) ? markdown.match(jsonLike) : []

      jsonStrMatches && jsonStrMatches.forEach(jsonStr => {
        try {
          const fixture = JSON.parse(jsonStr)

          fixtures.push(fixture)
        } catch (e) { }
      })

      resolve(fixtures)
    })
  }

  /**
   * Compiles API blueprint markdown data by translcuding it and then parsing it for fixtures
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static parse (markdown: String): Promise {
    log().info('parsing')

    return new Promise((resolve, reject) => {
      if (markdown) {
        protagonist.parse(markdown, (err, blueprint) => {
          if (!err) {
            resolve(blueprint)
          } else {
            log().error('invalid API blueprint', err)

            reject(`failed to parse file as valid API blueprint: ${err}`)
          }
        })
      } else {
        reject(`markdown data required`)
      }
    })
  }

  /**
   * Parses API blueprint markdown data and determines if it's valid
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static validate (markdown: String): Promise {
    log().info('validating')

    return new Promise((resolve, reject) => {
      Blueprint
        .parse(markdown)
        .then(obj => {
          resolve(markdown)
        })
        .catch(err => {
          log().error('invalid', err)

          reject(markdown)
        })
    })
  }

  /**
   * Scans API blueprint markdown for Hercule references and transcludes them
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static transclude (markdown: String): Promise {
    return new Promise((resolve, reject) => {
      log().info('transcluding')

      if (markdown) {
        transcludeString(markdown, (err, transMd) => {
          if (err) {
            reject(`failed to parse hercule transclusions`)
          }

          resolve(transMd)
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
  static interpolate (markdown: String): Promise {
    log().info('interpolating')

    const locals = {config: env.current()} // FIXME - not accessible in hazy for some reason

    return new Promise((resolve, reject) => resolve(
      interpolator(markdown, locals)
    ))
  }

  /**
   * Attempts to marshall API blueprint content into a specific filetype
   *
   * @param {String} markdown
   * @param {String} filetype 'apib' or 'json'
   * @returns {Promise}
   */
  static marshall (markdown: String, filetype: String): Promise {
    return new Promise((resolve, reject) => {
      log().info(`marshalling to ${filetype}`)

      const filetypes = {
        md:   () => resolve(markdown),
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

  // TODO - juggle (obfiscates fixture data by randomizing it with hazy tokens)
  // TODO - struct (pretty prints your API blueprint by components (like `ps auxf`))
}


/**
 * Parses and compiles an API blueprint from the file system
 *
 * @param {String} filepath
 * @returns {Promise}
 */
export function src (filepath: String): Promise {
  log().info(`reading content from ${filepath}`)

  return new Promise((resolve, reject) => {
    if (filepath) {
      util.fs
        .src(filepath, (data) => new Blueprint(data).compile())
        .then(resolve)
        .catch(reject)
    } else {
      reject(`Failed to read file, filepath required`)
    }
  })
}

/**
 * Reads in and then exports API blueprints as either a static html or apib file
 * to the provided file path
 *
 * @param {String} markdown
 * @param {String} filepath
 * @returns {Promise}
 */
export function dest (blueprint, filepath: String): Promise {
  return new Promise((resolve, reject) => {
    log().info(`writing content to ${filepath}`)

    const ext = path.extname(filepath).substr(1)

    read(blueprint)
      .then(consumed => Blueprint.marshall(consumed.compiled.markdown, ext))
      .then(marshalled => util.fs.dest(filepath, marshalled))
      .then(resolve)
      .catch(reject)
  })
}

/**
 * Globs and reads in valid API blueprint(s) from the filesystem and compiles them
 *
 * @param {Array|String} blueprints
 * @returns {Promise}
 */
export function glob (pattern, options): Promise {
  log().info(`globbing against ${pattern}`)

  return new Promise((resolve, reject) => {
    _glob(pattern, options, (err, files) => {
      if (!err) {
        Promise
          .all(
            files.map(filepath => src(filepath))
          )
          .then(resolve)
          .catch(reject)
      } else {
        reject(`failed to load globbed file: ${err}`)
      }
    })
  })
}

/**
 * Reads in valid API blueprint(s) from Strings or 
 * Arrays of Strings and compiles them
 *
 * @param {Array|String} blueprints
 * @returns {Promise}
 */ 
export function read (blueprints): Promise {
  log().info('reading in content')

  return new Promise((resolve, reject) => {
    if (blueprints instanceof Blueprint) {
      resolve(blueprints)
    } else if (blueprints.constructor === String) {
      resolve(new Blueprint(blueprints).compile())
    } else if (blueprints instanceof Array) {
      Promise
        .all(
          blueprints.map(bp => new Blueprint(bp).compile())
        )
        .then(resolve)
        .catch(reject)
    } else {
      reject('documents must be represented as a String or Array, got ' + typeof blueprints)
    }
  })
}

/**
 * Allows developers to configure and override the default interpolator (hazy.lang.process)
 */
export var interpolator = hazy.lang.process

/**
 * My janky regex for finding "JSON" objects in markdown. Need a more loveable solution, has obvious
 * issues with validating nested structures (regex isn't suited for this)
 */
export const jsonLike = /\{(.*?)\}/gm

/**
 * Module-level bunyan logger
 */
export const log = () => logger().child({module: 'blueprint'})
