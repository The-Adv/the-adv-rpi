//
// SETUP SOCKET SERVER
//

var SOCKET_IO_PORT = 8880;
var HTTP_PORT = process.env.PORT || 5000;

var session = 0;

var io = require("socket.io").listen(SOCKET_IO_PORT);
var fs = require("fs");
var FileWriter = require("wav").FileWriter;
var mic = require("mic");

var isRecording = false;
var sampleRate = 44100;
var audioDir = __dirname + "/audio_recordings/";
var micInstance = null;

var dataDir = __dirname + "/data_recordings/";

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

io.sockets.on("connection", (socket) => {
  session++;

  console.log(`New session #${session}`);

  // wait for the event raised by the client
  socket.on("start_recording", (data) => {
    console.log("start_recording: " + data);
    isRecording = true;

    // create a unique file name to be saved
    var filename = audioDir + getUniqueFilename() + "-" + data + ".wav";

    micInstance = mic({
      rate: sampleRate,
      channels: 1,
      debug: false,
    });

    var micInputStream = micInstance.getAudioStream();
    var outputFileStream = new FileWriter(filename, {
      sampleRate: sampleRate,
      channels: 1,
    });

    micInputStream.pipe(outputFileStream);

    micInputStream.on("data", function (data) {
      // console.log("Recieved Input Stream: " + data.length);
    });

    micInputStream.on("error", function (err) {
      console.log("Error in Input Stream: " + err);
    });

    micInputStream.on("startComplete", function () {
      console.log("Got SIGNAL startComplete");
    });

    micInputStream.on("stopComplete", function () {
      console.log("Got SIGNAL stopComplete");
    });

    micInputStream.on("processExitComplete", function () {
      console.log("Got SIGNAL processExitComplete");
    });

    micInstance.start();
  });

  socket.on("stop_recording", () => {
    if (isRecording) {
      console.log("stop_recording!");
      isRecording = false;

      micInstance.stop();
    }
  });

  socket.on("save_data", (data) => {
    var filename = dataDir + getUniqueFilename() + ".json";

    fs.writeFile(filename, data, function (err, data) {
      if (err) console.log(err);
      console.log(`DATA: Successfully Written to File '${filename}'`);
    });
  });

  socket.on("disconnect", () => {
    console.log("disconnected...");
  });
});

console.log(`'socket.io' listening on http://localhost:${SOCKET_IO_PORT}`);

function getUniqueFilename() {
  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return year + "-" + month + "-" + day + "-session-" + session;
}

//
// SETUP HTTP SERVER
//
var app = require("express")();
var path = require("path");
var serveStatic = require("serve-static");

app.use(serveStatic(__dirname + "/dist"));
app.listen(HTTP_PORT, () => {
  console.log(`'http' listening on http://localhost:${HTTP_PORT}`);
});
