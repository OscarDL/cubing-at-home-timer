import { useParams } from 'react-router-dom';
import { TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
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
  const [runnerState, setRunnerState] = useState('');
  const [opponentReady, setOpponentReady] = useState(0);

  const [key, setKey] = useState(''); // Don't set to null --- localStorage default inexistant keys to null, leading to true comparison without any key
  const [roomName, setRoomName] = useState(null);
  const [roomExists, setRoomExists] = useState(false);

  useEffect(() => {
    // Set the key only if the room exists & user has the correct key
    db.collection('timer-rooms').doc(roomId).onSnapshot(s => {
      if(s.data() !== undefined) {
        setRoomExists(true);
        setKey(s.data().key);
        setRoomName(s.data().name);
      } else {
        setRoomName('');
        setRoomExists(false); 
      }
    
      if (roomExists) { // Selected room background color
        document.querySelector(`.rooms > a[href='/room/${roomId}']`).style.backgroundColor = '#4055aa';
        document.querySelectorAll(`.rooms > a:not([href='/room/${roomId}'])`).forEach(el => el.style.backgroundColor = '#324191');
      }
    });
    
    if (localStorage.getItem('key') !== null && localStorage.getItem('runner') !== null) {
      if (roomExists) {
        // Set user ready state
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'ready': false, 'state': 'waiting'});
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).onSnapshot(s => setReady(s.data().ready));
        
        // Set opponent ready state
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+(localStorage.getItem('runner') === '1' ? '2' : '1')).onSnapshot(s => setOpponentReady(s.data().ready));
      }
    } else {
      setKey('NO_KEY'); // Prevent spectator mode from triggering once for runners
    }
  }, [setKey, roomId, roomExists, setOpponentReady, setRoomExists]);

  useEffect(() => {
    if (timerState === -1 || timerState === 3) {
      document.body.onkeyup = function(e) {
        if (e.keyCode === 32 && (document.activeElement.tagName !== 'INPUT')) {
          setTimerState(state => state + 1);
        }
      }
    } else if (timerState === 0) {
      document.body.onkeyup = function(e) {
        if (e.keyCode === 27 && (document.activeElement.tagName !== 'INPUT')) {
          setTimerState(state => state - 1);
        }
      }
    } else if (timerState === 2) {
      document.body.onkeyup = function(e) {
        setTimerState(state => state + 1);
      }
    }
  }, [timerState, setTimerState]);

  useEffect(() => {
    
    // -1 = idle, 0 = ready, 1 = inspection, 2 = solving, 3 = done, 4 = reset
    if (timerState === -1) {

      setRunnerState('Press space to ready up.');
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'ready': false, 'state': 'waiting', 'current-time': 0});

    } else if (timerState === 0) {

      // Update & reset current-time in db here as well in case page is refreshed without clearing the timer
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({
        'current-time': 0,
        'state': 'ready',
        'ready': true
      });

      if(opponentReady) {
        setTimer(3000);
        setRunnerState('Starting in');

        const interval = setInterval(() =>
          setTimer(time => {
            if (time === 1000) {
              setTimerState(1);
              clearInterval(interval);
            }
            return (time - 1000);
          }),
        1000);
      } else setRunnerState('Waiting for opponent to ready up... Press escape to unready.');

    } else if (timerState === 1) {

      setRunnerState('Inspection ends in');

      if (opponentReady) {
        setTimer(15000); // if condition to not restart inspection time if opponent finishes first (resetting ready state with useEffect dependency)
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
      setRunnerState('Press any key to stop the timer.');

      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'state': 'solving'});

      if (!inSolve) setTimer(0); // if condition to not restart solve time if opponent finishes first (resetting ready state with useEffect dependency)
      const interval = setInterval(() => setTimer(time => time + 10), 10);
      return () => clearInterval(interval);

    } else if (timerState === 3) {

      setInSolve(false);
      setRunnerState('Press space to clear the timer.');

      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'ready': false});

    } else if (timerState === 4) {

      setTimer(0);
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+localStorage.getItem('runner')).update({'state': 'waiting', 'current-time': 0});

      setTimerState(-1);

    }

  }, [setRunnerState, timerState, opponentReady, setTimer, inSolve, roomId]);

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
      {roomName !== null && // To avoid displaying "This room does not exist" while an existing room is loading
      (roomExists
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

            <h2 className="runnerState">{runnerState}</h2>
            {(timerState < 1 || timerState > 3)
              &&
            <span>
              <h2 style={{color: ready ? 'lightgreen' : 'red'}}>
                YOU: {ready ? 'READY' : 'NOT READY'}
              </h2>
              <br/>
              <h2 style={{color: opponentReady ? 'lightgreen' : 'red'}}>
                OPPONENT: {opponentReady ? 'READY' : 'NOT READY'}
              </h2>
            </span>}
          </div>
        </>
          :
        <Spectator room={roomId}/>}
      </>
        :
      <div className="timer">
        <h1>This room does not exist.</h1>
      </div>)}
    </>
  );
}

export default Timer;