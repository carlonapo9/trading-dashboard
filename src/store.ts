import { configureStore } from "@reduxjs/toolkit";
import marketReducer from "./marketSlice";
import tradeReducer from "./tradeSlice";

export const store = configureStore({
  reducer: {
    market: marketReducer,
    trade: tradeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;