import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface PrincipalImageState {
  principalImage?: string;
}

const initialState: PrincipalImageState = {
  principalImage: "",
};

export const principalImageSlice = createSlice({
  name: "principalImageState",
  initialState,
  reducers: {
    getPrincipalImage: (state, action: PayloadAction<string>) => {
      state.principalImage = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getPrincipalImage } = principalImageSlice.actions;

export default principalImageSlice.reducer;
