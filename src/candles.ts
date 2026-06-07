export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const store: Record<string, Candle[]> = {};

export function updateCandle(symbol: string, price: number) {
  const bucket = Math.floor(Date.now() / 5000) * 5000;

  if (!store[symbol]) store[symbol] = [];

  const candles = store[symbol];
  let last = candles[candles.length - 1];

  if (!last || last.time !== bucket) {
    last = {
      time: bucket,
      open: price,
      high: price,
      low: price,
      close: price,
    };

    candles.push(last);

    if (candles.length > 50) candles.shift();
  } else {
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.close = price;
  }

  return [...candles];
}

export function getCandles(symbol: string) {
  return store[symbol] ?? [];
}