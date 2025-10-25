// reducers/trusteesReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Security } from '../../../utilities/tools';

interface TrusteesState {
  trustees: Security[];
}

const initialState: TrusteesState = {
  trustees: [],
};

const trusteesSlice = createSlice({
  name: 'trustees',
  initialState,
  reducers: {
    updateTrustees: (state, action: PayloadAction<Security[]>) => {
      state.trustees = action.payload;
    },
  },
});

export const { updateTrustees } = trusteesSlice.actions;
export default trusteesSlice.reducer;
