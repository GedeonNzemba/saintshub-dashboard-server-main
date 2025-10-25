import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { CHURCH_DB } from "../../../utilities/tools";

export interface ChurchState {
 data: CHURCH_DB;
}

const initialState: ChurchState = {
 data: {
    __v: 0,
    _id: "",
    name: "",
   banner: [],
   location: "",
   gallery: [],
   image: "",
   liveServices: [{
    preacher: "",
    sermon: "",
    title: "",
   }],
   oldServices: [{
    preacher: "",
    sermon: "",
    title: "",
    cover: "",
   }],
   principal: {
    description: "",
    image: "",
    pastor: "",
    wife: "",
   },
   logo: "",
   securities: {
    deacons: [{
      names: "",
      descriptions: "",
      image: "",
  }],
  trustees: [{
      names: "",
      descriptions: "",
      image: "",
  }],
   },
   songs: [{
    title: "",
    url: "",
   }]
 }
};

export const churchDataSlice = createSlice({
  name: "churchSlice",
  initialState,
  reducers: {
    getChurchData: (state, action: PayloadAction<CHURCH_DB>) => {
        state.data = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getChurchData } = churchDataSlice.actions;

export default churchDataSlice.reducer;
