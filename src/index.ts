import {Socket} from 'net'
import {Transaction, TransactionConfig} from 'web3-core'
import {toBN} from 'web3-utils'
import {WebSocket, WebSocketServer} from 'ws'
import common from './common'
import {jsonSynced} from './sync'
import {Addressed, Pair, Swap, TokenInfo, Update} from './types'
import utils from './utils'
import Web3 from './web3'
import * as uuid from 'uuid'
import BN from 'bn.js'

let pairs: Addressed<Pair> = jsonSynced('../db/pairs.json')
let tokens: Addressed<TokenInfo> = jsonSynced('../db/tokens.json')

let wss = new WebSocketServer({port: 8080})
let socks = new Map<string, WebSocket>()

wss.on('connection', (ws) => {
  let id = uuid.v4()
  ws.send(
    JSON.stringify({
      pairs,
      tokens,
    })
  )
  socks.set(id, ws)
  ws.on('close', () => socks.delete(id))
})

let web3 = new Web3('/home/node/geth.ipc', new Socket())

let pending = new Map<string, Transaction>()

web3.eth.subscribe('pendingTransactions', async (err, hash) => {
  if (err) throw err
  let tx = await web3.eth.getTransaction(hash)
  if (!tx) return
  pending.set(hash, tx)
  setInterval(() => pending.delete(hash), 10000)
})

web3.eth.subscribe('newBlockHeaders', async (err, header) => {
  if (err) throw err

  console.time('elapsedSinceBlock')

  let txns: Transaction[] = []
  pending.forEach((txn) => {
    if (txn.to && txn.gasPrice) {
      txns.push(txn)
    }
  })
  txns.sort((a, b) => toBN(b.gasPrice).cmp(toBN(a.gasPrice)))
  let cfgBatch = txns.map((txn) => {
    return {
      from: txn.from,
      to: txn.to ?? undefined,
      data: txn.input,
    } as TransactionConfig
  })

  let [block, logs, traces] = await Promise.all([
    web3.eth.getBlock(header.number),
    web3.eth.getPastLogs({
      fromBlock: header.number,
      topics: [[common.topics.sync]],
    }),
    web3.debug.traceCallBatch(cfgBatch, header.number, {tracer: 'eventTracer'}),
  ])

  block.transactions.forEach((hash) => pending.delete(hash))

  let pairUpdates: Addressed<Update> = {}
  let tokenUpdates: Addressed<TokenInfo> = {}

  logs.reverse()

  let p: Promise<any>[] = []

  await Promise.all(
    logs.map(async (log) => {
      if (log.address in pairUpdates) return
      let update: Update = {}
      pairUpdates[log.address] = update

      try {
        let {reserve0, reserve1} = common.results.reserves(log.data)

        let pair = pairs[log.address]

        if (!pair) {
          let {token0, token1} = await utils.getTokens(web3, log.address)

          if (!(token0 in tokens)) {
            p.push(
              (async () => {
                tokenUpdates[token0] = tokens[token0] =
                  await utils.getTokenInfo(web3, token0)
              })()
            )
          }
          if (!(token1 in tokens)) {
            p.push(
              (async () => {
                tokenUpdates[token1] = tokens[token1] =
                  await utils.getTokenInfo(web3, token1)
              })()
            )
          }

          let fees = await utils.getFees(web3, log.address, token0)

          pair = {
            reserve0,
            reserve1,
            token0,
            token1,
            fees,
          }

          pairs[log.address] = pair
          pairUpdates[log.address] = pair
        } else {
          update.reserve0 = pair.reserve0 = reserve0
          update.reserve1 = pair.reserve1 = reserve1
        }
      } catch (e: any) {
        console.log(e.message)
        delete pairUpdates[log.address]
      }
    })
  )

  let txnTraces = txns.map((txn, i) => {
    return {
      txn,
      trace: traces[i],
    }
  })

  txnTraces.forEach(({txn, trace}) => {
    if (trace) {
      trace.forEach((ev) => {
        let swaps: Swap[] = []
        if (ev.topics[0] === common.topics.swap) {
          try {
            let {amount0In, amount1In, amount0Out, amount1Out} =
              web3.eth.abi.decodeParameter(
                '(uint amount0In,uint amount1In,uint amount0Out,uint amount1Out)',
                ev.data
              )

            let amount0 = new BN(amount0In).sub(new BN(amount0Out)).toString()
            let amount1 = new BN(amount1In).sub(new BN(amount1Out)).toString()

            swaps.push({
              amount0,
              amount1,
              txhash: txn.hash,
              gp: txn.gasPrice,
            })
          } catch (e: any) {
            console.log(e.message)
          }
        }

        if (swaps.length) {
          if (!(ev.address in pairUpdates)) pairUpdates[ev.address] = {}
          if (!('swaps' in pairUpdates[ev.address]))
            pairUpdates[ev.address].swaps = swaps
        }
      })
    }
  })

  await Promise.all(p)

  console.timeEnd('elapsedSinceBlock')

  // console.log(updates)
  let msg = JSON.stringify({pairs: pairUpdates, tokens: tokenUpdates})
  socks.forEach((ws) => ws.send(msg))
})
