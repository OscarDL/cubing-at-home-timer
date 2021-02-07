import React, { useState, useEffect } from 'react';
import { LinearProgress } from '@material-ui/core';
import { Switch, Route, Redirect } from 'react-router-dom';

import { isSignedIn, login, logout } from '../Logic/authorize';
import { getMe } from '../Logic/user'; 
import Timer from './Timer/Timer';
import Sidebar from './Sidebar';

import '../Styles/App.css';

function App() {

  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()?.then(res => setUser(res));
    document.addEventListener('click', function(e) {
      (document.querySelector('.profile > ul') !== undefined && document.querySelector('.profile > ul') !== null)
        &&
      (document.querySelector('.profile > ul').style.display = e.target.className.includes('profile') ? 'block' : 'none');
    }, false);
  }, []);

  return (
    <div className="app">
      <Sidebar/>
      <div className="body">
        {isSignedIn() ?
          (user
            ?
          <li className="profile">
            {user.me.avatar.thumb_url.includes('missing_avatar')
              ?
            <span className="material-icons profile__icon">account_circle</span>
              : 
            <img src={user.me.avatar.thumb_url} alt="profile_picture"/>}

            <span className="profile__name">{user.me.name}</span>
            <ul className="profile__dropdown">
                <li>
                  <a target='_blank' rel='noreferrer' href="https://cubingathome.com">Cubing at Home</a>
                </li>
                {user.me.url
                  &&
                <li>
                  <a target='_blank' rel='noreferrer' href={user.me.url}>My WCA profile</a>
                </li>}
                <li onClick={() => logout().then(window.location.href = '/')}>
                  <span>Log out</span>
                </li>
            </ul>
            <span className="material-icons profile_arrow">arrow_drop_down</span>
          </li>
            :
          <LinearProgress />)
        :
          <li className="profile">
            <span className="material-icons profile__icon">no_accounts</span>
            <span className="profile__name">Not connected</span>
            <ul className="profile__dropdown">
              <li onClick={() => login()}>
                <span>Sign in with WCA</span>
              </li>
            </ul>
            <span className="material-icons profile_arrow">arrow_drop_down</span>
          </li>
        }
        <Switch>
          <Route exact path="/">
            {isSignedIn()
              ?
            <span className="welcome">
              <img src="https://www.cubingathome.com/logo.png" alt="logo"/>
              <span>
                <h1>Welcome to the C@H online timer!</h1>
                <h2>Please select a room on the left side.</h2>
              </span>
            </span>
              :
            <span className="welcome" style={{justifyContent: 'center'}}>
              <h1>Please sign in with your WCA account<br/>in order to join head-to-head rooms.</h1>
            </span>}
          </Route>
          <Route path="/room/:roomId">
            <Timer user={user}/>
          </Route>
          <Route render={() => <Redirect to='/' />} />
        </Switch>
      </div>
    </div>
  );
}

export default App;