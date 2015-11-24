'use strict'

import * as fsConfig from 'config.json'

import hazy from 'hazy'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'

let enviros  = {}
let selected = null

export class Config {

  constructor(name, base, host, docs, stubs, logging = false, pretty = false) {
    this.name  = name  || 'local'
    this.host  = host  || '127.0.0.1'
    this.base  = base  || '.'
    this.docs  = docs  || {src: this.uri('src/docs'), dest: this.uri('dist/docs'),  export: true }
    this.stubs = stubs || {src: this.uri('src/docs'), dest: this.uri('dist/stubs'), export: false}

    this.logging = logging
    this.pretty  = pretty

    enviros[name] = this

    ;['name', 'host', 'base'].forEach(prop => {
      hazy.fixture.register(`blot.config.${prop}`, this[prop])
    })
  }

  uri(filepath: String): String {
    return path.resolve(`${this.base}/${filepath}`)
  }

  rootUri(): String {
    return Config.rootUri(this.name)
  }

  static rootUri(name: String): String {
    return name ? `./blot.${name}.json` : `./blot.json`
  }

  static isProject(): Boolean {
    return Config.existsAt(Config.rootUri())
  }

  static existsAt(filepath: String): Boolean {
    try {
      fs.accessSync(path.resolve(filepath), fs.R_OK)

      return true
    } catch (e) {
      return false
    }
  }

  static parse(filepath: String): Object {
    return fsConfig.default(filepath || Config.rootUri())
  }

  static src(filepath: String): Promise {
    return new Promise((resolve, reject) => {
      const relPath = path.resolve(filepath || Config.rootUri())

      return fs.readFile(relPath, 'utf-8', (err, data) => {
        if (!err) {
          resolve(
            new Config(JSON.parse(data))
          )
        } else {
          reject(`Failed to read in blot environment configuration from ${path}`)
        }
      })
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

export const configure = ({name, base, host, docs, stubs, logging, pretty}) => new Config(name, base, host, docs, stubs, logging, pretty)

export const current = () => enviros[selected] || new Config()
