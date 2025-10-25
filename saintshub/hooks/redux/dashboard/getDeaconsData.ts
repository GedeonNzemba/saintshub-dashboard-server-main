import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeaconsState {
    images: { [key: string]: string };
    loading: boolean;
    error: string | null;
}

const initialState: DeaconsState = {
    images: {},
    loading: false,
    error: null,
};

const deaconsSlice = createSlice({
    name: 'deaconImages',
    initialState,
    reducers: {
        setDeaconImage: (state, action: PayloadAction<{ deaconId: string; imageUrl: string }>) => {
            const { deaconId, imageUrl } = action.payload;
            state.images[deaconId] = imageUrl;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        resetDeaconImages: (state) => {
            state.images = {};
            state.error = null;
        },
    },
});

export const { 
    setDeaconImage, 
    setLoading, 
    setError, 
    resetDeaconImages 
} = deaconsSlice.actions;

export default deaconsSlice.reducer;