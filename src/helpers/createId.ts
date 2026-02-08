import {customAlphabet} from 'nanoid'

import type {Options} from '../types'

const defaultAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const defaultLength = 6
const defaultPrefix = ''

/**
 * #### Create Unique Identifier
 * Used for creating the unique identification segment
 * of URIs.
 */
export function createId(ident?: Options['ident']): string {
  const alphabet = ident?.pattern || defaultAlphabet
  const length = ident?.length || defaultLength
  const prefix = ident?.prefix || defaultPrefix
  const nanoid = customAlphabet(alphabet, length)
  return prefix + nanoid()
}
