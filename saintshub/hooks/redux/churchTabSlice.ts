import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { ItemProps } from "../../utilities/tools";

const initialState: ItemProps = {
  data: {
    title: "",
    pastor: "",
    wife: "",
    pastorAndWife: "",
    description: "",
    location: "",
    churchName: "",
    stream: "",
    churchOrder: {
      deacons: {
        names: [],
        descriptions: [],
        images: [],
      },
      trustees: {
        names: [],
        images: [],
      },
    },
    live: [{
      Title: "",
      Title_URL: "",
      cover: "",
      preacher: ""
    }],
    gallery: [],
    songs: [],
  },
};

export const churchTabSlice = createSlice({
  name: "churchTabSlice",
  initialState,
  reducers: {
    updateChurch: (state, action: PayloadAction<ItemProps>) => {
      // state.data.churchName = action.payload.data.churchName;
      // state.data.pastor = action.payload.data.pastor;
      // state.data.location = action.payload.data.location;
      // state.data.stream = action.payload.data.stream;
      // state.data.gallery = action.payload.data.gallery;
      // state.data.wife = action.payload.data.wife;
      // state.data.churchOrder.deacons = action.payload.data.churchOrder.deacons;
      // state.data.churchOrder.trustees =
      //   action.payload.data.churchOrder.trustees;

      state.data = action.payload.data;

      action.type = "UPDATE_CHURCH_TABS";
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateChurch } = churchTabSlice.actions;

export default churchTabSlice.reducer;
