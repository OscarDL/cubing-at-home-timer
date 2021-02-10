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
    document.addEventListener('touchend', function(e) { // Hacky way of handling sidebar on mobile
      ((e.target.className).includes('room')) && (setTimeout(function() { document.querySelector('.sidebar').style.display = 'none' }, 75));
      ((e.target.className).includes('sidebarBtn')) && (setTimeout(function() { document.querySelector('.sidebar').style.display = 'block' }, 75));
    }, false);
  }, []);

  return (
    <>
      <span className="material-icons sidebarBtn">menu</span>
      <div className="sidebar">
        <Link to='/' className="branding room">
          <img className="room" src="https://www.cubingathome.com/logo.png" alt="logo"/>
          <h1 className="room">TIMER</h1>
        </Link>
        <hr/>
        <div className="rooms">
          {channels.map((channel, key) => (
            <Link key={key} className="room" to={`/room/${channel.id}`}>
              {channel.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default Sidebar;