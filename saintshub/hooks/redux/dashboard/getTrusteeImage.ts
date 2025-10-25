import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface TrusteeImageState {
  trusteesImage?: string;
}

const initialState: TrusteeImageState = {
  trusteesImage: ""
};

export const trusteeImageSlice = createSlice({
  name: "trusteeImageState",
  initialState,
  reducers: {
    getTrusteesImage: (state, action: PayloadAction<string>) => {
      state.trusteesImage = action.payload;
    }
  },
});

// Action creators are generated for each case reducer function
export const { getTrusteesImage } = trusteeImageSlice.actions;

export default trusteeImageSlice.reducer;
