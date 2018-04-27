const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const {
  app
} = require('electron').remote;

const replaceAll = (target, search, replacement) => {
  return target.replace(new RegExp(search, 'g'), replacement);
};

const getQuerySelector = (selector) => {
  return document.querySelector(selector);
};

const downloadTimeRemaining = (time) => {
  return (time > 60) ? `${Math.floor(time / 60)}m` : `${Math.floor(time)}s`;
}

const formatBytes = (bytes, decimals) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1024,
    dm = decimals || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getDownloadedVideos = (downloadFolder) => {
  const log = `${downloadFolder}${path.sep}chapters.txt`;
  if (!fs.existsSync(log)) return [];
  return fs.readFileSync(log).toString().split("\n");
};

/* Check if the video was downloaded completely. We insert the name of video into 'chapters.txt' after the download request is ended. */
const isComplete = (videoName, dfolder) => {
  const downloadedVideos = getDownloadedVideos(dfolder);
  //console.log(downloadedVideos);
  if (typeof downloadedVideos === 'undefined' || downloadedVideos.length === 0) {
    return true;
  }
  for (let j = 0; j < downloadedVideos.length; j++) {
    if (videoName === downloadedVideos[j])
      return true;
  }
  return false;
};
/* Check if the video already exists in the directory. This is to avoid downloading files again. */
const findVidExist = (videos, name, dwnpath) => {
  let i = 0;
  for (let x = 0; x < videos.length; x++) {
    let filename = `${dwnpath}${path.sep}${name[x]}.mp4`
    //console.log(filename);
    if (fs.existsSync(filename) && isComplete(name[x], dwnpath)) {
      console.log(`File \'${name[x]}\' already exists\n`);
      i++;
    } else {
      break;
    }
  }
  return i;
};

/* The basic function which downloads a video from the url */
const downloadOne = (url, chapterName, dwnpath, nextVideo) => {
  let _request = request(url);
  let req = progress(_request, {
      throttle: 2000,
      delay: 1000
    })
    .on('progress', state => {
      console.log(`Downloading: ${Math.floor(state.percent * 100)}% | ${Math.floor(state.speed / 1024) } kB/s | ${Math.floor(state.time.remaining)}s | ${Math.floor(state.size.transferred / 1024)} kilobytes`)

      getQuerySelector("#download").style.display = 'none';
      getQuerySelector("#downloadWrap").style.display = 'block';
      getQuerySelector("#action-wrap").style.display = 'block';
      getQuerySelector(".progress").style.display = 'block';
      getQuerySelector("#chaptername").textContent = chapterName;
      getQuerySelector("#speed").textContent = `${Math.floor(state.speed / 1024) } kB/s`;
      getQuerySelector("#timeLeft").textContent = `${downloadTimeRemaining(state.time.remaining)} remaining`;
      getQuerySelector("#transferred").textContent = `${formatBytes(state.size.transferred)} transferred`;
      getQuerySelector("#dynamic").style.width = `${Math.floor(state.percent * 100)}%`;
      getQuerySelector("#dynamic").setAttribute("aria-valuenow", Math.floor(state.percent * 100));
      getQuerySelector("#dynamic").textContent = `${Math.floor(state.percent * 100)}%`;
    })
    .on('error', err => {
      console.log(err);
      alert("Connection error. Please check your internet connectivity." + err);
      app.relaunch();
      app.exit(0);
    })
    .on('end', () => {
      fs.appendFile(path.resolve(`${dwnpath}${path.sep}chapters.txt`), chapterName + '\n', (err) => {
        if (err) console.log(err);
      });
      nextVideo();
    })
    .pipe(fs.createWriteStream(path.resolve(`${dwnpath}${path.sep}${chapterName}.mp4`)));

    getQuerySelector("#action").addEventListener("click", (e) => {
      e.preventDefault();
      if(getQuerySelector("#action").classList.contains("pause")) {
        _request.pause();
        getQuerySelector("#action").classList.remove(["pause"]);
        getQuerySelector("#action").textContent = 'Resume';
      } else {
        _request.resume();
        getQuerySelector("#action").classList.add(["pause"]);
        getQuerySelector("#action").textContent = 'Pause';
      }
    });
}

module.exports = {
  replaceAll: replaceAll,
  getQuerySelector: getQuerySelector,
  getDownloadedVideos: getDownloadedVideos,
  isComplete: isComplete,
  findVidExist: findVidExist,
  download: downloadOne
};
