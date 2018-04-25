const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const app = require('electron').remote;

const replaceAll = (target, search, replacement) => {
  return target.replace(new RegExp(search, 'g'), replacement);
};

const getQuerySelector = (selector) => {
  return document.querySelector(selector);
};

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
  let req = progress(request(url), {
      throttle: 2000,
      delay: 1000
    })
    .on('progress', state => {
      console.log(`Downloading: ${Math.floor(state.percent * 100)}% | ${Math.floor(state.speed / 1024) } kB/s | ${Math.floor(state.time.remaining)}s | ${Math.floor(state.size.transferred / 1024)} kilobytes`)

      getQuerySelector(".progress").style.display = 'block';
      getQuerySelector("#chaptername").textContent = chapterName;
      getQuerySelector("#speed").textContent = `${Math.floor(state.speed / 1024) } kB/s`;
      getQuerySelector("#timeLeft").textContent = `${Math.floor(state.time.remaining / 60)}m`;
      getQuerySelector("#dynamic").style.width = `${Math.floor(state.percent * 100)}%`;
      getQuerySelector("#dynamic").setAttribute("aria-valuenow", Math.floor(state.percent * 100));
      getQuerySelector("#dynamic").textContent = `${Math.floor(state.percent * 100)}%`;
    })
    .on('error', err => {
      console.log(err);
    })
    .on('close', () => {
      alert("Connection error. Please check your internet connectivity.");
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
}

module.exports = {
  replaceAll: replaceAll,
  getQuerySelector: getQuerySelector,
  getDownloadedVideos: getDownloadedVideos,
  isComplete: isComplete,
  findVidExist: findVidExist,
  download: downloadOne
};
