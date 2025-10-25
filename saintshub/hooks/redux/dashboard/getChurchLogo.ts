import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChurchLogoState {
  churchLogo: string;
}

const initialState: ChurchLogoState = {
  churchLogo: "",
};

export const churchLogoSlice = createSlice({
  name: "churchLogoState",
  initialState,
  reducers: {
    getChurchLogo: (state, action: PayloadAction<string>) => {
          state.churchLogo = action.payload;
    },
  },
});


// Action creators are generated for each case reducer function
export const { getChurchLogo } = churchLogoSlice.actions;

export default churchLogoSlice.reducer;
