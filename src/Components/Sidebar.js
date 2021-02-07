import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { isSignedIn } from '../Logic/authorize';
import { db } from '../firebase';

import '../Styles/Sidebar.css';

function Sidebar() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    (isSignedIn()) &&
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
        {isSignedIn()
          ?
        channels.map((channel, key) => (
          <Link key={key} to={`/room/${channel.id}`}>
            {channel.name}
          </Link>
        ))
          :
        <span>
          Rooms will appear here.
        </span>}
      </div>
    </div>
  );
}

export default Sidebar;