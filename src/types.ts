export type Addressed<T> = {
  [address: string]: T
}

export type Swap = {
  amount0: string
  amount1: string
  txhash: string
  gp: string
}

export type Fees = {
  swap: string
  gas01: string
  gas10: string
  transfer0: string
  buy0: string
  sell0: string
  transfer1: string
  buy1: string
  sell1: string
}

export type Reserves = {
  reserve0: string
  reserve1: string
}

export type Tokens = {
  token0: string
  token1: string
}

export type TokenInfo = {
  decimals: string
  symbol: string
  name: string
}

export type Pair = Reserves &
  Tokens & {
    fees: Fees
  }

export type Update = {
  [k in keyof Pair]?: Pair[k]
} & {
  swaps?: Swap[]
}
