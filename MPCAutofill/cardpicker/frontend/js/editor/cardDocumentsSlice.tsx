import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// import { AnyAction } from 'redux'
// import { RootState } from './store'
// import { ThunkAction } from 'redux-thunk'

// TODO: we should write something to read a page of card IDs from searchResults (100 at a time?) and query the backend for their full data
export const fetchCardDocuments = createAsyncThunk(
  "cardDocuments/fetchCardDocuments",
  async () => {
    const rawResponse = await fetch("/2/getCards/", {
      method: "POST",
      body: JSON.stringify({
        card_identifiers: [
          "1-BVOLIOK35eaNl2ytZtOlieejd0_D4z0",
          "1mCg4xFgdigH2Jyq8dmNHWOe1fht1Eoth",
          "1_rvQRbdskxqoRt94mh6JQrt9VgHdJY7h",
          "1YUOZcuGSJ5Kx4wuLR5bqhAkNUlnYq6fm",
        ],
      }),
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": Cookies.get("csrftoken"),
      },
    });
    const content = await rawResponse.json();
    return content.results;
  }
);

export const cardDocumentsSlice = createSlice({
  name: "cardDocuments",
  initialState: {
    cardDocuments: {}, // card ID -> card document
    status: "idle",
    error: null,
    /*
    reconsider how search results are stored here
    currently - {"opt": {"CARD": [{}, {}, {}, ...]}}
    where each {} represents a full card document from elasticsearch

    i think we need to split this up into two:
    a map which tracks the card IDs associated with each query - card type pair
    and a global map of all card documents keyed by id
     */
  },
  reducers: {
    addCardDocuments: (state, action) => {
      // state.results.push(...action.payload)
      state.cardDocuments = { ...state.cardDocuments, ...action.payload };
    },
  },
  extraReducers(builder) {
    // omit posts loading reducers
    builder.addCase(fetchCardDocuments.fulfilled, (state, action) => {
      // We can directly add the new post object to our posts array
      // state.posts.push(action.payload)
      state.cardDocuments = { ...state.cardDocuments, ...action.payload };
    });
  },
});
export const { addCardDocuments } = cardDocumentsSlice.actions;

// export const getCard = (state: any, cardIdentifier: string) => createSelector(state.cardDocuments.cardDocuments.get(cardIdentifier))

// const logAndAdd = (queries: Array<string>) => {
//   return (dispatch, getState) => {
//     const stateBefore = getState()
//     console.log(`Counter before: ${stateBefore.counter}`)
//     // dispatch(incrementByAmount(queries))
//     const stateAfter = getState()
//     console.log(`Counter after: ${stateAfter.counter}`)
//   }
// }

// export const addSearchResultsAsync = (queries: Array<[string, string]>) => (dispatch: any) => {
//   setTimeout(() => {
//     dispatch(addSearchResults(queries))
//   }, 1000)
// }

// Action creators are generated for each case reducer function
// export const { increment, decrement, incrementByAmount } = cardSlotSlice.actions

export default cardDocumentsSlice.reducer;
