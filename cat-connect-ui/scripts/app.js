// Your web app's Firebase configuration
var firebaseConfig = {
apiKey: "AIzaSyASthpO-xDHFkqiPv4N6BdRGdBSdSmUGG0",
authDomain: "nca-cc-lite.firebaseapp.com",
projectId: "nca-cc-lite",
storageBucket: "nca-cc-lite.appspot.com",
messagingSenderId: "409087757760",
appId: "1:409087757760:web:dc4cb8610b740f1cae4c25"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

let storage = firebase.storage();

var app = new Vue({
    el: "#app",
    mathods: {

    }
});