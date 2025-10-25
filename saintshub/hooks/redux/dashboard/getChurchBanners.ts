import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChurchBannerImageState {
 churchBannerImage: string[];
}

const initialState: ChurchBannerImageState = {
 churchBannerImage: [],
};

export const churchBannerImageSlice = createSlice({
  name: "churchBannerImageState",
  initialState,
  reducers: {
    getChurchBannerImage: (state, action: PayloadAction<string>) => {
          state.churchBannerImage = [...state.churchBannerImage, action.payload];
    },
    clearChurchBanners: (state) => {
          state.churchBannerImage = [];
    },
    removeChurchBannerByIndex: (state, action: PayloadAction<number>) => {
          state.churchBannerImage = state.churchBannerImage.filter((_, index) => index !== action.payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { getChurchBannerImage, clearChurchBanners, removeChurchBannerByIndex } = churchBannerImageSlice.actions;

export default churchBannerImageSlice.reducer;
