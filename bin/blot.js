#! /usr/bin/env node

'use strict'

var blot = require('../lib/blot').default
var colors = require('colors')
var path = require('path')
var program = require('commander')
var meta = require('../package.json')

var config = {}

// CLI Actions and Commands

function loadConfig(env, cmd) {
  // override precedence (starting w/ base):
  // project -> flags -> object literal (--config)
  return new Promise(function(resolve, reject) {
    info('env:load', env)

    Object.assign(config, cmd)

    mapJsonConfig(cmd.config)

    if (blot.env.Config.isProject(env)) {
      // use environment project config
      blot.env.Config
        .loadProject(env, config, false)
        .then(function(envConfig) {
          info('env:name', envConfig.name)
          info('env:host', envConfig.host)

          mapEnvConfig(envConfig)

          resolve(envConfig)
        })
        .catch(reject)
    } else {
      warn('env', 'no project environment defined')
      resolve(false)
    }
  })
}

function mapJsonConfig(configObj) {
  // ensure JSON configuration object (when provided) overrides CLI flags
  try {
    Object.assign(config, JSON.parse(configObj))
  } catch (e) {
    error('config override must be valid JSON: ' + e)
  }
}

function mapEnvConfig(envConfig) {
  // ensure run config matches environment config after processing
  Object.assign(config, envConfig)

  // map CLI flags with names different from env config... FIXME
  config.inFiles  = envConfig.docs.src
  config.outFiles = envConfig.docs.dest

  blot.env.use(envConfig, true)
}

function parseFiles(files) {
  info('glob', 'start')

  return blot.apib
    .glob(files)
    .then(function(blueprints) {
      info('glob', 'end')

      blueprints.forEach(function(blueprint) {
        section(blueprint.compiled.markdown)
      })

      return blueprints
    })
    .catch(error)
}

function parseText(data) {
  info('read', 'start')

  return blot.apib.read(data)
    .then(function(blueprint) {
      info('read', 'end')

      section(blueprint.compiled.markdown)

      return blueprint
    })
    .catch(error)
}

function compileInputs() {
  return new Promise(function(resolve, reject) {
    var curEnv  = blot.env.current()
    var validFs = config.inFiles   && config.inFiles !== 'files'
    var loadFs  = curEnv.isProject && curEnv.docs.src

    if (validFs || loadFs) {
      parseFiles(config.inFiles)
        .then(resolve)
        .catch(reject)
    } else if (config.inData) {
      parseText(config.inData)
        .then(resolve)
        .catch(reject)
    } else {
      error('malformed command')
      reject(config)
    }
  })
}

function renderBlueprints(blueprints) {
  info('render', 'start')

  return new Promise(function(resolve, reject) {
    blot.html.Document
      .fromBlueprints(blueprints)
      .then(function(docs) {
        return Promise.all(docs.map(function(doc) {
          return doc.processed //.html()
        }))
      })
      .then(function(docs) {
        info('render', 'end')

        if ((docs && !docs.length) || Object.is(docs[0], null)) {
          warn('render', 'no resulting HTML, check `elements` configuration')
        }

        docs.forEach(section)

        resolve(docs)
      })
      .catch(function(error) {
        error('failed to render API blueprint as HTML: ' + error)
        reject(error)
      })
  })
}

function exportBlueprints(blueprints) {
  var curEnv   = blot.env.current()
  var validOut = !config.outFile || config.outFile == 'file'
  var doExport = curEnv.isProject && curEnv.docs.export && curEnv.docs.dest
  var outPath  = doExport ? curEnv.docs.dest : config.outFile // TODO - cleanup, slop

  if (!doExport && validOut)
    return

  info('export.apib', 'start')

  blueprints.forEach(function(blueprint) {
    blot.apib
      .dest(blueprint, outPath)
      .then(function(content) {
        info('export', 'end')
      })
      .catch(function(err) {
        error('failed to export ' + outPath + ': ' + err)
      })
  })
}

function exportHtml(html) {
  var curEnv   = blot.env.current()
  var doExport = curEnv.isProject && curEnv.view.export && curEnv.view.dest

  if (!doExport) return

  info('export:html', 'start')

  new blot.html.Document(html)
    .dest()
    .then(function() {
      info('export:html', 'end')
    })
    .catch(function(err) {
      error('failed to export ' + outPath + ': ' + err)
    })
}

// Logging

function info(action, msg) {
  if (config.pretty) {
    blot.log().info(action.magenta + ' ' + msg.green)
  } else if (config.log) {
    blot.log().info(action + ': ' + msg)
  }
}

function warn(action, msg) {
  if (config.pretty) {
    blot.log().warn(action.yellow + ' ' + msg.green)
  } else if (config.log) {
    blot.log().warn(action + ': ' + msg)
  }
}

function error(msg) {
  if (config.pretty || config.log) {
    blot.log().error(msg)
  }
}

function section(msg) {
  if (config.pretty) {
    console.log('\n--------------------------------------------------\n'.rainbow)
    console.log(msg.cyan)
    console.log('\n--------------------------------------------------\n'.rainbow)
  } else if (config.log) {
    blot.log().info(msg)
  } else if (config.echo) {
    console.log(msg)
  }
}

// Command Bindings

program
  .version(meta.version)
  .option('-i, --in-files [files]', 'Source documentation files (*.blot or *.apib)', 'files')
  .option('-d, --in-data [md]', 'Read in plain Markdown (UTF-8)', 'markdown')
  .option('-o, --out-file [file]', 'Write result to file(s) (*.apib , *.html or *.json)', 'file')
  .option('-c, --config [obj]', 'Provide a JSON-formatted project configuration override object')
  .option('-v, --validate', 'Determines if provided content is a valid API Blueprint')
  .option('-e, --echo', 'Prints compiled result to stdout')
  .option('-l, --log', 'Enables logging of blot events')
  .option('-p, --pretty', 'Formats results into visually pleasing output')

program
  .command('compile [env]')
  .description('process documentation and compiles it into a static format')
  .action(function(env, cmd) {
    loadConfig(env, cmd.parent)
      .then(compileInputs)
      .then(exportBlueprints)
  })

program
  .command('render [env]')
  .description('processes, compiles, and then renders documentation as HTML')
  .action(function(env, cmd) {
    process.env.NO_CACHE = 1 // TODO - remove once aglio theme cache works for NPM3

    loadConfig(env, cmd.parent)
      .then(compileInputs)
      .then(renderBlueprints)
      .then(exportHtml)
  })
  
// TODO - query command

program.parse(process.argv)
