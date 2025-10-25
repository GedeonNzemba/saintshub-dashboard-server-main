import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface BottomSheetState {
  sheetStatus: boolean;
  value: string;
  state: {
    allServices: boolean;
    offline: boolean;
    music: boolean;
    bible: boolean;
    media: boolean;
    quoteOfTheDay: boolean;
  };
}

const initialState: BottomSheetState = {
  sheetStatus: false,
  value: "",
  state: {
    allServices: false,
    offline: false,
    music: false,
    bible: false,
    media: false,
    quoteOfTheDay: false,
  },
};


export const bottomSheet = createSlice({
  name: "bottomSheet",
  initialState,
  reducers: {
    updateSheet: (
      state,
      action: PayloadAction<{
        sheetStatus: boolean;
        value: string;
        state: { allServices: boolean; offline: boolean; music: boolean, bible: boolean; media: boolean, quoteOfTheDay: boolean };
      }>
    ) => {
      state.sheetStatus = action.payload.sheetStatus;
      state.value = action.payload.value;
      state.state.allServices = action.payload.state.allServices;
      state.state.offline = action.payload.state.offline;
      state.state.music = action.payload.state.music;
      state.state.bible = action.payload.state.bible;
      state.state.media = action.payload.state.media;
      state.state.quoteOfTheDay = action.payload.state.quoteOfTheDay;
      action.type = "UPDATE_SHEET";
    },
  },
});



// Action creators are generated for each case reducer function
export const { updateSheet } = bottomSheet.actions;

export default bottomSheet.reducer;
