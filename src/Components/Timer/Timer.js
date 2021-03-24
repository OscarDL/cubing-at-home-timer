//import firebase from 'firebase';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { db } from '../../firebase';
import Spectator from './Spectator';
//import AttemptField from '../AttemptField/AttemptField';

import '../../Styles/Timer.css';

function formatTimer(timer) {
  return ((timer.toString()).substring(0, timer.toString().length - 3) || '0') + '.' + (timer < 100 && timer > 1 ? '0' : '') + ((timer.toString()).substring(timer.toString().length - 3, timer.toString().length - 1) || '00');
}

export default function Timer({user}) {
  const { roomId } = useParams();
  const [timer, setTimer] = useState(0);
  const [runner, setRunner] = useState(0);
  const [ready, setReady] = useState(false);
  //const [finalTime, setFinalTime] = useState(0);
  const [scramble, setScramble] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [timerState, setTimerState] = useState(null);
  const [runnerState, setRunnerState] = useState('');
  const [opponentTime, setOpponentTime] = useState(0);
  const [opponentName, setOpponentName] = useState('');
  const [opponentReady, setOpponentReady] = useState(0);

  const [roomName, setRoomName] = useState(null);
  const [roomExists, setRoomExists] = useState(false);
  const [roomCompleted, setRoomCompleted] = useState(false);


  /* ROOM INFO */

  useEffect(() => {
    setRunner(0);
    db.collection('timer-rooms').doc(roomId).onSnapshot(s => {
      if(s.data() !== undefined && s.data() !== null) {

        setRoomExists(true);
        setRoomName(s.data().name);
        setScramble(s.data().currScramble);
        setRoomCompleted(s.data().completed);

        document.querySelectorAll(`.rooms > a[href='/room/${roomId}']`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0.075)');
        document.querySelectorAll(`.rooms > a:not([href='/room/${roomId}'])`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)');

      } else setRoomName('');
    });
    return () => document.querySelectorAll(`.rooms > a`).forEach(el => el.style.backgroundColor = 'rgba(255, 255, 255, 0)');
  }, [roomId, roomExists, setScramble, setRoomName, setRoomExists]);

  useEffect(() => {
    if (roomExists) {
      user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner1').get('id').then(s => s.data().id === user?.me?.id && setRunner(1));
      user && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner2').get('id').then(s => s.data().id === user?.me?.id && setRunner(2));
      //window.location.href.includes('id=1') && setRunner(1);
      //window.location.href.includes('id=2') && setRunner(2);
    }
  }, [user, roomId, roomExists, setRunner]);


  /* RUNNERS INFO */

  useEffect(() => {
    
    if (runner !== 0 && roomExists) {
      // Set user name & ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).onSnapshot(s => {
        setReady(s.data()?.ready);
        setTimerState(s.data()?.['timer-state']);
        setCurrentTime(s.data()?.['current-time']);
      });
      
      // Set opponent name & ready state
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+(runner === 1 ? '2' : '1')).onSnapshot(s => {
        setOpponentName(s.data()?.name);
        setOpponentReady(s.data()?.ready);
        setOpponentTime(s.data()?.['current-time']);
      });
    }
  }, [user, roomId, runner, roomExists, setCurrentTime, setOpponentName, setOpponentTime, setOpponentReady]);


  /* TIMER STATES */

  useEffect(() => {
    if (runner !== 0 && timerState !== null) {
      // -1: idle, 0: ready - waiting for scrambles, 1: scrambling, 2: ready - waiting for opponent, 3: inspection, 4: solving, 5: done
      document.body.onkeyup = () => null;
      document.body.ontouchend = () => null;

      if (timerState === -1) {

        setTimer(0);
        setRunnerState('Waiting for your judge to ready up.');

        // FOR DEBUGGING ONLY, JUDGE SHOULD RESET - COMMENT FOR PRODUCTION
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'ready': true,
            'timer-state': 0,
            'state': 'ready'
          });*/

        db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'ready': false,
          'time-started': 0,
          'state': 'waiting',
          'timer-started': false
        });

      } else if (timerState === 0) {

        setRunnerState(`Waiting for ${opponentName || 'opponent'}...`);

        opponentReady && db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
          'timer-state': 1,
          'current-time': 0,
          'state': 'scrambling'
        });

      } else if (timerState === 1) {

        setRunnerState('Scrambling...');

        // FOR DEBUGGING ONLY, JUDGE SHOULD RESET - COMMENT FOR PRODUCTION
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'ready': true,
            'timer-state': 2,
            'state': 'ready'
          });*/

      } else if (timerState === 2) {

        setTimer(3000);
        setRunnerState('Inspection starts in...');

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

        return () => clearInterval(interval);

      } else if (timerState === 3) {

        setTimer(15000);
        setRunnerState('Press space to start solving.');

        document.body.onkeyup = (e) => e.keyCode === 32 && setTimer(10);

        const interval = setInterval(() =>
          setTimer(time => {
            if (time <= 10) {
              db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
                'timer-state': 5, //4,
                'state': 'solving',
                'timer-started': true,
                'time-started': Date.now()
              });
              clearInterval(interval);
            }
            return (time - 10);
          }),
        10);

        return () => clearInterval(interval);

      } else if (timerState === 4) {

        setRunnerState(null);

      } else if (timerState === 5) {

        setRunnerState('Please show your timer/display to the Judge once solved.');

        // FOR DEBUGGING ONLY, JUDGE SHOULD RESET - COMMENT FOR PRODUCTION
        /*document.body.onkeyup = (e) => e.keyCode === 32 && // 32 = space
          db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
            'current-time': 0,
            'timer-state': -1,
            'timer-started': false
          });*/
      }
    }
  }, [roomId, runner, setTimer, timerState, setCurrentTime, opponentName, opponentReady, setOpponentTime, setRunnerState]);

  /*useEffect(() => {
    if (timerState === 5 && runner !== 0 && finalTime > 0 && opponentTime > 0) {
      db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
        'attempts': firebase.firestore.FieldValue.arrayUnion({
          'time': finalTime,
          'win': (finalTime < opponentTime) ? true : false
        })
      });
    }
  }, [timer, roomId, runner, finalTime, timerState, opponentTime]);


  /*const sendResult = () => {
    finalTime > 0
      ?
    db.collection('timer-rooms').doc(roomId).collection('runners').doc('runner'+runner).update({
      'timer-state': 5,
      'state': 'solved',
      'current-time': finalTime
    })
      :
    window.alert('Please enter a real time.');
  }*/


  return (
    roomName !== null &&
    (roomExists
      ?
    <>
      <h1>{roomName?.toUpperCase() || ''}</h1>
      {runner !== 0
        ?
      <div className="timer">
        <span className="timer__time">
          <h1 style={{color: (timerState === 5 && opponentTime > 0) ? (opponentTime > currentTime ? 'limegreen' : 'red') : 'inherit'}} className={(timerState === 1 || timerState === 4) ? 'scramble' : ''}>
            {(timerState !== 1 && timerState !== 4 && timerState !== 5) && Math.ceil(timer/1000)}
            {timerState === 1 && scramble}
            {/*timerState === 4 && <span className="timer__finalTime">
<<<<<<< HEAD
              {<AttemptField helperText='Final Time' initialValue='' onValue={val => setFinalTime(val*10)}/><button onClick={sendResult}>Send result</button>}
=======
              <AttemptField helperText='Final Time' initialValue='' onValue={val => setFinalTime(val*10)}/><button onClick={sendResult}>Send result</button>
>>>>>>> 38480efc9eb02d2a7697510cf51b113b96733703
            </span>*/}
            {timerState === 5 && formatTimer(currentTime)}
          </h1>
        </span>

        <h2 className="runnerState">
          {(timerState === 5 && opponentTime > 0) && <>{opponentName || 'Opponent'}'s time: 
            <span style={{color: opponentTime > currentTime ? 'red' : 'limegreen'}}> {formatTimer(opponentTime)}</span><br/><br/></>}
          {runnerState || ''}
        </h2>
        
        {timerState < 1 && <span>
          <h2 style={{color: ready ? 'limegreen' : 'red'}}>YOU - {ready ? 'READY' : 'NOT READY'}</h2><br/>
          <h2 style={{color: opponentReady ? 'limegreen' : 'red'}}>{`${opponentName || 'Opponent'} - ${opponentReady ? 'READY' : 'NOT READY'}`}</h2>
        </span>}
      </div>
        :
      <Spectator room={roomId} complete={roomCompleted}/>}
    </>
      :
    <div className="timer">
      <h1>This room does not exist.</h1>
    </div>)
  );
}
