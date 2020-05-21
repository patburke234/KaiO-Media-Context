import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import RemoteServerContext from './context/remoteServerContext';
import { MediaProvider } from './context/mediaContext';
import { FirebaseStorageServer } from './context/remoteServer';

ReactDOM.render(
  <React.StrictMode>
    <RemoteServerContext.Provider value={new FirebaseStorageServer()}> 
      <MediaProvider>
        <App />
      </MediaProvider>
    </RemoteServerContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
