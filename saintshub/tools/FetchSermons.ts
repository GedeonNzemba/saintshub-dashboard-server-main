import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DATA } from "../utilities/data";

export const fetchSermons = createAsyncThunk("sermons/fetch", async () => {
  // Simulate an asynchronous API call
  return new Promise<string[]>((resolve) => {
    // Fetch the sermons from the DATA array
    const sermons = DATA.reduce((acc: string[], church) => {
      return acc.concat(church.sermons);
    }, []);

    // Simulate a delay of 1 second
    setTimeout(() => {
      resolve(sermons);
    }, 1000);
  });
});
