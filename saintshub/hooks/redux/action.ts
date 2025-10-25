// actions/deaconsActions.ts
import { createAction } from '@reduxjs/toolkit';
import { Security } from '../../utilities/tools';

export const updateDeacons = createAction<Security[]>('updateDeacons');
export const updateTrustees = createAction<Security[]>('updateTrustees');
