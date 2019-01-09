const express = require('express')
var https = require('https');
var http = require('http');
const fs = require('fs')
const Q = require('q');
const socket = require('socket.io')
const exec = require('child-process-promise').exec;

const app = express()

const port = 3009

const multer = require('multer')

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var destFolder = __dirname + "/openface/demo-images/test/";
        if (req.body.process == 'register') {
            var destFolder = __dirname + "/openface/demo-images/training/" + req.body.user_id + "/";
        }
        if (req.body.process == 'login') {
            var destFolder = __dirname + "/openface/demo-images/test/";
        }
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder);
        }
        callback(null, destFolder);
    },
    filename: function (req, file, callback) {
        callback(null, req.body.file_name);
    }
});

var upload = multer({ storage: Storage }).any(); //Field name and max counts

// const bodyParser = require('body-parser')
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use(function (req, res, next) {
    console.log('req: ', req.method, ' for: ', req.url);
    next();
});

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3007/');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.static('public'));

const nodeServer = app.listen(port, () => console.log(`Example app listening on  http://localhost:${port}/`))
const io = socket(nodeServer);


function saveBlobToFile(blob, encoding, fullfileName) {
    var deferred = Q.defer();
    var buf = new Buffer(blob, encoding); // decode
    console.log("decoded blob from " + encoding)
    fs.writeFile(fullfileName, buf, function (err) {
        if (err) {
            console.log("err", err);
            deferred.reject(err);
        }
        else
            deferred.resolve(fullfileName);
    });
    return deferred.promise;
};

app.post("/saveImage", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Something went wrong!", err);
        }

        return res.end("Saved Image Successfully.");
    });
});

app.post("/recogniseImage", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Something went wrong!", err);
        }
        console.log(req.body.file_name);
        var filename = req.body.file_name
        runIdentifierCommands(filename)
            .then(function (user) {
                if (user == "Exception: Unable to find a face:") {
                    return res.end(JSON.stringify(user));
                }
                else {
                    console.log("This is the identified User", user);
                    return res.end(JSON.stringify(user));
                }
            })
            .catch(function (err) {
                console.log(err);
            })
    });
});



// Socket Events
io.on('connection', (socket) => {
    console.log('client connected');

    socket.on('hello_server', (data) => {
        console.log("Data received is: ", data)
    })

    socket.on('clear_image_database', (data) => {
        console.log("Clearing all Training Data")
        exec('rm -r openface/demo-images/training/*; rm -r openface/aligned/*; rm -r openface/feat/*')
            .then(function (result) {
                console.log('Cleared the training Database');
            })
            .catch(function (err) {
                console.log("error")
            })
    })

    socket.on('start_training', (data) => {
        console.log('[SERVER_LOG]: Making Trees from Image Directory...')
        exec('tree openface/demo-images/training/')
            .then(function (result) {
                console.log('[SERVER_LOG]: Completed making the Image Directory Tree.')
                var stdout = result.stdout;
                console.log('stdout: ', stdout);

                console.log('[SERVER_LOG]: Aligning Images...')
                exec('for N in {1..8}; do ./openface/util/align-dlib.py openface/demo-images/training/ align outerEyesAndNose openface/aligned/ --size 96 & done')
                    .then(function (result) {
                        console.log('[SERVER_LOG]: Completed Aligning Images')
                        var stdout = result.stdout;
                        console.log('stdout: ', stdout);

                        console.log('[SERVER_LOG]: Using lua scripts to create labelled features of aligned images...')
                        exec('rm openface/aligned/cache.t7; ./openface/batch-represent/main.lua -outDir openface/feat/ -data openface/aligned/')
                            .then(function (result) {
                                console.log('[SERVER_LOG]: Completed extracting features')
                                var stdout = result.stdout;
                                console.log('stdout: ', stdout);

                                console.log('[SERVER_LOG]: Training Classifier using extracted features...')
                                exec('cd openface; ./demos/classifier.py train feat/')
                                    .then(function (result) {
                                        console.log('[SERVER_LOG]: Created Classifier.pkl')
                                        var stdout = result.stdout;
                                        console.log('stdout: ', stdout);
                                        socket.emit('training_complete', "Training Completed")
                                        console.log("[SERVER_LOG]: Training Complete");
                                    })
                                    .catch(function (err) {
                                        let error_string = JSON.stringify(err);
                                        if (error_string.search("ValueError: The number of classes has to be greater than one;") > 0) {
                                            socket.emit('training_complete', "Training Completed")
                                            console.log("[SERVER_LOG]: Training Complete");
                                        } else {
                                            console.error('[SERVER_ERROR]: ', err);
                                            socket.emit('error_in_training', "Error in training")
                                        }
                                    });
                            })
                            .catch(function (err) {
                                console.error('[SERVER_ERROR]: ', err);
                                socket.emit('error_in_training', "Error in training")
                            });
                    })
                    .catch(function (err) {
                        console.error('[SERVER_ERROR]: ', err);
                        socket.emit('error_in_training', "Error in training")
                    });
            })
            .catch(function (err) {
                console.error('[SERVER_ERROR]: ', err);
                socket.emit('error_in_training', "Error in training")
            });
    })
});

function runIdentifierCommands(filename) {
    var deferred = Q.defer();
    exec('cd openface; ./demos/classifier.py infer ./feat/classifier.pkl demo-images/test/' + filename)
        // exec('cd openface; ./demos/classifier.py infer ./feat/celeb-classifier.nn4.small2.v1.pkl demo-images/test/' + filename)
        .then(function (result) {
            let stdout = result.stdout;
            let stderr = result.stderr;

            var n = stdout.search("confidence");
            let decimalPercent = stdout.substring(n - 5, n-1);
            let percentVal = stdout.substring(n - 3, n-1);
            let userId = stdout.substring(n - 23, n - 11);

            let user = {
                "percentVal": percentVal,
                "userId": userId,
                "decimalPercent": decimalPercent,
                "filename": filename
            }
            if (decimalPercent >= 0.75) { // Confidence to identify is high
                console.log('[SERVER_LOG]: The user identified was ', user);
                deferred.resolve(user);
            }
            // if(percentVal > 80 || percentVal == 00) {
            //     console.log("Identified as ", user);
            //     deferred.resolve(user);
            // }
            else { // Confidence to identify is low
                console.log('[SERVER_LOG]: Could not identify the user: ', percentVal, decimalPercent);
                let unknown_user = {
                    'confidence': percentVal,
                    "status": "no_user"
                }
                deferred.resolve(unknown_user);
            }

        })
        .catch(function (err) {
            console.error('[SERVER_ERROR]: ', err);
            let error_string = JSON.stringify(err);
            console.log(error_string.search("Unable to find a face:"));
            if (error_string.search("Unable to find a face:") > 0) {
                console.log('[SERVER_ERROR]: Unable to find a face')
                deferred.resolve("no_face_detected");
            } else {
                deferred.reject(err)
            }
        });

    return deferred.promise;
}
