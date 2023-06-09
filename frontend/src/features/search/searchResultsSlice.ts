/**
 * State management for search results - what images are returned for what search queries.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { APISearch } from "@/app/api";
import { RootState } from "@/app/store";
import { SearchResults, SearchResultsState } from "@/common/types";
import { selectQueriesWithoutSearchResults } from "@/features/project/projectSlice";

export const fetchCards = createAsyncThunk(
  "searchResults/fetchCards",
  async (arg, thunkAPI) => {
    const state: RootState = thunkAPI.getState();

    const queriesToSearch = selectQueriesWithoutSearchResults(state);
    if (queriesToSearch.length > 0) {
      return APISearch(
        state.backend.url,
        state.searchSettings,
        queriesToSearch
      );
    }
  }
);

const initialState: SearchResultsState = {
  searchResults: {},
  status: "idle", // TODO: I guess we have to manage this ourselves? I thought redux had tooling to manage this
  error: null,
};

export const searchResultsSlice = createSlice({
  name: "searchResults",
  initialState,
  reducers: {
    addSearchResults: (state, action) => {
      state.searchResults = { ...state.searchResults, ...action.payload };
    },
    clearSearchResults: (state) => {
      state.searchResults = {};
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchCards.fulfilled, (state, action) => {
      state.searchResults = { ...state.searchResults, ...action.payload };
    });
    builder.addCase(fetchCards.rejected, (state, action) => {
      alert("TODO");
    });
  },
});
export const { addSearchResults, clearSearchResults } =
  searchResultsSlice.actions;

export default searchResultsSlice.reducer;
