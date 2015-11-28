'use strict'

import * as fsConfig from 'config.json'

import hazy from 'hazy'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import {util} from './io'

let enviros  = {}
let selected = null

/**
 * Project environment configuration.
 * Binds certain data to fixture pool
 * so it can be accessed in documentation.
 */
export class Config {

  /**
   * @param {String} name key-friendly name of the environment
   * @param {String} base base path for all other paths in blot
   * @param {String} host API host (for use in docs)
   * @param {String} docs I/O configuration for docs
   * @param {String} fixtures I/O configuration for fixtures
   * @param {String} logging whether or not to print standardized logs
   * @param {String} pretty whether ot not to print pretty logs
   */
  constructor(name, base, host, docs, fixtures, view, echo = false, logging = false, pretty = false) {
    this.name     = name     || 'root'
    this.base     = base     || '.'
    this.host     = host     || '127.0.0.1'
    this.docs     = docs     || {src: '', dest: '', export: false}
    this.fixtures = fixtures || {src: '', dest: '', export: false}
    this.view     = view     || {dest: '', export: false, theme: {}, elements: {}, attrs: {}}

    this.echo     = echo
    this.logging  = logging
    this.pretty   = pretty

    enviros[name] = this

    // TODO - consider setting other fun stuff here as well
    ;['name', 'host', 'base'].forEach(prop => {
      hazy.fixture.register(`blot.config.${prop}`, this[prop])
    })
  }

  /**
   * Adjusts provided filepath to be project/environment-specific
   *
   * @param {String} filepath
   * @returns {String} filepath adjusted to project base path
   */
  uri(filepath: String): String {
    return path.resolve(`${this.base}/${filepath}`)
  }

  /**
   * Provides the expected root file URI for project config
   *
   * @param {String} filepath
   * @returns {String} filepath adjusted to project base path
   */
  get rootUri(): String {
    return Config.rootUri(this.name)
  }

  /**
   * Determines if a blot project file configuration exists
   *
   * @returns {Boolean}
   */
  get isProject(): Boolean {
    return util.fs.existsAt(this.rootUri)
  }

  /**
   * Determines the expected root file URI for project environment config
   *
   * @param {String} env environment name
   * @returns {String} filepath adjusted to project environment config
   */
  static rootUri(env: String): String {
    return (env && env !== 'root') ? `./blot.${env}.json` : `./blot.json`
  }

  /**
   * Determines if a blot project file configuration exists for enviro
   *
   * @returns {Boolean}
   */
  static isProject(env?: String): Boolean {
    return util.fs.existsAt(Config.rootUri(env))
  }

  /**
   * Loads a blot project configuration file and parses it
   *
   * @param {String} filepath
   * @returns {Promise}
   */
  static src(filepath: String): Promise {
    return new Promise((resolve, reject) => {
      const envPath = path.resolve(filepath || Config.rootUri())

      return fs.readFile(envPath, 'utf-8', (err, data) => {
        if (!err) {
          resolve(
            configure(JSON.parse(data))
          )
        } else {
          reject(`Failed to read in blot environment configuration from ${path}`)
        }
      })
    })
  }

  /**
   * Loads a blot project configuration file, parses it and then
   * establishes it as the selected environment
   *
   * @param {String} env environment name
   * @param {String} project configuration overrides (typically from CLI)
   * @returns {Promise}
   */
  static loadProject(env: String, options: Object): Promise {
    return new Promise((resolve, reject) => {
      Config
        .src(Config.rootUri(env))
        .then(data => {
          // override project config with options (typically CLI) when necessary
          if (!_.isEmpty(options)) {
            if (data) {
              data = _.merge(data, options)
            } else {
              data = options
            }
          }

          use(env)
          resolve(data)
        })
        .catch(reject)
    })
  }

}

/**
 * Establishes a project environment as the default
 *
 * @param {String|Object} env
 * @returns {Promise}
 */
export function use(env) {
  if (_.isString(env)) {
    if (env in enviros) {
      selected = env
    } else {
      // WARN - enviro not defined
    }
  } else if (_.isObject(env)) {
    selected = configure(env).name
  }

  return env
}

/**
 * Destructured alias for instantiating environment / project Configs
 *
 * @param {Object} arguments configuration object
 * @returns {Config}
 */
export const configure = ({name, base, host, docs, fixtures, view, echo, logging, pretty}) => new Config(name, base, host, docs, fixtures, view, echo, logging, pretty)

/**
 * Provides the currently selected environment in blot
 *
 * @returns {Config|Object}
 */
export const current = () => enviros[selected] || {}
