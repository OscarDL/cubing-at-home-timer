import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { setInterval, clearInterval } from 'requestanimationframe-timer';

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
  const [roomExists, setRoomExists] = useState(true);

  useEffect(() => {
    if(localStorage.getItem('key') !== null && localStorage.getItem('runner') !== null) {
      // Set the key only if the room exists
      db.collection('rooms').doc(roomId).onSnapshot(snapshot => snapshot.data() !== undefined ? setKey(snapshot.data().key) : setRoomExists(false));

      // Set user ready state
      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).onSnapshot(s => setReady(s.data().ready));
      // Set enemy ready state
      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+(localStorage.getItem('runner') === '1' ? '2' : '1')).onSnapshot(s => setEnemyReady(s.data().ready));
    }
  }, [key, setKey, roomId, setEnemyReady, setRoomExists]);

  useEffect(() => {
    
    // 0 = idle, 1 = ready, 2 = inspection, 3 = solving, 4 = reset
    if (timerState === 0) {

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'ready': true});

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
        
        return () => clearInterval(interval);
      }

    } else if (timerState === 1) {

      setBtnState('Start timer');

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'timer-started': true});

      if (enemyReady) setTimer(15000); // if condition to not restart inspection time if enemy finishes first (resetting ready state with useEffect dependency)

      // NEED TO DO +2 & DNF

      const interval = setInterval(() => setTimer(time => time - 10), 10);
      // (1*) Have to update more often than every 1000ms, otherwise the countdown lags behind if enemy starts and finishes the solve before runner started. IDEAS?
      return () => clearInterval(interval);

    } else if (timerState === 2) {

      setInSolve(true);
      setBtnState('Stop timer');

      if (!inSolve) setTimer(0); // if condition to not restart solve time if enemy finishes first (resetting ready state with useEffect dependency)
      const interval = setInterval(() => setTimer(time => time + 10), 10);
      return () => clearInterval(interval);

    } else if (timerState === 3) {

      setInSolve(false);
      setBtnState('Reset timer');

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'timer-started': false, 'ready': false});

    } else if (timerState === 4) {

      setBtnState('Ready up');

      setTimer(0);
      setTimerState(-1);

    }

  }, [timerState, enemyReady, setTimer, inSolve, roomId]);

  return (
    <div className="timer">
      <h1>ROOM ID: {roomId}</h1>

      <br/><br/>
      
      {roomExists
        ?
      <>
        <span>
          <h1 style={{color: 'white'}}>
            {(timerState === 2 || timerState === 3) ? formatTimer(timer) : (timerState === 1 ? Math.ceil(timer / 1000) : timer / 1000)}
            {/* Math.ceil() is used to round to the upper int for the countdown, since it has to be refreshed every 10ms and not 1000ms */}
          </h1>
        </span>

        <br/>
        {(localStorage.getItem('key') === key && (localStorage.getItem('runner') === '1' || localStorage.getItem('runner') === '2'))
          ?
        <>
          <button className="timer__button" onClick={() => timerState !== 0 && setTimerState(timer => timer + 1)}>{btnState}</button>
          <br/><br/>
          <h2 style={{color: ready ? 'lightgreen' : 'red'}}>
            YOU: {ready ? 'READY' : 'NOT READY'}
          </h2>
          <br/>
          <h2 style={{color: enemyReady ? 'lightgreen' : 'red'}}>
            ENEMY: {enemyReady ? 'READY' : 'NOT READY'}
          </h2>
        </>
          :
        <h1>SPECTATOR MODE</h1>}
      </>
        :
      <h1>
        This room does not exist.
      </h1>}
    </div>
  );
}

export default Timer;












/*import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { setInterval, clearInterval } from 'requestanimationframe-timer';

import { db } from '../../firebase';

import '../../Styles/Timer.css';

function formatTimer(timer) {
  return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
}

function Timer() {
  const { roomId } = useParams();
  const [name1, setName1] = useState(null);
  const [name2, setName2] = useState(null);
  const [ready1, setReady1] = useState(false);
  const [ready2, setReady2] = useState(false);
  const [isSpectator, setIsSpectator] = useState(true);

  const [timer, setTimer] = useState(0);
  const [ready, setReady] = useState(false);
  const [enemyReady, setEnemyReady] = useState(0);

  const [inSolve, setInSolve] = useState(false);
  const [timerState, setTimerState] = useState(-1);
  const [btnState, setBtnState] = useState('Ready up');

  const [key, setKey] = useState(''); // Don't set to null --- localStorage defaults inexistant keys to null, leading to true comparison without any key
  const [roomExists, setRoomExists] = useState(true);

  useEffect(() => {
    if(localStorage.getItem('key') !== null && localStorage.getItem('runner') !== null) {
      // Set the key only if the room exists
      db.collection('rooms').doc(roomId).onSnapshot(snapshot => snapshot.data() !== undefined ? setKey(snapshot.data().key) : setRoomExists(false));

      if (roomExists) {
        // Set runner name
        localStorage.setItem('name', window.prompt('Please type in your name'));
        db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'name': localStorage.getItem('name')});
        // Set user ready state
        db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).onSnapshot(s => setReady(s.data().ready));
        // Set enemy ready state
        db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+(localStorage.getItem('runner') === '1' ? '2' : '1')).onSnapshot(s => setEnemyReady(s.data().ready));
      }
    }
  }, [setKey, roomId, roomExists, setEnemyReady, setRoomExists]);

  useEffect(() => {
    if (localStorage.getItem('key') === key && (localStorage.getItem('runner') === '1' || '2')) {
      setIsSpectator(false);
    } else {
      db.collection('rooms').doc(roomId).collection('competitors').doc('runner1').onSnapshot(s => {setName1(s.data().name); setReady1(s.data().ready)});
      db.collection('rooms').doc(roomId).collection('competitors').doc('runner2').onSnapshot(s => {setName2(s.data().name); setReady2(s.data().ready)});
    }
  }, [key, roomId, setName1, setName2, setReady1, setReady2, setIsSpectator]);

  useEffect(() => {
    
    // 0 = idle, 1 = ready, 2 = inspection, 3 = solving, 4 = reset
    if (timerState === 0) {

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'ready': true});

      if(enemyReady) {
        setTimer(3000);
        const interval = setInterval(() => setTimer(time => time - 1000), 1000);
        const timeout = setTimeout(() => {clearInterval(interval); setTimerState(state => state + 1)}, 3000);
        return () => clearTimeout(timeout);
      }

    } else if (timerState === 1) {

      setBtnState('Start timer');

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'timer-started': true});

      if (enemyReady) setTimer(15000); // if condition to not restart inspection time if enemy finishes first (resetting ready state with useEffect dependency)
      const interval = setInterval(() => setTimer(time => time - 1000), 1000);
      return () => clearInterval(interval);

    } else if (timerState === 2) {

      setInSolve(true);
      setBtnState('Stop timer');

      if (!inSolve) setTimer(0); // if condition to not restart solve time if enemy finishes first (resetting ready state with useEffect dependency)
      const interval = setInterval(() => setTimer(time => time + 10), 10);
      return () => clearInterval(interval);

    } else if (timerState === 3) {

      setInSolve(false);
      setBtnState('Reset timer');

      db.collection('rooms').doc(roomId).collection('competitors').doc('runner'+localStorage.getItem('runner')).update({'timer-started': false, 'ready': false});

    } else if (timerState === 4) {

      setBtnState('Ready up');

      setTimer(0);
      setTimerState(-1);

    }

  }, [timerState, enemyReady, setTimer, inSolve, roomId]);

  return (
    <div className="timer">
      <h1>ROOM ID: {roomId}</h1>

      <br/><br/>
      
      {roomExists
        ?
      <>
        <span>
          <h1 style={{color: 'white'}}>
            {timerState === 2 ? formatTimer(timer) : timer / 1000}
          </h1>
        </span>

        <br/>
        {!isSpectator
          ?
        <>
          {// if timerState === 0 [ready / countdown], button should not do anything
          }
          <button className="timer__button" onClick={() => timerState !== 0 && setTimerState(timer === 0 ? 0 : timerState + 1)}>{btnState}</button>
          <br/><br/>
          <h2 style={{color: ready ? 'lightgreen' : 'red'}}>
            YOU: {ready ? 'READY' : 'NOT READY'}
          </h2>
          <br/>
          <h2 style={{color: enemyReady ? 'lightgreen' : 'red'}}>
            ENEMY: {enemyReady ? 'READY' : 'NOT READY'}
          </h2>
        </>
          :
        <>
          <h1>SPECTATOR MODE</h1>
          <br/>
          <span style={{display: 'flex', justifyContent: 'space-between', textAlign: 'center'}}>
            <span style={{display: 'flex', flexDirection: 'column'}}>
              <h3>Runner 1: {name1}</h3>
              <h3 style={{color: ready1 ? 'lightgreen' : 'red'}}>{ready1}</h3>
            </span>
            <span style={{display: 'flex', flexDirection: 'column'}}>
              <h3>Runner 2: {name2}</h3>
              <h3 style={{color: ready2 ? 'lightgreen' : 'red'}}>{ready2}</h3>
            </span>
          </span>
        </>}
      </>
        :
      <h1>
        This room does not exist.
      </h1>}
    </div>
  );
}

export default Timer;*/