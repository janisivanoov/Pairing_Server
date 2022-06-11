import BN from 'bn.js'
import {encodePacked, keccak256} from 'web3-utils'
const abi = require('web3-eth-abi')

export const methodWithSelector =
  <A extends any[]>(selector: string, types: string[]) =>
  (...args: A): string => {
    let data = encodePacked(selector, abi.encodeParameters(types, args))
    if (!data) throw Error('Failed to encode.')
    return data
  }

export const methodWithSignature = <A extends any[]>(
  signature: string,
  types: string[]
) => methodWithSelector<A>(keccak256(signature).slice(0, 10), types)

const sync = methodWithSignature<[]>('sync()', [])
const transfer = methodWithSignature<[string, BN | string]>(
  'transfer(address,uint256)',
  ['address', 'uint']
)
const getFees = methodWithSignature<[string]>('getFees(address)', ['address'])
const getTokens = methodWithSignature<[string]>('getTokens(address)', [
  'address',
])
const decimals = methodWithSignature<[]>('decimals()', [])
const symbol = methodWithSignature<[]>('symbol()', [])
const name = methodWithSignature<[]>('name()', [])

export default {
  sync,
  transfer,
  getFees,
  getTokens,
  decimals,
  symbol,
  name,
}
