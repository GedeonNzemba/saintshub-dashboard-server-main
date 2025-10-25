import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { allServices } from "../../utilities/tools";
import { fetchSermons } from "../../tools/FetchSermons";

const initialState: allServices = {
  sermons: [],
  loading: false,
  status: "idle",
  error: null,
};

// export const sermonsSlice = createSlice({
//   name: "sermons",
//   initialState,
//   reducers: {
//     fetchSermonsStart(state) {
//       state.loading = true;
//       state.error = null;
//     },
//     fetchSermonsSuccess(state, action: PayloadAction<string[]>) {
//       state.sermons = action.payload;
//       state.loading = false;
//       state.error = null;
//     },
//     fetchSermonsFailure(state, action: PayloadAction<string>) {
//       state.loading = false;
//       state.error = action.payload;
//     },
//   },
// });

const sermonsSlice = createSlice({
  name: "sermons",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSermons.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSermons.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.sermons = action.payload;
      })
      .addCase(fetchSermons.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Action creators are generated for each case reducer function
// export const { fetchSermonsStart, fetchSermonsSuccess, fetchSermonsFailure } =
//   sermonsSlice.actions;

export default sermonsSlice.reducer;
