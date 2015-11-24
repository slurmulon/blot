'use strict'

import {Blueprint} from './apib'

import fs from 'fs'
import path from 'path'

import {logger} from './log'

export function enviro() {

}

export function scaffold() {
  
}

export function watch() {
  // WARN - non-recursive
  // fs.watch(path, (event, filename))
}

export function validate() {

}

export function test() {

}

export const log = () => logger().child({module: 'workflow'})
