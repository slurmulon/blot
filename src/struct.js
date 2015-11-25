'use strict'

import {logger} from './log'

export class Architecture {

  constructor(data: String) {
    this.data = data
  }

  // fixtures
  // attributes

  // use jsonpath :D

}

// export const resources = (markdown: String) {

// }

// export class Resource() {

//   static num() {

//   }

//   static all() {

//   }

// }

// export class Group() {

//   static num() {

//   }

//   static all() {

//   }

// }

/**
 * Bunyan log for the API Blueprint module
 */
export const log = () => logger().child({module: 'struct'})