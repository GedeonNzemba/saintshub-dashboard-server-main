import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CLOSE_MODAL } from "../../constants/modalConstant";
import { OPEN_MODAL } from "../../constants/modalConstant";

export interface VideoModalTypes {
  modalVisible: string;
  churchName: string;
  live: {
    title: string;
    preacher: string;
    sermon: string
  }[]
}

const initialModalState: VideoModalTypes = {
  modalVisible: "",
  churchName: "",
  live: [{title: "", preacher: "", sermon: ""}]
};

const init: VideoModalTypes = {
  modalVisible: "",
  churchName: "",
  live: [{title: "", preacher: "", sermon: ""}]
};

export const videoModalSlice = createSlice({
  name: "showModal",
  initialState: {
    modalVisible: initialModalState.modalVisible,
    churhName: initialModalState.churchName,
    live: initialModalState.live
  },
  reducers: {
    showModal: (
      state,
      action: PayloadAction<{
        modalVisible: string;
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
    hideModal: (state) => {
      state.modalVisible = CLOSE_MODAL;
      state.churhName = init.churchName;
      state.live = init.live
    },
  },
});
// , { payload }: PayloadAction<boolean>
export const { showModal, hideModal } = videoModalSlice.actions;

// export const selectTodos = (state) => state.modalVisible;

export default videoModalSlice.reducer;
