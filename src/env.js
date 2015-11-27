'use strict'

import * as fsConfig from 'config.json'

import hazy from 'hazy'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'

let enviros  = {}
let selected = null

export class Config {

  constructor(name, base, host, docs, fixtures, view, echo = false, logging = false, pretty = false) {
    this.name     = name     || 'root'
    this.host     = host     || '127.0.0.1'
    this.base     = base     || '.'
    this.docs     = docs     || {src: '', dest: '', export: false}
    this.fixtures = fixtures || {src: '', dest: '', export: false}
    this.view     = view     || {dest: '', export: false, theme: {}, elems: {}}

    this.echo    = echo
    this.logging = logging
    this.pretty  = pretty

    enviros[name] = this

    // TODO - consider setting other fun stuff here as well
    ;['name', 'host', 'base'].forEach(prop => {
      hazy.fixture.register(`blot.config.${prop}`, this[prop])
    })
  }

  uri(filepath: String): String {
    return path.resolve(`${this.base}/${filepath}`)
  }

  get rootUri(): String {
    return Config.rootUri(this.name)
  }

  get isProject(): Boolean {
    return Config.existsAt(this.rootUri)
  }

  static rootUri(env: String): String {
    return (env && env !== 'root') ? `./blot.${env}.json` : `./blot.json`
  }

  static isProject(env?: String): Boolean {
    return Config.existsAt(Config.rootUri(env))
  }

  static existsAt(filepath: String): Boolean {
    try {
      fs.accessSync(path.resolve(filepath), fs.R_OK)

      return true
    } catch (e) {
      return false
    }
  }

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

  static loadProject(env: String, options: Object): Promise {
    return new Promise((resolve, reject) => {
      Config
        .src(Config.rootUri(env))
        .then(data => {
          // override project config with provided options when necessary
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

export function use(env) {
  if (_.isString(env)) {
    if (env in enviros) {
      selected = env
    } else {
      // WARN - enviro not defined
    }
  } else if (_.isObject(env)) {
    const conf = configure(env)

    selected = conf.name
  }

  return env
}

export const configure = ({name, base, host, docs, fixtures, view, echo, logging, pretty}) => new Config(name, base, host, docs, fixtures, view, echo, logging, pretty)

export const current = () => enviros[selected] || {}
