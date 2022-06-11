import _Web3 from 'web3'
import {Eth} from 'web3-eth'
import {TransactionConfig, BlockNumber, provider} from 'web3-core'
import {Socket} from 'net'
import {formatters} from 'web3-core-helpers'

export type Event = {
  address: string
  topics: string[]
  data: string
}

export type TraceResult = {
  eventTracer: Event[] | null
}

export type Tracer = keyof TraceResult

export type TraceConfig<T extends Tracer> = {
  tracer?: T
}

const traceConfigFormatter = (cfg: TraceConfig<any>): TraceConfig<any> => {
  cfg ??= {}
  cfg.tracer ??= 'eventTracer'
  return cfg
}

const inputCallBatchFormatter = (callBatch: TransactionConfig[]) =>
  callBatch.map((call) => formatters.inputCallFormatter(call))

export default class Web3 extends _Web3 {
  // @ts-ignore
  eth: Eth & {
    callBatch(
      batch: TransactionConfig[],
      blockNumber?: BlockNumber
    ): Promise<string[]>
  }

  // @ts-ignore
  debug: {
    traceCallBatch<T extends Tracer>(
      batch: TransactionConfig[],
      blockNumber?: BlockNumber,
      traceConfig?: TraceConfig<T>
    ): Promise<TraceResult[T][]>
  }

  constructor(provider?: provider, socket?: Socket) {
    // @ts-ignore
    super(provider, socket)

    this.extend({
      property: 'eth',
      methods: [
        {
          name: 'callBatch',
          call: 'eth_callBatch',
          params: 2,
          inputFormatter: [
            // @ts-ignore
            inputCallBatchFormatter,
            // @ts-ignore
            formatters.inputDefaultBlockNumberFormatter,
          ],
        },
      ],
    })
    this.extend({
      property: 'debug',
      methods: [
        {
          name: 'traceCallBatch',
          call: 'debug_traceCallBatch',
          params: 3,
          inputFormatter: [
            // @ts-ignore
            inputCallBatchFormatter,
            // @ts-ignore
            formatters.inputDefaultBlockNumberFormatter,
            // @ts-ignore
            traceConfigFormatter,
          ],
        },
      ],
    })
  }
}
