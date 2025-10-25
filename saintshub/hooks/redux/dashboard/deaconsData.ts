import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Security } from '../../../utilities/tools';

interface DeaconsState {
  deacons: Security[];
}

const initialState: DeaconsState = {
  deacons: [],
};

const deaconsSlice = createSlice({
  name: 'deacons',
  initialState,
  reducers: {
    updateDeacons: (state, action: PayloadAction<Security[]>) => {
      state.deacons = action.payload;
    },
  },
});

export const { updateDeacons } = deaconsSlice.actions;
export default deaconsSlice.reducer;
