import { useEffect, useState } from "react";

type Price = {
  symbol: string;
  price: number;
  type: "crypto" | "stock" | "fx";
  direction: "up" | "down" | "same";
};

function getDirection(
  oldPrice: number | undefined,
  newPrice: number
): "up" | "down" | "same" {
  if (oldPrice === undefined) return "same";
  if (newPrice === oldPrice) return "same";
  return newPrice > oldPrice ? "up" : "down";
}

export default function App() {
  const [data, setData] = useState<Record<string, Price>>({});

  useEffect(() => {
    // =========================
    // CRYPTO (BINANCE STREAM)
    // =========================
    const cryptoSocket = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade"
    );

    cryptoSocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (!msg.s || !msg.p) return;

      setData((prev) => {
        const old = prev[msg.s]?.price;

        return {
          ...prev,
          [msg.s]: {
            symbol: msg.s,
            price: Number(msg.p),
            type: "crypto",
            direction: getDirection(old, Number(msg.p)),
          },
        };
      });
    };

    // =========================
    // STOCKS (FINNHUB POLLING)
    // =========================
    const FINNHUB_KEY =
      "d8i21l9r01qm63b99ti0d8i21l9r01qm63b99tig";

    const stockSymbols = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"];

    const fetchStocks = async () => {
      try {
        const updates: Record<string, Price> = {};

        for (const s of stockSymbols) {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_KEY}`
          );

          const json = await res.json();

          if (typeof json?.c !== "number") continue;

          updates[s] = {
            symbol: s,
            price: json.c,
            type: "stock",
            direction: "same",
          };
        }

        setData((prev) => {
          const merged = { ...prev };

          for (const k in updates) {
            const old = prev[k]?.price;

            merged[k] = {
              ...updates[k],
              direction: getDirection(old, updates[k].price),
            };
          }

          return merged;
        });
      } catch (e) {
        console.error("Stock error:", e);
      }
    };

    fetchStocks();
    const stockInterval = setInterval(fetchStocks, 3000);

    // =========================
    // FX (OPEN EXCHANGE RATE)
    // =========================
    const fetchFX = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const json = await res.json();

        if (!json?.rates) return;

        const pairs = [
          { key: "EUR", label: "EUR/USD" },
          { key: "GBP", label: "GBP/USD" },
          { key: "JPY", label: "USD/JPY" },
        ];

        setData((prev) => {
          const updated = { ...prev };

          for (const p of pairs) {
            const rate = json.rates[p.key];
            if (!rate) continue;

            const old = prev[p.label]?.price;

            updated[p.label] = {
              symbol: p.label,
              price: rate,
              type: "fx",
              direction: getDirection(old, rate),
            };
          }

          return updated;
        });
      } catch (e) {
        console.error("FX ERROR:", e);
      }
    };

    fetchFX();
    const fxInterval = setInterval(fetchFX, 5000);

    return () => {
      cryptoSocket.close();
      clearInterval(stockInterval);
      clearInterval(fxInterval);
    };
  }, []);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "sans-serif",
        background: "#0b0f14",
        color: "#e6e6e6",
      }}
    >
      <h1 style={{ marginBottom: 16 }}>Multi Market Terminal</h1>

      <div style={{ display: "flex", gap: 12 }}>

        {/* ================= CRYPTO ================= */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#00d4ff" }}>CRYPTO</h3>

          {Object.values(data)
            .filter((i) => i.type === "crypto")
            .map((item) => (
              <div
                key={item.symbol}
                style={{
                  padding: "4px 8px",
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  borderRadius: 4,
                  background:
                    item.direction === "up"
                      ? "rgba(0,255,0,0.10)"
                      : item.direction === "down"
                      ? "rgba(255,0,0,0.10)"
                      : "transparent",
                }}
              >
                <span>{item.symbol}</span>
                <span>
                  {item.price.toFixed(2)}{" "}
                  {item.direction === "up"
                    ? "↑"
                    : item.direction === "down"
                    ? "↓"
                    : ""}
                </span>
              </div>
            ))}
        </div>

        {/* ================= STOCKS ================= */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#ffd166" }}>STOCKS</h3>

          {Object.values(data)
            .filter((i) => i.type === "stock")
            .map((item) => (
              <div
                key={item.symbol}
                style={{
                  padding: "4px 8px",
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  borderRadius: 4,
                  background:
                    item.direction === "up"
                      ? "rgba(0,255,0,0.10)"
                      : item.direction === "down"
                      ? "rgba(255,0,0,0.10)"
                      : "transparent",
                }}
              >
                <span>{item.symbol}</span>
                <span>
                  {item.price.toFixed(2)}{" "}
                  {item.direction === "up"
                    ? "↑"
                    : item.direction === "down"
                    ? "↓"
                    : ""}
                </span>
              </div>
            ))}
        </div>

        {/* ================= FX ================= */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#a0ff7a" }}>FX</h3>

          {Object.values(data)
            .filter((i) => i.type === "fx")
            .map((item) => (
              <div
                key={item.symbol}
                style={{
                  padding: "4px 8px",
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  borderRadius: 4,
                  background:
                    item.direction === "up"
                      ? "rgba(0,255,0,0.10)"
                      : item.direction === "down"
                      ? "rgba(255,0,0,0.10)"
                      : "transparent",
                }}
              >
                <span>{item.symbol}</span>
                <span>
                  {item.price.toFixed(2)}{" "}
                  {item.direction === "up"
                    ? "↑"
                    : item.direction === "down"
                    ? "↓"
                    : ""}
                </span>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}