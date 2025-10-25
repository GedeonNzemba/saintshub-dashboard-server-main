import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChurchGalleryState {
 churchGallery: string[];
}

const initialState: ChurchGalleryState = {
 churchGallery: [],
};

export const churchGallerySlice = createSlice({
  name: "churchGalleryState",
  initialState,
  reducers: {
    getChurchGallery: (state, action: PayloadAction<string>) => {
          state.churchGallery = [...state.churchGallery, action.payload];
    },
    clearChurchGallery: (state) => {
          state.churchGallery = [];
    },
    removeChurchGalleryByIndex: (state, action: PayloadAction<number>) => {
          state.churchGallery = state.churchGallery.filter((_, index) => index !== action.payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { getChurchGallery, clearChurchGallery, removeChurchGalleryByIndex } = churchGallerySlice.actions;

export default churchGallerySlice.reducer;
