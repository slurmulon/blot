'use strict'

import * as env from './env'

import _ from 'lodash'
import bunyan from 'bunyan'
import PrettyStream from 'bunyan-prettystream'
 
var prettyStdOut = new PrettyStream()
prettyStdOut.pipe(process.stdout)

export const logger = () => {
  if (env.current().logging) {
    return bunyan.createLogger({
      name: 'blot',
      streams: [{
        level: 'debug',
        type: 'raw',
        stream: prettyStdOut
      }]
    })
  }

  return nothing()
}

export const nothing = () => {
  const notta = {info: _.noop, warn: _.noop, error: _.noop}
  
  return Object.assign(notta, {child: () => notta})
}