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
  symbol: string,
  side: TradeSide,
  price: number
): Position {
  if (!current) {
    return {
      symbol,
      quantity: side === "buy" ? 1 : -1,
      avgPrice: price,
    };
  }

  const newQty = side === "buy"
    ? current.quantity + 1
    : current.quantity - 1;

  const totalCost =
    current.avgPrice * current.quantity +
    price * (side === "buy" ? 1 : -1);

  return {
    symbol,
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

      state.positions[t.symbol] = updatePosition(
        existing,
        t.symbol,
        t.side,
        t.price
      );
    },
  },
});

export const { addTrade } = slice.actions;
export default slice.reducer;