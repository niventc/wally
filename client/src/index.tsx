import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import './index.css';
import * as serviceWorker from './serviceWorker';

import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { homeReducer } from './home.reducer';
import { userReducer } from './user.reducer';
import { wallReducer } from './wall.reducer';
import { webSocketMiddleware, Connect } from './webSocket.middleware';
import { PersistGate } from 'redux-persist/integration/react';

const rootReducer = combineReducers({home: homeReducer, wall: wallReducer, user: userReducer});
const persistConfig = {
  key: 'home',
  storage: storage,
  whitelist: ["home"]
};
const peristedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(peristedReducer, applyMiddleware(webSocketMiddleware()));
const persistor = persistStore(store);

// Init middleware, shouldn't be here...
store.dispatch(new Connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Route path="/">
            <Home />
          </Route>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
