import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChurchImageState {
  churchImage?: string;
}

const initialState: ChurchImageState = {
  churchImage: "",
};

export const churchImageSlice = createSlice({
  name: "churchImageState",
  initialState,
  reducers: {
    getChurchImage: (state, action: PayloadAction<string>) => {
      state.churchImage = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getChurchImage } = churchImageSlice.actions;

export default churchImageSlice.reducer;
