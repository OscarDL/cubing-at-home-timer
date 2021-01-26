import firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyCqcgCmf6UPXno6JXeYDOkbx_k8383jWy0",
  authDomain: "cubingathome-timer.firebaseapp.com",
  projectId: "cubingathome-timer",
  storageBucket: "cubingathome-timer.appspot.com",
  messagingSenderId: "145614542823",
  appId: "1:145614542823:web:37ffcf8229226e00ee0f42"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

export { db, auth, provider };