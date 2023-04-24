import {LOAD_API_KEYS, CREATE_API_KEYS} from '../actions/credentials';

const initialState = {
  apiKeys: [],
};

function credentialsReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_API_KEYS:
      return Object.assign({}, state, {
        apiKeys: action.payload,
      });
    case CREATE_API_KEYS:
      const newValue = [...state.apiKeys, ...action.payload];
      return Object.assign({}, state, {
        apiKeys: newValue,
      });
    default:
      return state;
  }
}
export default credentialsReducer;
