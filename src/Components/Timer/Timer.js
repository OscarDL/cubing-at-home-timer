import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Button, TextField} from '@material-ui/core';
import { setInterval, clearInterval } from 'requestanimationframe-timer';

import Spectator from './Spectator';
import { db } from '../../firebase';

import '../../Styles/Timer.css';

function formatTimer(timer) {
  return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
}

function Timer() {
  const { roomId } = useParams();
  const [timer, setTimer] = useState(0);
  const [ready, setReady] = useState(false);
  const [inSolve, setInSolve] = useState(false);
  const [timerState, setTimerState] = useState(-1);
  const [btnState, setBtnState] = useState('Ready up');

  const [enemyReady, setEnemyReady] = useState(0);

  const [key, setKey] = useState(''); // Don't set to null --- localStorage default inexistant keys to null, leading to true comparison without any key
  const [roomName, setRoomName] = useState('');
  const [roomExists, setRoomExists] = useState(false);

  useEffect(() => {
    // Set the key only if the room exists & user has the correct key
    db.collection('timer-rooms').doc(roomId).onSnapshot(s => {
      if(s.data() !== undefined) {
        setKey(s.data().key);
        setRoomExists(true);
      } else {
        setRoomExists(false); 
      }
    
      if (roomExists) { // Selected room background color
        document.querySelector(`.rooms > a[href='/room/${roomId}']`).style.backgroundColor = '#4055aa';
        document.querySelectorAll(`.rooms > a:not([href='/room/${roomId}'])`).forEach(el => el.style.backgroundColor = '#324191');
      }
    });
    roomExists && db.collection('timer-rooms').doc(roomId).onSnapshot(s => setRoomName(s.data().name));
    
    if (localStorage.getItem('key') !== null && localStorage.getItem('runner') !== null) {
      if (roomExists) {
        // Set user ready state
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'ready': false, 'state': 'waiting'});
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).onSnapshot(s => setReady(s.data().ready));
        
        // Set enemy ready state
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+(localStorage.getItem('runner') === '1' ? '2' : '1')).onSnapshot(s => setEnemyReady(s.data().ready));
      }
    } else {
      setKey('NO_KEY'); // Prevent spectator mode from triggering once for runners
    }
  }, [setKey, roomId, roomExists, setEnemyReady, setRoomExists]);

  useEffect(() => {
    
    // 0 = idle, 1 = ready, 2 = inspection, 3 = solving, 4 = reset
    if (timerState === 0) {

      // Update & reset current-time in db here as well in case page is refreshed without clearing the timer
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({
        'current-time': 0,
        'state': 'ready',
        'ready': true
      });

      if(enemyReady) {
        setTimer(3000);

        const interval = setInterval(() =>
          setTimer(time => {
            if (time === 1000) {
              setTimerState(1);
              clearInterval(interval);
            }
            return (time - 1000);
          }),
        1000);
      }

    } else if (timerState === 1) {

      setBtnState('Start timer');

      if (enemyReady) {
        setTimer(15000); // if condition to not restart inspection time if enemy finishes first (resetting ready state with useEffect dependency)
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'state': 'inspecting'});

        const interval = setInterval(() =>
          setTimer(time => {
            if (time === 1000) {
              setTimerState(2);
              clearInterval(interval);
            }
            return (time - 1000);
          }),
        1000);
      }

    } else if (timerState === 2) {

      setInSolve(true);
      setBtnState('Stop timer');

      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'state': 'solving'});

      if (!inSolve) setTimer(0); // if condition to not restart solve time if enemy finishes first (resetting ready state with useEffect dependency)
      const interval = setInterval(() => setTimer(time => time + 10), 10);
      return () => clearInterval(interval);

    } else if (timerState === 3) {

      setInSolve(false);
      setBtnState('Reset timer');

      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'ready': false});

    } else if (timerState === 4) {

      setTimer(0);
      setTimerState(-1);
      setBtnState('Ready up');
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'state': 'waiting'});

    }

  }, [timerState, enemyReady, setTimer, inSolve, roomId]);

  useEffect(() => {
    (timerState === 3)
      &&
    db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({
      'timer-started': false,
      'current-time': timer,
      'ready': false
    });

    (timerState === 4)
      &&
    db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'current-time': 0});
  }, [timer, roomId, timerState]);

  return (
    <>
      {roomExists
        ?
      <>
        <h1>{roomName.toUpperCase()}</h1>
        {(key !== 'NO_KEY' && localStorage.getItem('key') === key && (localStorage.getItem('runner') === '1' || localStorage.getItem('runner') === '2'))
          ?
        <>
          <div className="runner__name">
            <TextField
              label={'Your name'}
              defaultValue={localStorage.getItem('name')?.length > 0 ? localStorage.getItem('name') : ''}
              helperText='Help live viewers know who you are.'
              onBlur={e => {
                localStorage.setItem('name', e.target.value);
                db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'name': e.target.value});
              }}
            />
          </div>

          <div className="timer">
            <span className="timer__time">
              <h1>
                {(timerState === 2 || timerState === 3) ? formatTimer(timer) : timer / 1000}
              </h1>
            </span>

            <Button className="timer__button" onClick={() => (timerState !== 0 && timerState !== 1) && setTimerState(timer => timer + 1)}>
              {btnState}
            </Button>
            <span>
              <h2 style={{color: ready ? 'lightgreen' : 'red'}}>
                YOU: {ready ? 'READY' : 'NOT READY'}
              </h2>
              <br/>
              <h2 style={{color: enemyReady ? 'lightgreen' : 'red'}}>
                ENEMY: {enemyReady ? 'READY' : 'NOT READY'}
              </h2>
            </span>
          </div>
        </>
          :
        <Spectator room={roomId}/>}
      </>
        :
      <div className="timer">
        This room does not exist.
      </div>}
    </>
  );
}

export default Timer;