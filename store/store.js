import {
  legacy_createStore as createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import thunk from 'redux-thunk';
import credentialsReducer from './reducers/credentials';
const rootReducer = combineReducers({
  credentialsReducer,
});
export const store = createStore(rootReducer, applyMiddleware(thunk));
