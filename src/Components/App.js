import React, { useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';

import Timer from './Timer/Timer';
import Sidebar from './Sidebar';

import '../Styles/App.css';

function parseURLParams(url) {
  var queryStart = url.indexOf('?') + 1,
      queryEnd   = url.length,
      query = url.slice(queryStart, queryEnd),
      pairs = query.replace(/\+/g, " ").split("&"),
      params = {}, i, n, v, nv;

  if (query === url || query === "") return;

  for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split("=", 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);

      if (!params.hasOwnProperty(n)) params[n] = [];
      params[n].push(nv.length === 2 ? v : null);
  }
  return params;
}

function App() {

  useEffect(() => {
    (parseURLParams(window.location.href)?.key !== undefined)
      &&
    localStorage.setItem('key', parseURLParams(window.location.href)?.key);
    
    (parseURLParams(window.location.href)?.runner !== undefined)
      &&
    localStorage.setItem('runner', parseURLParams(window.location.href)?.runner);

    window.history.replaceState(null, null, window.location.pathname);
  }, []);


  return (
    <div className="app">
      <div className="sidebar">
        <Sidebar/>
      </div>
      <div className="body">
        <Switch>
          <Route exact path="/">
            <span>
              <h1>Welcome to the C@H online timer!</h1>
              <p>Please select a room on the left side.</p>
            </span>
          </Route>
          <Route path="/room/:roomId">
            <Timer/>
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default App;