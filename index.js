const path = require('path');
const fs = require('fs');
const multer  = require('multer')

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname))
	}
});
const upload = multer({ storage: storage })

const ffmpeg = require('fluent-ffmpeg');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

const express = require('express');

const app = express();

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// set the view engine to ejs
app.set('view engine', 'ejs');

function deleteFiles(files, callback){
  var i = files.length;
  files.forEach(function(filepath){
    fs.unlink(filepath, function(err) {
      i--;
      if (err) {
        callback(err);
        return;
      } else if (i <= 0) {
        callback(null);
      }
    });
  });
};

app.post('/upload', upload.fields([{ name: 'imageselect', maxCount: 1 }, { name: 'audioselect', maxCount: 1 }]), function(req, res) {
	//console.log("TEST!!", req.files.imageselect);
	//console.log("TEST!!", req.files.audioselect[0].originalname);
		
	let image = path.join(__dirname, '/uploads', req.files.imageselect[0].filename);
	let audio = path.join(__dirname, '/uploads', req.files.audioselect[0].filename);
	let out = path.join(__dirname, '/out', 'out.mp4');

	console.log("Loading...");

	ffmpeg()
		.input(image)
		.input(audio)
		.videoCodec('libx264')
		.size('640x480')
		.autopad()
		.save(out)
		.on('end', () => {
		    console.log("Done!");

		    res.download(out);

		    deleteFiles([image, audio], () => {
		    	console.log("Cleaned files up");
		    });
		})
		.on('error',(err)=>{
			console.log("Whoops...", err);

		    deleteFiles([image, audio], () => {
		    	console.log("Cleaned files up");
		    });
		});
});

// index page
app.get('/', function(req, res) {
  res.render('index');
});

app.listen(8080);
console.log('Server is listening on port 8080');
