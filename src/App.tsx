import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { upsert } from "./marketSlice";
import { addTrade } from "./tradeSlice";
import { useMarketFeeds } from "./useMarketFeeds";
import Chart from "./Chart";

const CRYPTO =
  "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/xrpusdt@trade/adausdt@trade/dogeusdt@trade/ltcusdt@trade";

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"] as const;

const FX = [
  { key: "EUR", label: "EUR/USD" },
  { key: "GBP", label: "GBP/USD" },
  { key: "JPY", label: "USD/JPY" },
] as const;

const FINNHUB_KEY =
  "d8i21l9r01qm63b99ti0d8i21l9r01qm63b99tig";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((s: RootState) => s.market.data);
  const trades = useSelector((s: RootState) => s.trade.trades);
  const positions = useSelector((s: RootState) => s.trade.positions);

  useMarketFeeds();

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

    setTimeout(() => {
      dispatch(addTrade(tradeSnapshot));
    }, 300 + Math.random() * 1200);
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
      <div
        style={{
          background: "#0f1623",
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <h3 style={{ color, margin: 0, fontSize: 14 }}>{title}</h3>

        {items.map((i) => (
          <div
            key={i.symbol}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 6,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* TOP ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span>{i.symbol}</span>
              <span style={{ fontWeight: 600 }}>
                {i.price.toFixed(2)}
              </span>
            </div>

            {/* CHART (SMALL + CLEAN) */}
            <div style={{ height: 28, overflow: "hidden", opacity: 0.8 }}>
              <Chart symbol={i.symbol} />
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{ fontSize: 11 }}
                onClick={() =>
                  placeTrade(i.symbol, i.price, i.type, "buy")
                }
              >
                BUY
              </button>

              <button
                style={{ fontSize: 11 }}
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
    <div
      style={{
        padding: 16,
        background: "#0b0f14",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>
        Multi Market Terminal
      </h1>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        <Column title="CRYPTO" type="crypto" color="#00d4ff" />
        <Column title="STOCKS" type="stock" color="#ffd166" />
        <Column title="FX" type="fx" color="#a0ff7a" />
      </div>

      {/* TRADES */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: 14 }}>TRADES</h3>

        <div style={{ fontSize: 11, opacity: 0.9 }}>
          {trades.slice(0, 10).map((t) => (
            <div key={t.id}>
              {t.side.toUpperCase()} {t.symbol} @ {t.price.toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      {/* POSITIONS */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: 14 }}>POSITIONS</h3>

        {Object.values(positions).map((p) => {
          const marketPrice = data[p.symbol]?.price ?? 0;
          const pnl = p.quantity * (marketPrice - p.avgPrice);

          return (
            <div key={p.symbol} style={{ fontSize: 11 }}>
              {p.symbol} | {p.quantity} | Avg {p.avgPrice.toFixed(2)} |{" "}
              <span style={{ color: pnl >= 0 ? "#00ff88" : "#ff4d4d" }}>
                {pnl.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}