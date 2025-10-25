import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface DetachedBottomSheetState {
  status: boolean;
  image?: string;
  sub_image?: string;
  headerText_primary?: string;
  headerText_secondary?: string;
  bodyText_one: string;
  bodyText_two: string;
  bodyText_three?: string | undefined;
  bodyText_four?: string | undefined;
  bodyText_five?: string | undefined;
  multipleContent?: string[];

  // drawermodal
  heading?: string;
  subheading?: string;
}

const initialState: DetachedBottomSheetState = {
  status: false,
  image: "",
  sub_image: "",
  headerText_primary: "",
  headerText_secondary: "",
  bodyText_one: "",
  bodyText_two: "",
  bodyText_three: "",
  bodyText_four: "",
  bodyText_five: "",
  multipleContent: [],
  heading: "",
  subheading: ""
};

export const detachedBottomSheet = createSlice({
  name: "detachedInitialState",
  initialState,
  reducers: {
    updateSheet: (state) => {
      state.status = !state.status;
    },
    updateSheetContent: (
      state,
      action: PayloadAction<{
        image?: string;
        sub_image?: string;
        headerText_primary?: string;
        headerText_secondary?: string;
        bodyText_one: string;
        bodyText_two: string;
        bodyText_three?: string | undefined;
        bodyText_four?: string | undefined;
        bodyText_five?: string | undefined;
        multipleContent?: string[];
        heading?: string;
        subheading?: string;
      }>
    ) => {
      state.image = action.payload.image;
      state.sub_image = action.payload.sub_image;
      state.headerText_primary = action.payload.headerText_primary;
      state.headerText_secondary = action.payload.headerText_secondary;
      state.bodyText_one = action.payload.bodyText_one;
      state.bodyText_two = action.payload.bodyText_two;
      state.bodyText_three = action.payload.bodyText_three;
      state.bodyText_four = action.payload.bodyText_four;
      state.bodyText_five = action.payload.bodyText_five;
      state.multipleContent = action.payload.multipleContent;
      state.heading = action.payload.heading;
      state.subheading = action.payload.subheading;
    },
  },
});

export const { updateSheet, updateSheetContent } = detachedBottomSheet.actions;

export default detachedBottomSheet.reducer;
