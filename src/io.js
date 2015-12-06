'use strict'

import {Blueprint} from './apib'
import * as env from './env'

import hazy from 'hazy'
import protagonist from 'protagonist'
import hercule from 'hercule'

import _ from 'lodash'
import _glob from 'glob'
import fs from 'fs'
import path from 'path'
import mkpath from 'mkpath'

import {logger} from './log'

/**
 * Parses and compiles an API blueprint from the file system
 *
 * @param {String} filepath
 * @returns {Promise}
 */
export function src(filepath: String): Promise {
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
export function dest(blueprint, filepath: String): Promise {
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
export function glob(pattern, options): Promise {
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
export function read(blueprints): Promise {
  log().info('reading in content')

  return new Promise((resolve, reject) => {
    if (blueprints instanceof Blueprint) {
      resolve(blueprints)
    } else if (_.isString(blueprints)) {
      resolve(new Blueprint(blueprints).compile())
    } else if (_.isArray(blueprints)) {
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
 * Writes UTF-8 data to the provided path
 *
 * @param {String} filepath
 * @param {Object} data
 * @returns {Boolean}
 */
export const util = {
  fs: {
    /**
     * Reads in UTF-8 data from the provided path
     *
     * @param {String} filepath
     * @param {Object} data
     * @returns {Boolean}
     */
    src: (filepath, andThen) => {
      return new Promise((resolve, reject) => {
        // const envPath = env.current().uri(filepath)

        fs.readFile(filepath, 'utf-8', (err, data) => {
          if (!err) {
            if (andThen instanceof Function) {
              andThen(data)
                .then(resolve)
                .catch(reject)
            } else {
              resolve(data)
            }
          } else {
            reject(`failed to read file: ${err}`)
          }
        })
      })
    },

    /**
     * Writes UTF-8 data to the provided path
     *
     * @param {String} filepath
     * @param {Object} data
     * @returns {Boolean}
     */
    dest: (filepath, data) => {
      return new Promise((resolve, reject) => {
        // const relPath = env.current().uri(filepath)
        const relDir  = path.dirname(filepath)

        mkpath(relDir, (err) => {
          if (!err) {
            fs.writeFile(filepath, data, 'utf-8', (err) => {
              if (!err) {
                log().info(`exported content to ${filepath}`)

                resolve(data)
              } else {
                reject(`error occured while writing file: ${err}`)
              }
            })
          } else {
            reject('error occured while scaffolding destination folders: ${err}')
          }
        })
      })
    },

    /**
     * Determines if a file exists at the provided path
     *
     * @param {String} filepath
     * @returns {Boolean}
     */
    existsAt: (filepath: String) => {
      try {
        fs.accessSync(path.resolve(filepath), fs.R_OK)

        return true
      } catch (e) {
        return false
      }
    },
  }

  // TODO uri
}

/**
 * Module-level bunyan logger
 */
export const log = () => logger().child({module: 'io'})
