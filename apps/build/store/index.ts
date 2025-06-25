import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import setup from './setup';

const rootReducer = combineReducers({ setup });

const middleware = [thunk];

const composeWithDevTools =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.() &&
  process.env.NODE_ENV === 'development'
    ? // @ts-expect-error we aren't passing any compose fns to devtools
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;

const composedEnhancers = composeWithDevTools(applyMiddleware(...middleware));

const Store = () => createStore(rootReducer, composedEnhancers);
export default Store;
