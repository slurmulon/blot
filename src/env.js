'use strict'

import _ from 'lodash'
import fs from 'fs'
import path from 'path'

const enviros  = {}
let   selected = null 

export class Config {

  constructor(name, base, docs, stubs, logging = false) {
    this.name    = name  || 'default'
    this.base    = base  || '.'
    this.docs    = docs  || {src: this.uri('docs/src'), dest: this.uri('dist/docs'),  export: true,}
    this.stubs   = stubs || {src: this.uri('docs/src'), dest: this.uri('dist/stubs'), export: false}
    this.logging = logging

    enviros[name] = this
  }

  uri(path: String): String {
    return `${this.base}/${path}`
  }

  static existsAt(filepath: String): Boolean {
    try {
      fs.accessSync(path.resolve(filepath), fs.R_OK)

      return true
    } catch (e) {
      return false
    }
  }

  static isProject(): Boolean {
    return Config.existsAt('./index.blot.apib')
  }

  static readFrom(filepath: String = './index.blot.apib'): Promise {
    return new Promise((resolve, reject) => {
      return fs.readFile(path.resolve(filepath), 'utf-8', (err, data) => {
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
    if (!env in envros) {
      selected = env
    } else {
      // WARN - enviro not defined
    }
  } else if (_.isObject(env)) {
    const conf = configure(env)
    selected   = conf.name
  }
}

export const configure = ({name, base, docs, stubs, logging}) => new Config(name, base, docs, stubs, logging)

export const current = () => enviros[selected] || new Config()
