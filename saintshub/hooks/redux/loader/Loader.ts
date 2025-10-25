import { AnyAction, createSlice } from "@reduxjs/toolkit";

interface GlobalSliceInitialState {
    loading: boolean;
}

export const initialState: GlobalSliceInitialState = {
  loading: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  extraReducers: (builder) => {
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = globalSlice.actions;

export default globalSlice.reducer;