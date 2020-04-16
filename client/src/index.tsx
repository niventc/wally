import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import './index.css';
import * as serviceWorker from './serviceWorker';

import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { userReducer } from './user.reducer';
import { wallReducer } from './wall.reducer';
import { webSocketMiddleware, Connect } from './webSocket.middleware';

const rootReducer = combineReducers({wall: wallReducer, user: userReducer});
const store = createStore(rootReducer, applyMiddleware(webSocketMiddleware()));

// Init middleware, shouldn't be here...
store.dispatch(new Connect());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Route path="/">
          <Home />
        </Route>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
