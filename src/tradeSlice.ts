import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type TradeSide = "buy" | "sell";

export type Trade = {
  id: string;
  symbol: string;
  price: number;
  side: TradeSide;
  type: "crypto" | "stock" | "fx";
  time: number;
};

type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

type State = {
  trades: Trade[];
  positions: Record<string, Position>;
};

const initialState: State = {
  trades: [],
  positions: {},
};

function updatePosition(
  current: Position | undefined,
  side: TradeSide,
  price: number
): Position {
  if (!current) {
    const qty = side === "buy" ? 1 : -1;

    return {
      symbol: "",
      quantity: qty,
      avgPrice: price,
    };
  }

  const newQty = side === "buy" ? current.quantity + 1 : current.quantity - 1;

  const totalCost =
    current.avgPrice * current.quantity + price * (side === "buy" ? 1 : -1);

  return {
    symbol: current.symbol,
    quantity: newQty,
    avgPrice: newQty === 0 ? 0 : totalCost / newQty,
  };
}

const slice = createSlice({
  name: "trade",
  initialState,
  reducers: {
    addTrade: (state, action: PayloadAction<Trade>) => {
      const t = action.payload;

      state.trades.unshift(t);

      const existing = state.positions[t.symbol];

      const updated = updatePosition(existing, t.side, t.price);
      updated.symbol = t.symbol;

      state.positions[t.symbol] = updated;
    },
  },
});

export const { addTrade } = slice.actions;
export default slice.reducer;