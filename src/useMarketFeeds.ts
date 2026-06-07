import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store";
import { upsert } from "./marketSlice";
import { updateCandle } from "./candles";

const CRYPTO =
  "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/xrpusdt@trade/adausdt@trade/dogeusdt@trade/ltcusdt@trade";

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"];

const FX = [
  { key: "EUR", label: "EUR/USD" },
  { key: "GBP", label: "GBP/USD" },
  { key: "JPY", label: "USD/JPY" },
];

const FINNHUB_KEY = "YOUR_KEY";

export function useMarketFeeds() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const ws = new WebSocket(CRYPTO);

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const price = Number(msg?.p);

      if (!msg?.s || !Number.isFinite(price)) return;

      dispatch(upsert({ symbol: msg.s, price, type: "crypto" }));
      updateCandle(msg.s, price);
    };

    return () => ws.close();
  }, [dispatch]);

  useEffect(() => {
    const run = async () => {
      const results = await Promise.all(
        STOCKS.map(async (s) => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_KEY}`
          );
          const j = await r.json();
          return { s, price: Number(j?.c) };
        })
      );

      results.forEach((x) => {
        if (Number.isFinite(x.price)) {
          dispatch(upsert({ symbol: x.s, price: x.price, type: "stock" }));
          updateCandle(x.s, x.price);
        }
      });
    };

    run();
    const id = setInterval(run, 4000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    const run = async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const j = await r.json();

      if (!j?.rates) return;

      FX.forEach((p) => {
        const price = Number(j.rates[p.key]);
        if (!Number.isFinite(price)) return;

        dispatch(upsert({ symbol: p.label, price, type: "fx" }));
        updateCandle(p.label, price);
      });
    };

    run();
    const id = setInterval(run, 5000);
    return () => clearInterval(id);
  }, [dispatch]);
}