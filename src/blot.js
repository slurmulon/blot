'use strict'

import * as hazy from '../node_modules/hazy/src/hazy.js'
import protagonist from 'protagonist'
import hercule from 'hercule'

import _ from 'lodash'
import fs from 'fs'
import glob from 'glob'

export class Blueprint {

  constructor(markdown: String) {
    this.markdown = markdown

    const statics = ['parse', 'transclude', 'compile', 'fixtures']

    statics.forEach(method => {
      this[method] = () => Blueprint[method](this.markdown)
    })
  }

  // exports API blueprint as either static html or an apib
  toFile(extension: String) {
    switch(extension) {
      case 'html': break
      case 'apib': break
      default: break
    }
  }

  // parses markdown into a functional object
  static parse(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      if (markdown) {
        protagonist.parse(markdown, (err, blueprint) => {
          if (!err) {
            resolve(blueprint)
          } else {
            reject(`Failed to parse file as valid API blueprint: ${error}`)
          }
        })
      } else {
        reject(`Filepath or Markdown data required`)
      }
    })
  }

  // parses string data for Markdown references and embeds them
  static transclude(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      if (markdown) {
        const transcludedMarkdown = hercule.transcludeString(markdown, _ => _)

        if (transcludedMarkdown) {
          resolve(transcludedMarkdown)
        } else {
          reject('Failed to parse Markdown for Hercule transclusions!')
        }
      } else {
        reject('Valid markdown required for transclusion')
      }
    })
  }

  // compiles API blueprint markdown data by translcuding it and then parsing it for fixtures
  static compile(markdown: String): Promise {
    return Blueprint
      .transclude(markdown)
      .then(transMd => Blueprint.parse(transMd))
      .then(parseMd => Blueprint.fixtures(parseMd).then(fixtures => {
        return {fixtures, content: parseMd}
      }))
  }

  // compiles and extracts fixtures from API blueprint markdown
  static fixtures(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      let fixtures = []
      const haziedMarkdown = hazy.lang.process(markdown)
      const jsonStrMatches = haziedMarkdown.match(plainJson)

      jsonStrMatches.forEach(jsonStr => {
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

  // parses and compiles a blueprint from the file system
  static fromFile(filepath: String): Promise {
    return new Promise((resolve, reject) => {
      if (filepath) {
        fs.readFile(__dirname + '/' + filepath, 'utf-8', (err, data) => {
          if (!err) {
            resolve(new Blueprint(data).compile())
          } else {
            reject(`Failed to read file: ${error}`)
          }
        })
      } else {
        reject(`File to read file, filepath required`)
      }  
    })
  }

}

export function load(blueprints): Promise {
  return new Promise((resolve, reject) => {
    if (blueprints instanceof Array) {
      return Promise.all(
        blueprints.map(bp => new Blueprint(bp).compile())
      )
    } else if (blueprints instanceof String) {
      return new Blueprint(blueprints).compile()
    } else {
      reject('Documents must be represented as a String or Array')
    }
  })
}

export const plainJson = /\{(.*?)\}/gm

// export class LoadError  extends Error {}
// export class ParseError extends Error {}
