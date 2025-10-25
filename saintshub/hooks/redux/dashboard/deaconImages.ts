import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DeaconImagesState {
  images: { [key: string]: string };
  loading: boolean;
  error: string | null;
}

const initialState: DeaconImagesState = {
  images: {},
  loading: false,
  error: null,
};

const deaconImagesSlice = createSlice({
  name: 'deaconImages',
  initialState,
  reducers: {
    setDeaconImage: (state, action: PayloadAction<{ deaconId: string; imageUrl: string }>) => {
      const { deaconId, imageUrl } = action.payload;
      state.images[deaconId] = imageUrl;
    },
    updateDeaconImage: (state, action: PayloadAction<{ deaconId: string; imageUrl: string }>) => {
      const { deaconId, imageUrl } = action.payload;
      state.images[deaconId] = imageUrl;
    },
    removeDeaconImage: (state, action: PayloadAction<string>) => {
      const deaconId = action.payload;
      delete state.images[deaconId];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDeaconImage,
  updateDeaconImage,
  removeDeaconImage,
  setLoading,
  setError,
} = deaconImagesSlice.actions;

export default deaconImagesSlice.reducer;
