import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface PastServicesState {
  pastServices: string[];
}

const initialState: PastServicesState = {
  pastServices: [],
};

export const pastServicesSlice = createSlice({
  name: "pastServicesState",
  initialState,
  reducers: {
    getPastServicesImage: (state, action: PayloadAction<string>) => {
      state.pastServices.push(action.payload);
    },
  },
});

export const { getPastServicesImage } = pastServicesSlice.actions;

export default pastServicesSlice.reducer;