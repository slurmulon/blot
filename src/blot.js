'use strict'

import * as hazy from '../node_modules/hazy/src/index.js'
import protagonist from 'protagonist'
import hercule from 'hercule'
import _ from 'lodash'
import fs from 'fs'
import glob from 'glob'

export class Blueprint {

  constructor(markdown: String) {
    this.markdown = markdown

    ['parse', 'transclude', 'compile', 'fixtures'].forEach(method => {
      this[method] = () => Blueprint[method](this.markdown)
    })
  }

  toFile(extension: String) {
    switch(extension) {
      case 'html': break;
      case 'apiblueprint': break;
      default;
    }
  }

  static parse(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      if (markdown) {
        protagonist.parse(markdown, (err, result) => {
          if (!err) {
            const blueprint = Object.assign({filepath, raw: data}, result)

            resolve(blueprint)
          } else {
            reject(`Failed to parse file as valid API blueprint: ${error}`)
          }
        }
      } else {
        reject(new LoadError(`Filepath or Markdown data required`))
      }
    })
  }

  // parses string data for Markdown references and embeds them
  static transclude(markdown: String): Promise {
    return new Promise((resolve, reject) => {
      if (markdown) {
        const transcludedMarkdown = hercule.transcludeString(markdown, output => output)

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
    return Blueprint.transclude(markdown)
      .then(transMd => Blueprint.parse(transMd))
      .then(parseMd => Blueprint.fixtures(parseMd).then(fixtures => {
        return {fixtures, content: parseMd}
      }))
  }

  // compiles and extracts fixtures from API blueprint markdown
  static fixtures(markdown: String): Promise {
    return Blueprint.compile(markdown).then(blueprint => {
      let   fixtures        = []
      const haziedBlueprint = hazy.lang.process(blueprint.raw)
      const jsonStrMatches  = blueprint.raw.match(haziedBlueprint)

      jsonStrMatches.forEach(jsonStr => {
        try {
          fixtures.push(JSON.parse(jsonStr))
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new ParseError(`Found invalid JSON in API blueprint ${blueprint.filepath}: ${jsonStr}\n\n${e}`)
          } else {
            throw new ParseError(`Failed to parse JSON fixtures in API blueprint: ${e}`)
          }
        }
      })

      return fixtures
    })
  }

  static fromFile(filepath: String): Promise {
    return new Promise((resolve, reject) => {
      if (filepath) {
        fs.readFile(__dirname + '/' + filepath, (err, data) => {
          if (!err) {
            resolve(new Blueprint(data).compile())
          } else {
            reject(new LoadError(`Failed to read file: ${error}`))
          }
        })
      } else {
        reject(new LoadError(`File to read file, filepath required.`))
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
    } else if (docs instanceof String) {
      return new Blueprint(docs).compile()
    } else {
      throw new LoadError('Documents must be represented as a String or Array')
    }
  })
}

export const plainJson = /\{(.*?)\}$/gm

export class LoadError  extends Error
export class ParseError extends Error
