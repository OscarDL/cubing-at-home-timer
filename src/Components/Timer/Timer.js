import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { setInterval, clearInterval } from 'requestanimationframe-timer';

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
  const [timerState, setTimerState] = useState(4);
  const [runnerState, setRunnerState] = useState('');
  const [opponentTime, setOpponentTime] = useState(0);
  const [opponentName, setOpponentName] = useState('');
  const [opponentReady, setOpponentReady] = useState(0);

  const [roomName, setRoomName] = useState(null);
  const [roomExists, setRoomExists] = useState(false);

  useEffect(() => {
    setRunner(0);
    user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner1').get('id').then(s => s.data().id === user?.me?.id && setRunner(1));
    user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner2').get('id').then(s => s.data().id === user?.me?.id && setRunner(2));
  }, [user, roomId, setRunner]);

  useEffect(() => {
    // Set name in db when user joins the room
    (runner !== 0) && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'name': user?.me?.name || ''});

    // Reset highlighted room background color when user leaves the room
    return () => document.querySelectorAll(`.rooms > a`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)')
  }, [user, roomId, runner]);

  useEffect(() => {
    db.collection('timer-rooms').doc(roomId).onSnapshot(s => {
      if(s.data() !== undefined && s.data() !== null) {
        setRoomExists(true);
        setRoomName(s.data().name);
      } else {
        setRoomName('');
        setRoomExists(false); 
      }
    
      if (roomExists) { // Selected room highlight color
        document.querySelector(`.rooms > a[href='/room/${roomId}']`).style.backgroundColor = 'rgba(255, 255, 255, 0.075)';
        document.querySelectorAll(`.rooms > a:not([href='/room/${roomId}'])`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)');
      }
    });
    
    if (runner !== 0 && roomExists) {
      // Set user ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'ready': false, 'state': 'waiting'});
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).onSnapshot(s => setReady(s.data()?.ready));
      
      // Set opponent name & ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+(runner === 1 ? '2' : '1')).onSnapshot(s => {
        setOpponentName(s.data()?.name);
        setOpponentReady(s.data()?.ready);
        setOpponentTime(s.data()?.['current-time']);
      });
    }
  }, [roomId, runner, roomExists, setOpponentName, setOpponentTime, setOpponentReady, setRoomExists]);

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
    if (runner !== 0) {
      // -1 = idle, 0 = ready, 1 = inspection, 2 = solving, 3 = done, 4 = reset
      if (timerState === -1) {

        setRunnerState('Press space to ready up.'); // handle update({'ready': false}) here in case presses escape to unready
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'ready': false, 'state': 'waiting'});

      } else if (timerState === 0) {

        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'state': 'ready',
          'ready': true
        });

        if(opponentReady) {
          setTimer(3000);
          setRunnerState('Starting in');

          const interval = setInterval(() =>
            setTimer(time => {
              if (time <= 1000) {
                setTimerState(1);
                clearInterval(interval);
              }
              return (time - 1000);
            }),
          1000);
        } else opponentName !== '' ? setRunnerState(`Waiting for ${opponentName} to ready up...`) : setRunnerState('Waiting for opponent to join...');

      } else if (timerState === 1) {

        setRunnerState('Inspection ends in');

        if (opponentReady) {
          setTimer(15000); // do not restart inspection time if opponent finishes first (resetting ready state with useEffect dependency)
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'state': 'inspecting'});

          const interval = setInterval(() =>
            setTimer(time => {
              if (time <= 1000) {
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
        
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'ready': false,
          'state': 'solving',
          'timer-started': true,
          'time-started': Date.now()
        });

        if (!inSolve) setTimer(0); // do not restart solve time if opponent finishes first (resetting ready state with useEffect dependency)
        const interval = setInterval(() => setTimer(time => time + 10), 10);
        return () => clearInterval(interval);

      } else if (timerState === 3) {

        setInSolve(false);
        setRunnerState('Press space to clear the timer.');

      } else if (timerState === 4) { // timerState initialized to 4

        setTimer(0);
        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'state': 'waiting', 'current-time': 0, 'time-started': 0});

        setTimerState(-1);

      }
    }
  }, [roomId, runner, inSolve, setTimer, timerState, opponentName, opponentReady, setRunnerState]);

  useEffect(() => {
    (timerState === 3 && runner !== 0)
      &&
    db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
      'timer-started': false,
      'current-time': timer
    });

    /*(timerState === 4) // Not sure why I added that in the first place, keeping commented just in case
      &&
    db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({'current-time': 0});*/
  }, [timer, roomId, runner, timerState]);

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
            <h1 style={{color: (timerState === 3 && opponentTime > 0) ? (opponentTime > timer ? 'limegreen' : 'red') : 'inherit'}}>
              {(timerState === 2 || timerState === 3) ? formatTimer(timer) : timer / 1000}
            </h1>
          </span>

          <h2 className="runnerState">
            {(timerState === 3 && opponentTime > 0) && <>{opponentName || 'Opponent'}'s time: 
              <span style={{color: opponentTime > timer ? 'red' : 'limegreen'}}> {formatTimer(opponentTime)}</span><br/><br/></>}
            {runnerState}
            {(timerState === 0 && !opponentReady) && <><br/>Press escape to unready.</>}
          </h2>
          
          {(timerState < 1 || timerState > 3)
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