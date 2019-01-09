const MAIN_URL = "http://localhost:3009/"



var globalStreamObj = null;
const socket = io.connect(MAIN_URL)

var faceWord = angular.module('FaceWord', [
    'ui.router',
    'angular-loading-bar'
])

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function stopStream() {
    console.log('Stopping Video Stream');
    if (globalStreamObj) {
        console.log("Have a valid stream:", globalStreamObj);
        var track = globalStreamObj.getTracks()[0];  // if only one media track
        // ...
        track.stop();
        globalStreamObj = null;
    }
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
}

faceWord.config(routeConfig);






function routeConfig($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/welcome');

    $stateProvider
        .state('welcome', {
            url: '/welcome',
            title: 'Welcome',
            templateUrl: 'views/welcome.html',
            controller: 'WelcomeCtrl'
        })
        .state('dashboard', {
            url: '/:userId/dashboard',
            params: { userDetails: null, userId: null },
            title: 'Dashboard',
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardCtrl'
        })
        .state('login', {
            url: '/login',
            title: 'Login',
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        })
        .state('register', {
            url: '/register',
            title: 'Register',
            templateUrl: 'views/register.html',
            controller: 'RegisterCtrl',
            // onExit: function () {
            //     //Todo: Code to turn off camera here.
            // }
        });

}




// Socket Events
socket.on('connect', () => {
    console.log(socket.id); // 'G5p5...'
    var data = "[SOCKET_CONNECTED]";

    socket.emit('hello_server', data)

    socket.on('hello_client', (data)=>{
        console.log(data);
    })

});

socket.on('disconnect', () => {
    socket.open(); // opens the socket for connection
});






