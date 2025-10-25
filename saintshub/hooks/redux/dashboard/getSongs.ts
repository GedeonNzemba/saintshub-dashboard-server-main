import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SongsState {
  songs: string[];
}

const initialState: SongsState = {
  songs: [],
};

export const songsSlice = createSlice({
  name: "songsState",
  initialState,
  reducers: {
    getSongsFile: (state, action: PayloadAction<string>) => {
      state.songs.push(action.payload);
    },
  },
});

export const { getSongsFile } = songsSlice.actions;

export default songsSlice.reducer;