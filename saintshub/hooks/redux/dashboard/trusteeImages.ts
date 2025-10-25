import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TrusteeImagesState {
  images: { [key: string]: string };
  loading: boolean;
  error: string | null;
}

const initialState: TrusteeImagesState = {
  images: {},
  loading: false,
  error: null,
};

const trusteeImagesSlice = createSlice({
  name: 'trusteeImages',
  initialState,
  reducers: {
    setTrusteeImage: (state, action: PayloadAction<{ trusteeId: string; imageUrl: string }>) => {
      const { trusteeId, imageUrl } = action.payload;
      state.images[trusteeId] = imageUrl;
    },
    updateTrusteeImage: (state, action: PayloadAction<{ trusteeId: string; imageUrl: string }>) => {
      const { trusteeId, imageUrl } = action.payload;
      state.images[trusteeId] = imageUrl;
    },
    removeTrusteeImage: (state, action: PayloadAction<string>) => {
      const trusteeId = action.payload;
      delete state.images[trusteeId];
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
  setTrusteeImage,
  updateTrusteeImage,
  removeTrusteeImage,
  setLoading,
  setError,
} = trusteeImagesSlice.actions;

export default trusteeImagesSlice.reducer;
