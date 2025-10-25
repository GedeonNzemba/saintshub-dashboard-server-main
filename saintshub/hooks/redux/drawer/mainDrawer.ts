import { createSlice } from "@reduxjs/toolkit";

export interface MainDrawerType {
    drawer: boolean;
}

const initialDrawerState: MainDrawerType = {
  drawer: false
};

export const mainDrawer = createSlice({
  name: "mainDrawer",
  initialState: {
      drawer: initialDrawerState.drawer
  },
  reducers: {
    openDrawer: (state) => {
      state.drawer = true;
      },
      closeDrawer: (state) => {
        state.drawer = false;
      },
  },
});
// , { payload }: PayloadAction<boolean>
export const { openDrawer, closeDrawer } = mainDrawer.actions;

// export const selectTodos = (state) => state.modalVisible;

export default mainDrawer.reducer;
