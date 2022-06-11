import {Fees, Reserves, Tokens} from '../types'

const abi = require('web3-eth-abi')

export const result =
  <T>(type: String) =>
  (raw: string): T => {
    raw = raw.replace(/\s+/m, ' ')
    let out: any = {}
    try {
      let parsed = abi.decodeParameter(type, raw)
      Object.keys(parsed).forEach((key) => {
        if (isNaN(+key)) {
          out[key] = parsed[key]
        }
      })
    } catch (e: any) {
      throw Error(`Can't decode ${raw} to type ${type} - ${e.message}`)
    }
    return out
  }

const reserves = result<Reserves>('(uint reserve0,uint reserve1)')
const tokens = result<Tokens>('(address token0,address token1)')
const fees = result<Fees>(`(
  uint swap,
  uint gas01,
  uint gas10,
  uint transfer0,
  uint buy0,
  uint sell0,
  uint transfer1,
  uint buy1,
  uint sell1
)`)

export default {
  reserves,
  tokens,
  fees,
}
