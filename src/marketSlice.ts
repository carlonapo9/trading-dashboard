import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type MarketType = "crypto" | "stock" | "fx";
export type Direction = "up" | "down" | "same";

export type Price = {
  symbol: string;
  price: number;
  type: MarketType;
  direction: Direction;
};

type State = {
  data: Record<string, Price>;
  last: Record<string, number>;
};

const initialState: State = {
  data: {},
  last: {},
};

function getDirection(prev: number | undefined, next: number): Direction {
  if (prev === undefined) return "same";
  if (next === prev) return "same";
  return next > prev ? "up" : "down";
}

type Payload = {
  symbol: string;
  price: number;
  type: MarketType;
};

const slice = createSlice({
  name: "market",
  initialState,
  reducers: {
    upsert: (state, action: PayloadAction<Payload>) => {
      const { symbol, price, type } = action.payload;

      const prev = state.last[symbol];
      state.last[symbol] = price;

      state.data[symbol] = {
        symbol,
        price,
        type,
        direction: getDirection(prev, price),
      };
    },
  },
});

export const { upsert } = slice.actions;
export default slice.reducer;