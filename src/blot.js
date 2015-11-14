'use strict'

import hazy from 'hazy'
import protagonist from 'protagonist'
import hercule from 'hercule'

import _ from 'lodash'
import fs from 'fs'
import glob from 'glob'

/**
 * Parses, transcludes and compiles API blueprint files
 * and their associated fixtures. Allows compiled
 * API blueprints to be exported to the filesystem.
 */
export class Blueprint {

  /**
   * @param {String} markdown Valid API blueprint markdown
   */
  constructor(markdown: String) {
    this.markdown = markdown

    const statics = ['compile', 'fixtures', 'interpolate', 'parse', 'transclude']

    statics.forEach(method => {
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
    return Blueprint
      .transclude(markdown)
      .then(embedMd => Blueprint.interpolate(embedMd))
      .then(finalMd => Blueprint.fixtures(finalMd).then(fixtures => {
        return Object.assign({compiled: {fixtures, markdown: finalMd}}, this)
      }))
  }

  /**
   * Extracts JSON fixtures from API blueprint markdown
   *
   * @param {String} markdown
   * @returns {Promise}
   */
  static fixtures(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      let fixtures = []
      const jsonStrMatches = (markdown.match) ? markdown.match(plainJson) : []

      jsonStrMatches && jsonStrMatches.forEach(jsonStr => {
        try {
          const fixture = JSON.parse(jsonStr)

          fixtures.push(fixture)
        } catch (e) {
          if (e instanceof SyntaxError) {
            reject(`Found invalid JSON in API blueprint ${blueprint.filepath}: ${jsonStr}\n\n${e}`)
          } else {
            reject(`Failed to parse JSON fixtures in API blueprint: ${e}`)
          }
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
    return new Promise((resolve, reject) => {
      if (markdown) {
        protagonist.parse(markdown, (err, blueprint) => {
          if (!err) {
            resolve(blueprint)
          } else {
            reject(`Failed to parse file as valid API blueprint: ${err}`)
          }
        })
      } else {
        reject(`Markdown data required`)
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
      if (markdown) {
        hercule.transcludeString(markdown, (transMd) => {
          if (transMd) {
            resolve(transMd)
          } else {
            reject('Failed to parse markdown for Hercule transclusions')
          }
        })

      } else {
        reject('Valid markdown required for transclusion')
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
    return new Promise((resolve, reject) => resolve(interpolator(markdown)))
  }

  /**
   * Parses and compiles an API blueprint from the file system
   *
   * @param {String} filepath
   * @returns {Promise}
   */
  static src(filepath: String): Promise {
    return new Promise((resolve, reject) => {
      if (filepath) {
        fs.readFile(__dirname + '/../' + filepath, 'utf-8', (err, data) => {
          if (!err) {
            resolve(new Blueprint(data).compile())
          } else {
            reject(`Failed to read file: ${err}`)
          }
        })
      } else {
        reject(`Failed to read file, filepath required`)
      }  
    })
  }

  /**
   * Globs and reads in valid API blueprint(s) from the filesystem and compiles them
   *
   * @param {Array|String} blueprints
   * @returns {Promise}
   */
  static glob(pattern, options): Promise {
    return new Promise((resolve, reject) => {
      glob(pattern, options, (err, files) => {
        if (!err) {
          Promise
            .all(
              files.map(filepath => Blueprint.src(filepath))
            )
            .then(resolve)
            .catch(reject)
        } else {
          reject(`Failed to load file: ${err}`)
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
  static read(blueprints): Promise {
    return new Promise((resolve, reject) => {
      if (_.isArray(blueprints)) {
        Promise
          .all(
            blueprints.map(bp => new Blueprint(bp).compile())
          )
          .then(resolve)
          .catch(reject)
      } else if (_.isString(blueprints)) {
        resolve(new Blueprint(blueprints).compile())
      } else {
        reject('Documents must be represented as a String or Array, got ' + typeof blueprints)
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
  static dist(markdown, filepath: String): Promise {
    return new Promise((resolve, reject) => {
      const extension = filepath.match(/\.([0-9a-z]+)$/i)

      if (extension) {
        Blueprint.read(markdown)
          .then(consumed => Blueprint.marshall(consumed.compiled.markdown, extension[1]))
          .then(marshalled => {
            fs.writeFile(filepath, marshalled, 'utf-8', (err) => {
              if (!err) {
                resolve(marshalled)
              } else {
                reject(`An error occured while saving file: ${err}`)
              }
            })
          })
      } else {
        reject(`File destinations must contain an extension (.apib or .html)`)
      }
    })
  }

  /**
   * Attempts to marshall API blueprint content into a specific type
   *
   * @param {String} markdown
   * @param {String} filetype 'apib' or 'json'
   * @returns {Promise}
   */
  static marshall(markdown: String, filetype: String): Promise {
    return new Promise((resolve, reject) => {
      const filetypes = {
        apib: () => resolve(markdown),
        json: () => Blueprint.fixtures(markdown).then(resolve)
      }

      if (filetype in filetypes) {
        return filetypes[filetype || 'apib']()
      } else {
        reject(`Unsupported filetype: ${filetype}`)
      }
    })
  }

}



/**
 * Allows developers to configure and override the default instance of hazy
 */
export var interpolator = hazy.lang.process

/**
 * A janky regex for finding "JSON" objects in markdown. Need a more loveable solution
 */
export const plainJson = /\{(.*?)\}/gm
