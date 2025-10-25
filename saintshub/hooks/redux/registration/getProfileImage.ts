import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserImageState {
  userImage: string;
}

const initialState: UserImageState = {
  userImage: "",
};

export const userImageSlice = createSlice({
  name: "userProfileImage",
  initialState,
  reducers: {
    getUserImage: (state, action: PayloadAction<string>) => {
      state.userImage = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { getUserImage } = userImageSlice.actions;

export default userImageSlice.reducer;
