
angular.module('FaceWord').controller('DashboardCtrl', ['$scope', '$http', '$state', '$stateParams', '$timeout', DashboardCtrl]);

function DashboardCtrl($scope, $http, $state, $stateParams, $timeout) {
    console.log("Came into Dashboard with StateParams", $state, $stateParams, $state.params);
    $scope.userName = '';
    $scope.identifiedUser = {
        "user_name": "",
        "percentVal": null,
        "user_id": "",
        "decimalPercent": null,
        "filename": ""
    }

    $scope.returnToHomePage = function () {
        $state.go('welcome');
    }

    function getUserName(userId) {
        var userList = JSON.parse(window.localStorage.getItem('user_list'));
        for (key in userList) {
            if (key == userId) {
                console.log(userList[key]);
                return userList[key]["user_name"];
            }
        }
    }

    function pageInit(){
        console.log($stateParams.userDetails);
        if($stateParams){
            $timeout(function(){
                // $scope.userName = getUserName($stateParams.userId)
                $scope.identifiedUser = $stateParams.userDetails;
                $scope.identifiedUser.filename = "/openface/demo-images/test/" + $stateParams.userDetails.filename + ".png";
                console.log($scope.identifiedUser)

            },50)
        }
    }

    pageInit();
}