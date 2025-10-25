import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface LiveModalTypes {
  modalVisible: boolean;
  churchName: string;
  live: {
    title: string;
    preacher: string;
    sermon: string
  }[]
}

const initialModalState: LiveModalTypes = {
  modalVisible: false,
  churchName: "",
  live: [{title: "", preacher: "", sermon: ""}]
};

const init: LiveModalTypes = {
  modalVisible: false,
  churchName: "",
  live: [{title: "", preacher: "", sermon: ""}]
};

export const liveModalSlice = createSlice({
  name: "liveModal",
  initialState: {
    modalVisible: initialModalState.modalVisible,
    churhName: initialModalState.churchName,
    live: initialModalState.live
  },
  reducers: {
    liveModal: (
      state,
      action: PayloadAction<{
        modalVisible: boolean;
        churchName: string;
        live: {
          title: string;
          preacher: string;
          sermon: string
        }[]
      }>
    ) => {
      state.modalVisible = action.payload.modalVisible;
      state.churhName = action.payload.churchName;
      state.live = action.payload.live
    },
    hideLiveModal: (state) => {
      state.modalVisible = init.modalVisible;
      state.churhName = init.churchName;
      state.live = init.live
    },
  },
});
// , { payload }: PayloadAction<boolean>
export const { liveModal, hideLiveModal } = liveModalSlice.actions;

// export const selectTodos = (state) => state.modalVisible;

export default liveModalSlice.reducer;
