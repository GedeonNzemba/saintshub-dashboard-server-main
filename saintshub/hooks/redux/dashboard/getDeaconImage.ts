import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface DeaconImageState {
  deaconsImage?: string;
}

const initialState: DeaconImageState = {
  deaconsImage: "",
};

export const deaconImageSlice = createSlice({
  name: "deaconImageState",
  initialState,
  reducers: {
    getDeaconsImage: (state, action: PayloadAction<string>) => {
      state.deaconsImage = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getDeaconsImage } = deaconImageSlice.actions;

export default deaconImageSlice.reducer;
