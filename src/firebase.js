import firebase from 'firebase';

const firebaseConfig = process.env.NODE_ENV === 'production'
? {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: 'cubing-at-home.firebaseapp.com',
  databaseURL: 'https://cubing-at-home.firebaseio.com',
  projectId: 'cubing-at-home',
  storageBucket: 'cubing-at-home.appspot.com',
  messagingSenderId: '1053566413406',
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
}
: {
  apiKey: 'AIzaSyDKn85Ghdn1e4FVci8m_rCZnYoJlAB9FwE',
  authDomain: 'cubing-at-home-testing.firebaseapp.com',
  databaseURL: 'https://cubing-at-home-testing.firebaseio.com',
  projectId: 'cubing-at-home-testing',
  storageBucket: 'cubing-at-home-testing.appspot.com',
  messagingSenderId: '492826745442',
  appId: '1:492826745442:web:99b283ff12494d5debcf3b',
  measurementId: 'G-V3MKMCTVG8',
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { db, auth, provider };
export default firebaseConfig;