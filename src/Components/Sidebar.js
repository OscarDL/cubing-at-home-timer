import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { db } from '../firebase';

import '../Styles/Sidebar.css';

import { isSignedIn, login, logout } from "../Logic/authorize";
import { getMe } from "../Logic/user"; 

function Sidebar() {
  const [channels, setChannels] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()?.then(res=>setUser(res));
    db.collection('timer-rooms').onSnapshot(snapshot => (
      setChannels(
        snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })
      ))
    ));
  }, []);

  return (
    <div className="sidebar">
      <Link to='/' className="branding">
        <img src="https://www.cubingathome.com/logo.png" alt="logo"/>
        <h1>TIMER</h1>
      </Link>
      <hr/>
      <div className="rooms">
        {channels.map((channel, key) => (
          <Link key={key} to={`/room/${channel.id}`}>
            {channel.name}
          </Link>
        ))}
      </div>
      <div className="signin" >
          <button id="login"
            onClick={isSignedIn() ? () => logout().then((window.location.href = '/')) : login}>
              {user?user.me.wca_id : "Sign in"}
            </button>
      </div>
    </div>
  );
}

export default Sidebar;