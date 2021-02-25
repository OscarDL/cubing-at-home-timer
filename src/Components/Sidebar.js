import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { db } from '../firebase';

import '../Styles/Sidebar.css';

function Sidebar() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    db.collection('timer-rooms').where('completed', '!=', true).onSnapshot(snapshot => (
      setChannels(
        snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })
      ))
    ));

    document.addEventListener('click', function(e) {
      if (window.innerWidth < 992) {
        ((e.target.className).includes('room')) && (document.querySelector('.sidebar').style.display = 'none');
        ((e.target.className).includes('sidebarBtn')) && (document.querySelector('.sidebar').style.display = 'block');
      }
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
          {channels.map((channel, i) => 
            <Link key={i} title={channel.name} className="room" to={`/room/${channel.id}`}>
              {channel.name}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;