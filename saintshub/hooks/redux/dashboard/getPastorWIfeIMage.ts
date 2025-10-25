import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface PastorWifeImageState {
  pastorWifeImage?: string;
}

const initialState: PastorWifeImageState = {
  pastorWifeImage: "",
};

export const pastorWifeImageSlice = createSlice({
  name: "pastorWifeImageState",
  initialState,
  reducers: {
    getPastorWifesImage: (state, action: PayloadAction<string>) => {
      state.pastorWifeImage = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getPastorWifesImage } = pastorWifeImageSlice.actions;

export default pastorWifeImageSlice.reducer;
