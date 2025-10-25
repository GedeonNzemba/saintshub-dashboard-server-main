import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "../../../utilities/tools";

const initialState: UserState = {
  avatar: {
    url: ""
  },
  _id: "",
  name: "",
  surname: "",
  email: "",
  password: "",
  __v: 0,
  type: "",
  admin: false
  
};

export const userDataSlice = createSlice({
    name: "UserDataState",
    initialState,
    reducers: {
      updateUserData: (state, action: PayloadAction<UserState>) => {
        state.name = action.payload.name;
        state.surname = action.payload.surname;
        state.email = action.payload.email;
        state.password = action.payload.password;
        state.avatar.url = action.payload.avatar.url;
        state._id = action.payload._id;
        state.__v = action.payload.__v;
        state.type = action.payload.type;
        state.admin = action.payload.admin;

      },
    },
});

export const { updateUserData } = userDataSlice.actions;

export default userDataSlice.reducer;