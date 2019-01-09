# ece415-faceword-demo
Demo application for a graduate course project (ECE 415 - Image Analysis and Computer Vision I).

Description:
A web application that allows users to login to their accounts through face ID. If a user is not registered already, the application takes samples of the user’s face and registers a new facial ID for easy login the next time user comes onto the application

Video Demo Links:
1) Face Registration process
https://youtu.be/zpfGQ9xRdHU 

2) Code Explanation:
https://youtu.be/4WOKT9W731U

Installation Notes:
- Firstly, at least 2 faces must be trained in order for the classifier to properly work.  
- Secondly, inside of the openface folder, the user must create 3 folders: demo-images, feat, and aligned.
- Inside the demo-images folder, the user must create 2 additional folders: test and training.  The folders must be titled exactly as they are typed.
- From there, the user must also install all the packages in requirements.txt as well as torch(which must be install following the torch website instructions so the luajit version is used) and they must install dpnn using the command luarocks install dpnn. 

Finally, when pulling from the git hub, follow this checklist.
1) Clone this in your computer and run "npm install" while in the directory.
Make sure you have the latest version of Node and npm before doing the above step
2) Once npm installs all required packages, you can run "npm start" to start the server
