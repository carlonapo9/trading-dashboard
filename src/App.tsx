import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { upsert } from "./marketSlice";

const CRYPTO =
  "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade";

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"];

const FX = [
  { key: "EUR", label: "EUR/USD" },
  { key: "GBP", label: "GBP/USD" },
  { key: "JPY", label: "USD/JPY" },
];

const KEY = "d8i21l9r01qm63b99ti0d8i21l9r01qm63b99tig";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((s: RootState) => s.market.data);

  // CRYPTO
  useEffect(() => {
    const ws = new WebSocket(CRYPTO);

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (!msg?.s || !msg?.p) return;

      dispatch(
        upsert({
          symbol: msg.s,
          price: Number(msg.p),
          type: "crypto",
        })
      );
    };

    return () => ws.close();
  }, [dispatch]);

  // STOCKS
  useEffect(() => {
    const run = async () => {
      const results = await Promise.all(
        STOCKS.map(async (s) => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s}&token=${KEY}`
          );
          const j = await r.json();
          return { s, price: j?.c };
        })
      );

      results.forEach((x) => {
        if (typeof x.price === "number") {
          dispatch(
            upsert({
              symbol: x.s,
              price: x.price,
              type: "stock",
            })
          );
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
      if (!j?.rates) return;

      FX.forEach((p) => {
        const rate = j.rates[p.key];
        if (!rate) return;

        dispatch(
          upsert({
            symbol: p.label,
            price: rate,
            type: "fx",
          })
        );
      });
    };

    run();
    const id = setInterval(run, 5000);
    return () => clearInterval(id);
  }, [dispatch]);

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
              padding: "4px 8px",
              marginBottom: 4,
              fontSize: 13,
              borderRadius: 4,
              background:
                i.direction === "up"
                  ? "rgba(0,255,0,0.10)"
                  : i.direction === "down"
                  ? "rgba(255,0,0,0.10)"
                  : "transparent",
            }}
          >
            <span>{i.symbol}</span>
            <span>
              {i.price.toFixed(2)}{" "}
              {i.direction === "up"
                ? "↑"
                : i.direction === "down"
                ? "↓"
                : ""}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#0b0f14",
        color: "#e6e6e6",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Multi Market Terminal</h1>

      <div style={{ display: "flex", gap: 12 }}>
        <Column title="CRYPTO" type="crypto" color="#00d4ff" />
        <Column title="STOCKS" type="stock" color="#ffd166" />
        <Column title="FX" type="fx" color="#a0ff7a" />
      </div>
    </div>
  );
}