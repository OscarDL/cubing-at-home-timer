import firebase from 'firebase';

const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: 'cubing-at-home.firebaseapp.com',
  databaseURL: 'https://cubing-at-home.firebaseio.com',
  projectId: 'cubing-at-home',
  storageBucket: 'cubing-at-home.appspot.com',
  messagingSenderId: '1053566413406',
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { db, auth, provider };
export default firebaseConfig;