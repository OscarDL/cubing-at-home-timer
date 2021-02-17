import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { setInterval, clearInterval } from 'requestanimationframe-timer';

import firebase from 'firebase';
import { db } from '../../firebase';
import Spectator from './Spectator';

import '../../Styles/Timer.css';

function formatTimer(timer) {
  return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
}

function Timer({user}) {
  const { roomId } = useParams();
  const [timer, setTimer] = useState(0);
  const [runner, setRunner] = useState(0);
  const [ready, setReady] = useState(false);
  const [inSolve, setInSolve] = useState(false);
  const [timerState, setTimerState] = useState(null);
  const [runnerState, setRunnerState] = useState('');
  const [opponentTime, setOpponentTime] = useState(0);
  const [opponentName, setOpponentName] = useState('');
  const [opponentReady, setOpponentReady] = useState(0);

  const [roomName, setRoomName] = useState(null);
  const [roomExists, setRoomExists] = useState(false);


  /* ROOM INFO */

  useEffect(() => {
    db.collection('timer-rooms').doc(roomId).onSnapshot(s => {
      if(s.data() !== undefined && s.data() !== null) {
        setRoomExists(true);
        setRoomName(s.data().name);
        document.querySelector(`.rooms > a[href='/room/${roomId}']`).style.backgroundColor = 'rgba(255, 255, 255, 0.075)';
        document.querySelectorAll(`.rooms > a:not([href='/room/${roomId}'])`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)');
      } else {
        setRoomName('');
        setRoomExists(false); 
      }
    });
    return () => document.querySelectorAll(`.rooms > a`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)');
  }, [roomId, setRoomName, setRoomExists]);

  useEffect(() => {
    setRunner(0);
    if (roomExists) {
      user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner1').get('id').then(s => s.data().id === user?.me?.id && setRunner(1));
      user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner2').get('id').then(s => s.data().id === user?.me?.id && setRunner(2));
    }
  }, [user, roomId, roomExists, setRunner]);


  /* RUNNERS INFO */

  useEffect(() => {
    
    if (runner !== 0 && roomExists) {
      // Set user name & ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'ready': false, 'state': 'waiting', 'name': user?.me?.name || ''});
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).onSnapshot(s => {
        setReady(s.data()?.ready);
        setTimerState(s.data()?.['timer-state']);
      });
      
      // Set opponent name & ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+(runner === 1 ? '2' : '1')).onSnapshot(s => {
        setOpponentName(s.data()?.name);
        setOpponentReady(s.data()?.ready);
        setOpponentTime(s.data()?.['current-time']);
      });
    }
  }, [user, roomId, runner, roomExists, setOpponentName, setOpponentTime, setOpponentReady]);


  /* TIMER STATES */

  useEffect(() => {
    document.body.onkeyup = function(e) {
      (e.keyCode === 32 && timerState === 5) && setTimerState(-1);

    }
  }, [roomId, runner, timerState, setTimerState]);

  useEffect(() => {
    if (runner !== 0 && timerState !== null) {
      // -1: idle, 0: ready - waiting for scrambles, 1: scrambling, 2: ready - waiting for opponent, 3: inspection, 4: solving, 5: done
      if (timerState === -1) {

        setTimer(0);
        setRunnerState('Press space to ready up.');

        // FOR DEBUGGING ONLY, JUDGE SHOULD UPDATE
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'ready': true,
            'timer-state': 0,
            'state': 'ready'
          });*/

        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'ready': false,
          'timer-state': -1,
          'time-started': 0,
          'state': 'waiting'
        });

      } else if (timerState === 0) {

        setRunnerState(`Waiting for ${opponentName || 'opponent'}...`);
        document.body.onkeyup = (e) => e.keyCode === 27 && // 27 = escape
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'timer-state': -1});

        opponentReady && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'ready': false,
          'timer-state': 1,
          'state': 'scrambling'
        });

      } else if (timerState === 1) {

        setRunnerState('Scrambling...');

        // FOR DEBUGGING ONLY, JUDGE SHOULD UPDATE
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'ready': true,
            'timer-state': 2,
            'state': 'ready'
          });*/

      } else if (timerState === 2) {

        if(opponentReady) {
          setTimer(3000);
          setRunnerState('Starting in...');

          const interval = setInterval(() =>
            setTimer(time => {
              if (time <= 1000) {
                db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
                  'timer-state': 3,
                  'current-time': 0,
                  'state': 'inspecting'
                });
                clearInterval(interval);
              }
              return (time - 1000);
            }),
          1000);
        } else setRunnerState(`Waiting for ${opponentName || 'opponent'} to ready up...`);

      } else if (timerState === 3) {

        setRunnerState('Inspection ends in');

        if (opponentReady) {
          setTimer(15000); // do not restart inspection time if opponent finishes first (resetting ready state with useEffect dependency)
          const interval = setInterval(() =>
            setTimer(time => {
              if (time <= 1000) {
                db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
                  'ready': false,
                  'timer-state': 4,
                  'state': 'solving',
                  'timer-started': true,
                  'time-started': Date.now()
                });
                clearInterval(interval);
              }
              return (time - 1000);
            }),
          1000);
        }

      } else if (timerState === 4) {

        setInSolve(true);
        setRunnerState('Press any key to stop the timer.');
        document.body.onkeyup = () => db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'timer-state': 5});

        if (!inSolve) setTimer(0); // Do not restart solve time if opponent finishes first (resetting ready state with useEffect dependency)
        const interval = setInterval(() => setTimer(time => time + 10), 10);
        return () => clearInterval(interval);

      } else if (timerState === 5) {

        setInSolve(false);
        setRunnerState('Press space to clear the timer.');

        // FOR DEBUGGING ONLY, JUDGE SHOULD RESET
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'current-time': 0,
            'timer-state': -1,
            'timer-started': false
          });*/

      }
    }
  }, [roomId, runner, inSolve, setTimer, timerState, opponentName, opponentReady, setRunnerState]);

  useEffect(() => {
    if (timerState === 5 && runner !== 0) {
      timer > 0 && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'current-time': timer});

      opponentTime > 0
        &&
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
        'attempts': firebase.firestore.FieldValue.arrayUnion({
          'time': timer,
          'win': (timer < opponentTime) ? true : false
        })
      });
    }
  }, [timer, roomId, runner, timerState, opponentTime]);


  return (
    <>
      {roomName !== null &&
      (roomExists
        ?
      <>
        <h1>{roomName.toUpperCase()}</h1>
        {runner !== 0
          ?
        <div className="timer">
          <span className="timer__time">
            <h1 style={{color: (timerState === 5 && opponentTime > 0) ? (opponentTime > timer ? 'limegreen' : 'red') : 'inherit'}}>
              {timerState !== null && ((timerState === 4 || timerState === 5) ? formatTimer(timer) : timer / 1000)}
            </h1>
          </span>

          <h2 className="runnerState">
            {(timerState === 5 && opponentTime > 0) && <>{opponentName || 'Opponent'}'s time: 
              <span style={{color: opponentTime > timer ? 'red' : 'limegreen'}}> {formatTimer(opponentTime)}</span><br/><br/></>}
            {runnerState}
            {(timerState === 0 && !opponentReady) && <><br/>Press escape to unready.</>}
          </h2>
          
          {((timerState < 1 || timerState > 5) && timerState !== null)
            &&
          <span>
            <h2 style={{color: ready ? 'limegreen' : 'red'}}>
              YOU - {ready ? 'READY' : 'NOT READY'}
            </h2>
            <br/>
            {opponentName !== ''
              ? 
            <h2 style={{color: opponentReady ? 'limegreen' : 'red'}}>
              {`${opponentName} - ${opponentReady ? 'READY' : 'NOT READY'}`}
            </h2>
              :
            <h2 style={{color: 'orange'}}>Opponent has not joined yet</h2>}
          </span>}
        </div>
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