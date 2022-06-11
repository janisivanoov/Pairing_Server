import {keccak256} from 'web3-utils'

const sync = keccak256('Sync(uint112,uint112)')
const swap = keccak256('Swap(address,uint256,uint256,uint256,uint256,address)')

export default {
  sync,
  swap,
}
