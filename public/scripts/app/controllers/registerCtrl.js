
angular.module('FaceWord').controller('RegisterCtrl', ['$scope', '$http', '$state', '$timeout', RegisterCtrl]);

function RegisterCtrl($scope, $http, $state, $timeout) {
    $scope.captureActive = false;
    $scope.trainingActive = false;
    $scope.trainingStateText = "Re-train existing Model";
    $scope.newUserName = "";
    $scope.userDetails = {
        "user_name": "",
        "user_id": "",
        "image_dir": ""
    }

    var captureActive = false;
    $scope.captureCount = 0;
    console.log("Came to Register Ctrl");
    var width = 720;    // We will scale the photo width to this
    var height = 0;     // This will be computed based on the input stream

    var streaming = false;

    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    $scope.clearStorage = function () {
        var r = confirm("Are you sure you want to delete users?");
        if (r == true) {
            window.localStorage.clear();
        } else {
            txt = "You pressed Cancel!";
            console.log(txt);
        }
    }

    $scope.clearTrainingData = function(){
        let r = confirm("Are you sure you want to delete all training data?");
        if (r == true) {
            socket.emit("clear_image_database", "Clear Image Database");
        } else {
            txt = "You pressed Cancel!";
            console.log(txt);
        }
    }

    $scope.returnToHomePage = function () {
        $scope.resetTraining();
        stopStream();
        $state.go('welcome');
    }
    
    $scope.goToLoginPage = function () {
        $scope.resetTraining();
        stopStream();
        $state.go('login');
    }

    function clearPhoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
    }

    function captureImage() {
        var context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            var data = canvas.toDataURL('image/png');
            photo.setAttribute('name', 'file');
            photo.setAttribute('src', data);
            $scope.captureCount += 1;

            canvas.toBlob(sendImageToServer, 'image/png');

        } else {
            clearPhoto();
        }
    }

    $scope.resetTraining = function () {
        $timeout(function () { $scope.trainingStateText = "Re-train existing Model"; }, 50);
        $scope.captureCount = 0;
        $scope.userDetails = {
            "user_name": "",
            "user_id": "",
            "image_dir": ""
        };
        $scope.newUserName = "";
        clearPhoto();
    };

    function stopCaptureCallback() {
        console.log("Stopped Capturing with capture count:", $scope.captureCount);
        $scope.captureCount = 0;
    }

    function createNewUserData() {
        var userId = create_UUID();
        $scope.userDetails = {
            "user_name": $scope.newUserName,
            "user_id": userId,
            "imageDir": userId + "/"
        }
    }

    $scope.startCapture = function () {
        if ($scope.newUserName) { //Check if there is a username entered or not
            $timeout(function () { $scope.captureActive = true; }, 50);
            captureActive = true;
            createNewUserData();
            captureImage();
        }
        else {
            alert("Please enter the name of the person you want to train!");
        }
    }

    function addNewUsertoStorage(newUser) {
        if (window.localStorage.getItem("user_list")) {
            var currentList = JSON.parse(window.localStorage.getItem('user_list'));
            currentList[newUser.user_id] = newUser;
            window.localStorage.setItem('user_list', JSON.stringify(currentList));
        }
        else {
            var newList = {}
            newList[newUser.user_id] = newUser;
            window.localStorage.setItem('user_list', JSON.stringify(newList));
        }
    }

    $scope.stopCapture = function () {
        $scope.captureActive = false;
        captureActive = false;
        addNewUsertoStorage($scope.userDetails);
        $scope.startTraining();
        // $timeout(function(){$scope.trainingStateText = "Train New Model";},50);
    };

    $scope.startTraining = function () {
        $timeout(function () { $scope.trainingStateText = "Training in Progress..."; }, 50);
        console.log("Starting Training...")
        socket.emit('start_training', "Train")
    };

    socket.on('training_complete', (data) => {
        alert("Training Complete")
        $timeout(function () { $scope.trainingStateText = "Training Complete!"; }, 50);
    })

    socket.on('error_in_training', (data) => {
        alert("Error while training. Please reset and train again.")
        $timeout(function () { $scope.trainingStateText = "Re-train existing Model"; }, 50);
    })

    function pageInit() {
        $timeout(function () { $scope.trainingStateText = "Re-train existing Model"; }, 50);
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        photo = document.getElementById('registerPhoto');
        startbutton = document.getElementById('regCapturePhoto');

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                globalStreamObj = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(function (err) {
                console.log("An error occurred! " + err);
            });

        video.addEventListener('canplay', function (ev) {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);



        clearPhoto();

    }

    function sendImageToServer(imageBlob) {
        console.log(imageBlob);
        let formdata = new FormData();
        formdata.append('file_name', $scope.userDetails.user_name + '_' + (new Date()).getTime() + '.png')
        formdata.append('process', 'register');
        formdata.append('user_name', $scope.userDetails.user_name);
        formdata.append('user_id', $scope.userDetails.user_id)
        formdata.append("image_sample", imageBlob);

        $.ajax({
            type: 'POST',
            url: '/saveImage',
            data: formdata,
            processData: false,
            contentType: false
        }).done(function (response) {
            console.log(response);
            if ($scope.captureActive == true && captureActive == true) {
                console.log("Capturing again with capture Count:", $scope.captureCount);
                $timeout(captureImage, 500)
            }
            else {
                stopCaptureCallback()
            }
        })

    }

    pageInit();
    // controller logic  

}