import React, { useEffect, useState } from 'react';

import { db } from '../../firebase';

function formatTimer(timer) {
  return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
}

export default function Spectator({ room, complete }) {
  const [roomInfo, setRoomInfo] = useState({});

  const [runner1, setRunner1] = useState({});
  const [runner2, setRunner2] = useState({});


  useEffect(() => {
    let info = db.collection('timer-rooms').doc(room).collection('runners').doc('runner1').onSnapshot(s => setRunner1(s.data()));
    return () => info();
  }, [room, setRunner1]);

  useEffect(() => {
    let info = db.collection('timer-rooms').doc(room).collection('runners').doc('runner2').onSnapshot(s => setRunner2(s.data()));
    return () => info();
  }, [room, setRunner2]);

  useEffect(() => {
    let info = db.collection('timer-rooms').doc(room).onSnapshot(s => setRoomInfo(s.data()));
    return () => info();
  }, [room]);


  return (
    <div className="timer">
      {complete
        ?
      <h1 style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <img src="https://www.cubingathome.com/logo.png" style={{width: '10%'}} alt="logo" />
        <br/>Head-to-heads for this room are finished.<br/><br/>Thank you for coming in.
      </h1>
        :
      <span className="spectator__runners">
        <span>
          <h2>
            {runner1?.['name'] || 'RUNNER 1'}
          </h2>
          <h1>
            {runner1?.['current-time'] !== undefined &&
              ((runner1?.['current-time'] === 0 || runner1?.['state'] === 'waiting')
                ?
              runner1?.['state']
                :
              <span style={{ color: runner2?.['current-time'] > 0 ? (runner2?.['current-time'] > runner1?.['current-time'] ? 'limegreen' : 'red') : 'inherit' }}>
                {formatTimer(runner1?.['current-time'])}
              </span>)
            }
          </h1>
          <div className="spectator__wins">
            {runner1?.wins !== undefined && [...Array(roomInfo.neededToWin)].map((_, i) =>
              <img key={i} src={i + 1 > runner1?.wins ? '/images/blank-cube.png' : '/images/winning-cube.png'} alt="win-loss-cube" />
            )}
          </div>
        </span>

        <span>
          <h2>
            {runner2['name'] || 'RUNNER 2'}
          </h2>
          <h1>
            {runner2?.['current-time'] !== undefined &&
              ((runner2?.['current-time'] === 0 || runner2?.['state'] === 'waiting')
                ?
              runner2?.['state']
                :
              <span style={{ color: runner1?.['current-time'] > 0 ? (runner2?.['current-time'] < runner1?.['current-time'] ? 'limegreen' : 'red') : 'inherit' }}>
                {formatTimer(runner2?.['current-time'])}
              </span>)
              }
          </h1>
          <div className="spectator__wins">
            {runner2?.wins !== undefined && [...Array(roomInfo.neededToWin)].map((_, i) =>
              <img key={i} src={i + 1 > runner2?.wins ? '/images/blank-cube.png' : '/images/winning-cube.png'} alt="win-loss-cube" />
            )}
          </div>
        </span>

      </span>}
    </div>
  );
}