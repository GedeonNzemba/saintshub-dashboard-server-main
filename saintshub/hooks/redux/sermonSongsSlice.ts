import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { ItemProps, SermonsSongsStates } from "../../utilities/tools";

const initialState: SermonsSongsStates = {
  isSermons: false,
  isSongs: false,
};

export const sermonsSongsSlice = createSlice({
  name: "sermonsSongSlice",
  initialState,
  reducers: {
    updateSermon: (state) => {
      state.isSermons = !state.isSermons;

      if (state.isSermons) {
        state.isSongs = false;
      }
    },

    updateSong: (state) => {
      state.isSongs = !state.isSermons;

      if (state.isSongs) {
        state.isSermons = false;
      }
      // action.type = "UPDATE_SONG_TAB";
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateSermon, updateSong } = sermonsSongsSlice.actions;

export default sermonsSongsSlice.reducer;
