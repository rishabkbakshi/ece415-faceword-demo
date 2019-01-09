
angular.module('FaceWord').controller('LoginCtrl', ['$scope', '$http', '$state', LoginCtrl]);


function LoginCtrl($scope, $http, $state) {
    console.log("Came to Login Ctrl");
    var width = 720;    // We will scale the photo width to this
    var height = 0;
    var streaming = false;

    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    function clearPhoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
    }

    $scope.clearStorage = function () {
        let r = confirm("Are you sure you want to delete users?");
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
        stopStream();
        $state.go('welcome');
    }

    $scope.goToRegisterPage = function () {
        stopStream();
        $state.go('register');
    }

    function goToDashboard(userDetails){
        stopStream();
        $state.go('dashboard', {"userDetails": userDetails, "userId": userDetails.user_id});
    }

    $scope.captureLoginImage = function () {
        var context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            var data = canvas.toDataURL('image/png');
            photo.setAttribute('name', 'file');
            photo.setAttribute('src', data);

            canvas.toBlob(sendImageToServer, 'image/png');
        } else {
            clearPhoto();
        }
    }

    function identifyUser(userId) {
        var userList = JSON.parse(window.localStorage.getItem('user_list'));
        for (key in userList) {
            if (key == userId) {
                console.log(userList[key]);
                return userList[key];
            }
        }
    }

    function sendImageToServer(imageBlob) {
        console.log(imageBlob);
        let formdata = new FormData();
        formdata.append('file_name', "sample_" + (new Date()).getTime());
        formdata.append("image_sample", imageBlob);
        formdata.append('process', 'login');

        $.ajax({
            type: 'POST',
            url: '/recogniseImage',
            data: formdata,
            processData: false,
            contentType: false
        })
            .done(function (response) {
                let response_data = JSON.parse(response)
                console.log("LOGIN RESPONSE DATA: ",response_data);
                if(response_data["status"] == "no_user"){
                    let confidence = 'No User was detected! Please try again. Confidence: ' + response_data["confidence"]
                    console.log(confidence)
                    alert(confidence);
                }
                else if(response_data == "no_face_detected"){
                    alert('No Face Found. Please try again.')                    
                }
                else{
                    var user_id = response_data.userId;
                    console.log(user_id);
                    var userDetails = identifyUser(user_id);
                    userDetails["percentVal"] = response_data.percentVal
                    userDetails["decimalPercent"] = response_data.decimalPercent
                    userDetails["filename"] = response_data.filename

                    console.log(userDetails);
                    goToDashboard(userDetails);
                }
            })
            .fail(function (error) {
                console.log("An error occured: ", error)
            })

    }

    function pageInit() {
        video = document.getElementById('loginVideo');
        canvas = document.getElementById('loginCanvas');
        photo = document.getElementById('loginPhoto');

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

    pageInit();
}