import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { upsert } from "./marketSlice";
import { addTrade } from "./tradeSlice";
import { useMarketFeeds } from "./useMarketFeeds";

const CRYPTO =
  "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade";

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"] as const;

const FX = [
  { key: "EUR", label: "EUR/USD" },
  { key: "GBP", label: "GBP/USD" },
  { key: "JPY", label: "USD/JPY" },
] as const;

const FINNHUB_KEY = "d8i21l9r01qm63b99ti0d8i21l9r01qm63b99tig";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((s: RootState) => s.market.data);
  const trades = useSelector((s: RootState) => s.trade.trades);
  const positions = useSelector((s: RootState) => s.trade.positions);

  useMarketFeeds();

  // CRYPTO
  useEffect(() => {
    const ws = new WebSocket(CRYPTO);

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      const price = Number(msg?.p);
      if (!msg?.s || !Number.isFinite(price)) return;

      dispatch(upsert({ symbol: msg.s, price, type: "crypto" }));
    };

    return () => ws.close();
  }, [dispatch]);

  // STOCKS
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
        }
      });
    };

    run();
    const id = setInterval(run, 4000);
    return () => clearInterval(id);
  }, [dispatch]);

  // FX
  useEffect(() => {
    const run = async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const j = await r.json();

      const rates = j?.rates;
      if (!rates) return;

      FX.forEach((p) => {
        const rate = Number(rates[p.key]);
        if (!Number.isFinite(rate)) return;

        dispatch(upsert({ symbol: p.label, price: rate, type: "fx" }));
      });
    };

    run();
    const id = setInterval(run, 5000);
    return () => clearInterval(id);
  }, [dispatch]);

  // LATENCY SIMULATION TRADE (FIX: real UI behavior)
  const placeTrade = (
    symbol: string,
    price: number,
    type: "crypto" | "stock" | "fx",
    side: "buy" | "sell"
  ) => {
    const tradeSnapshot = {
      id: crypto.randomUUID(),
      symbol,
      price,
      type,
      side,
      time: Date.now(),
    };

    const latency = 300 + Math.random() * 1200;

    setTimeout(() => {
      dispatch(addTrade(tradeSnapshot));
    }, latency);
  };

  const Column = ({
    title,
    type,
    color,
  }: {
    title: string;
    type: "crypto" | "stock" | "fx";
    color: string;
  }) => {
    const items = Object.values(data).filter((i) => i.type === type);

    return (
      <div style={{ flex: 1 }}>
        <h3 style={{ color }}>{title}</h3>

        {items.map((i) => (
          <div
            key={i.symbol}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 6,
              marginBottom: 6,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <span>{i.symbol}</span>
            <span>{i.price.toFixed(2)}</span>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() =>
                  placeTrade(i.symbol, i.price, i.type, "buy")
                }
              >
                BUY
              </button>

              <button
                onClick={() =>
                  placeTrade(i.symbol, i.price, i.type, "sell")
                }
              >
                SELL
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 20, background: "#0b0f14", color: "#fff" }}>
      <h1>Multi Market Terminal</h1>

      <div style={{ display: "flex", gap: 12 }}>
        <Column title="CRYPTO" type="crypto" color="#00d4ff" />
        <Column title="STOCKS" type="stock" color="#ffd166" />
        <Column title="FX" type="fx" color="#a0ff7a" />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>TRADES</h3>

        {trades.map((t) => (
          <div key={t.id} style={{ fontSize: 12 }}>
            {t.side.toUpperCase()} {t.symbol} @ {t.price.toFixed(2)}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>POSITIONS (PnL)</h3>

        {Object.values(positions).map((p) => {
          const marketPrice = data[p.symbol]?.price ?? 0;

          const pnl =
            p.quantity * (marketPrice - p.avgPrice);

          return (
            <div key={p.symbol} style={{ fontSize: 12, padding: "4px 0" }}>
              {p.symbol} | Qty: {p.quantity} | Avg: {p.avgPrice.toFixed(2)} | PnL:{" "}
              <span style={{ color: pnl >= 0 ? "lime" : "red" }}>
                {pnl.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}