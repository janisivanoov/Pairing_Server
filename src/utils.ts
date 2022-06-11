import common, {checkRevert} from './common'
import {Fees, TokenInfo, Tokens} from './types'
import Web3 from './web3'
const abi = require('web3-eth-abi')

export const UTILS_ADDRESS = '0x8650683F68D325aa363B11AE74E93f81b1A6Be1A'
const MIN_FEE_TRANSFER = '1000000000000000000'

const getFees = async (
  web3: Web3,
  pair: string,
  token0: string
): Promise<Fees> => {
  let res = await web3.eth.callBatch([
    {
      from: pair,
      to: token0,
      data: common.methods.transfer(UTILS_ADDRESS, MIN_FEE_TRANSFER),
    },
    {to: pair, data: common.methods.sync()},
    {to: UTILS_ADDRESS, data: common.methods.getFees(pair)},
  ])
  checkRevert(res[2])
  return common.results.fees(res[2])
}

const getTokens = async (web3: Web3, address: string): Promise<Tokens> => {
  let raw = await web3.eth.call({
    to: UTILS_ADDRESS,
    data: common.methods.getTokens(address),
  })
  checkRevert(raw)
  return common.results.tokens(raw)
}

const getTokenInfo = async (web3: Web3, token: string): Promise<TokenInfo> => {
  let [rawDecimals, rawSymbol, rawName] = await Promise.all([
    web3.eth.call({to: token, data: common.methods.decimals()}),
    web3.eth.call({to: token, data: common.methods.symbol()}),
    web3.eth.call({to: token, data: common.methods.name()}),
  ])
  return {
    decimals: abi.decodeParameter('uint', rawDecimals),
    symbol: abi.decodeParameter('string', rawSymbol),
    name: abi.decodeParameter('string', rawName),
  }
}

export default {getFees, getTokens, getTokenInfo}
