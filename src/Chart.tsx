import { useEffect, useRef } from "react";
import { getCandles } from "./candles";

export default function Chart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  const candles = getCandles(symbol);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = 200);
    const height = (canvas.height = 80);

    ctx.clearRect(0, 0, width, height);

    if (!candles.length) return;

    const max = Math.max(...candles.map(c => c.high));
    const min = Math.min(...candles.map(c => c.low));

    const scaleY = (p: number) =>
      height - ((p - min) / (max - min || 1)) * height;

    const candleWidth = width / candles.length;

    candles.forEach((c, i) => {
      const x = i * candleWidth + candleWidth / 2;

      const openY = scaleY(c.open);
      const closeY = scaleY(c.close);
      const highY = scaleY(c.high);
      const lowY = scaleY(c.low);

      const isUp = c.close >= c.open;

      // wick
      ctx.strokeStyle = isUp ? "#00ff88" : "#ff4d4d";
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // body
      ctx.fillStyle = isUp ? "#00ff88" : "#ff4d4d";

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(openY - closeY) || 1;

      ctx.fillRect(
        x - candleWidth / 4,
        bodyTop,
        candleWidth / 2,
        bodyHeight
      );
    });
  }, [candles, symbol]);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        height: 80,
        marginTop: 6,
        background: "#0b0f14",
        borderRadius: 4,
      }}
    />
  );
}