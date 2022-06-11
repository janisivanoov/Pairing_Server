import topics from './topics'
import methods from './methods'
import results from './results'

const abi = require('web3-eth-abi')

export const tryParseRevertReason = (data: string): string | null => {
  switch (data.slice(0, 10)) {
    case '0x08c379a0':
      let reason = abi.decodeParameter('string', data.slice(10))
      return `Error(${reason})`
    case '0x4e487b71':
      let code = abi.decodeParameter('uint', data.slice(10))
      return `Panic(${code})`
    default:
      return null
  }
}

export const checkRevert = (data: string): string => {
  let reason = tryParseRevertReason(data)
  if (reason) throw Error(reason)
  return data
}

export default {topics, methods, results}
