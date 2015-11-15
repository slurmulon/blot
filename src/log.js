'use strict'

import bunyan from 'bunyan'
import PrettyStream from 'bunyan-prettystream'
 
var prettyStdOut = new PrettyStream()
prettyStdOut.pipe(process.stdout)

// FIXME - make this configurable through node-config, need the ability to output raw bunyon logs
export const logger = bunyan.createLogger({
  name: 'blot',
  streams: [{
    level: 'debug',
    type: 'raw',
    stream: prettyStdOut
  }]
})
