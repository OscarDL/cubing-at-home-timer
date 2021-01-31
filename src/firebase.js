import firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyDKn85Ghdn1e4FVci8m_rCZnYoJlAB9FwE",
  authDomain: "cubing-at-home-testing.firebaseapp.com",
  databaseURL: "https://cubing-at-home-testing.firebaseio.com",
  projectId: "cubing-at-home-testing",
  storageBucket: "cubing-at-home-testing.appspot.com",
  messagingSenderId: "492826745442",
  appId: "1:492826745442:web:99b283ff12494d5debcf3b",
  measurementId: "G-V3MKMCTVG8"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { db, auth, provider };
export default firebaseConfig;