import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { db } from '../firebase';

import '../Styles/Sidebar.css';

function Sidebar() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
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
        <img src="https://www.cubingathome.com/logo.png"/>
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
    </div>
  );
}

export default Sidebar;