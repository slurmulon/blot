'use strict'

import {Blueprint} from './apib'
// import * as env from './env'

import hazy from 'hazy'
import protagonist from 'protagonist'
import hercule from 'hercule'

import _glob from 'glob'
import fs from 'fs'
import path from 'path'
import mkpath from 'mkpath'

import {logger} from './log'

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
