import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface Item {
    preacher: string;
    sermon: string;
    title: string;
    cover: string;
}

interface Security {
    names: string,
    descriptions: string,
    image: string,
}

interface Principal {
    description: string,
    image: string,
    pastor: string,
    wife: string,
}

export interface ChurchSermonState {
    oldServices: Item[];
    principal: Principal;
    securities: {
        deacons: Security[],
        trustees: Security[],
    },
}

export const initialState: ChurchSermonState = {
    oldServices: [],
    principal: {
        description: "",
        image: "",
        pastor: "",
        wife: "",
    },
    securities: {
        deacons: [],
        trustees: [],
    },
};

export const churchSermonDataSlice = createSlice({
    name: "churchSermonSlice",
    initialState,
    reducers: {
        getChurchSermonData: (state, action: PayloadAction<ChurchSermonState>) => {
            state.oldServices = action.payload.oldServices;
            state.principal = action.payload.principal;
            state.securities = action.payload.securities;
        },
    },
});

// Action creators are generated for each case reducer function
export const { getChurchSermonData } = churchSermonDataSlice.actions;

export default churchSermonDataSlice.reducer;
