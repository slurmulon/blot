'use strict'

import * as env from './env'

import bunyan from 'bunyan'
import PrettyStream from 'bunyan-prettystream'
 
var prettyStdOut = new PrettyStream()
prettyStdOut.pipe(process.stdout)

export const core = {
  raw:    bunyan.createLogger({name: 'blot'}),
  pretty: bunyan.createLogger({
    name: 'blot',
    streams: [{
      level: 'debug',
      type: 'raw',
      stream: prettyStdOut
    }]
  })
}

export const logger = () => {
  const enviro  = env.current()
  const enabled = enviro.logging || enviro.pretty
  const pretty  = enviro.pretty

  if (enabled) {
    return pretty ? core.pretty : core.raw
  }

  return nothing
}

export const nothing = (() => {
  const noop  = _ => _
  const notta = {info: noop, warn: noop, error: noop}
  
  return Object.assign(notta, {child: () => notta})
})()
