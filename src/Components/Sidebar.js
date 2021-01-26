import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { db } from '../firebase';

function Sidebar() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    db.collection('rooms').onSnapshot(snapshot => (
      setChannels(
        snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })
      ))
    ));
  }, []);

  return (
    <>
      <Link to='/'>Go Home</Link>
      <br/>
      {channels.map((channel, key) => (
        <span key={key}>
          <Link to={`/room/${channel.id}`}>
            {channel.name}
          </Link>
          <br/>
        </span>
      ))}
    </>
  );
}

export default Sidebar;