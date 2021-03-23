import React, { useEffect, useState } from 'react';

import { db } from '../../firebase';

function formatTimer(timer) {
  // return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
  if (!Number.isFinite(timer)) return null
  if (timer === 0) return ''
  if (timer === -1) return 'DNF'
  if (timer === -2) return 'DNS'
  return new Date(timer * 10)
    .toISOString()
    .substr(11, 11)
    .replace(/^[0:]*(?!\.)/g, '')
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

      <span className="spectator__runners">
        <span>
          <h2>
            {runner1?.['name'] || 'RUNNER 1'}
          </h2>
          <div className='history'>
            {(runner1?.attempts || []).map(a =>
              <h3 key={a.time} style={{ color: a.win ? 'limegreen' : 'red' }}>{formatTimer(a.time)}</h3>
            )}
          </div>
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
              <div className='spectator__win'>
                <img key={i} src={i + 1 > runner1?.wins ? '/images/blank-cube.png' : '/images/winning-cube.png'} alt="win-loss-cube" />
              </div>
            )}
          </div>
        </span>

        <span>
          <h2>
            {runner2['name'] || 'RUNNER 2'}
          </h2>
          <div className='history'>
            {(runner2?.attempts || []).map(a =>
              <h3 key={a.time} style={{ color: a.win ? 'limegreen' : 'red' }}>{formatTimer(a.time)}</h3>
            )}
          </div>
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
              <div className='spectator__win'>
                <img key={i} src={i + 1 > runner2?.wins ? '/images/blank-cube.png' : '/images/winning-cube.png'} alt="win-loss-cube" />
              </div>
            )}
          </div>
        </span>

      </span>
    </div>
  );
}