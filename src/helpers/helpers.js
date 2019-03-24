const fs = require("fs");
const path = require("path");
const request = require("request");
const progress = require("request-progress");
const isOnline = require("is-online");
const { app } = require("electron").remote;

const selectors = require("./selectors");

const replaceAll = (target, search, replacement) => {
  return target.replace(new RegExp(search, "g"), replacement);
};

const downloadTimeRemaining = time => {
  return time > 60 ? `${Math.floor(time / 60)}m` : `${Math.floor(time)}s`;
};

const formatBytes = (bytes, decimals) => {
  if (bytes == 0) return "0 Bytes";
  var k = 1024,
    dm = decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const isValidURL = url => {
  const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  if (pattern.test(url)) {
    return true;
  } else return false;
};

const getDownloadedVideos = downloadFolder => {
  const log = `${downloadFolder}${path.sep}chapters.txt`;
  if (!fs.existsSync(log)) return [];
  return fs
    .readFileSync(log)
    .toString()
    .split("\n");
};

/* Check if the video was downloaded completely. We insert the name of video into 'chapters.txt' after the download request is ended. */
const isComplete = (videoName, dfolder) => {
  const downloadedVideos = getDownloadedVideos(dfolder);
  //console.log(downloadedVideos);
  if (
    typeof downloadedVideos === "undefined" ||
    downloadedVideos.length === 0
  ) {
    return true;
  }
  for (let j = 0; j < downloadedVideos.length; j++) {
    if (videoName === downloadedVideos[j]) return true;
  }
  return false;
};
/* Check if the video already exists in the directory. This is to avoid downloading files again. */
const findVidExist = (videos, name, dwnpath) => {
  let i = 0;
  for (let x = 0; x < videos.length; x++) {
    let filename = `${dwnpath}${path.sep}${name[x]}.mp4`;
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
  if (typeof url === "undefined") {
    //alert("Download Completed");
    //selectors.id_downloadWrap.style.display = 'none';
    //process.exit(0);
  }
  let _request = request(url);
  let req = progress(_request, {
    //throttle: 2000,
    //delay: 1000
  })
    .on("progress", state => {
      console.log(
        `Downloading: ${Math.floor(state.percent * 100)}% | ${Math.floor(
          state.speed / 1024
        )} kB/s | ${Math.floor(state.time.remaining)}s | ${Math.floor(
          state.size.transferred / 1024
        )} kilobytes`
      );

      selectors.getQuerySelector("#download").style.display = "none";
      selectors.id_downloadWrap.style.display = "block";
      selectors.id_actionWrap.style.display = "block";
      selectors.class_progress.style.display = "block";
      selectors.id_chapterName.textContent = chapterName;
      selectors.id_speed.textContent = `${Math.floor(state.speed / 1024)} kB/s`;
      selectors.id_timeLeft.textContent = `${downloadTimeRemaining(
        state.time.remaining
      )} remaining`;
      selectors.id_transferred.textContent = `${formatBytes(
        state.size.transferred
      )} transferred`;
      selectors.id_dynamic.style.width = `${Math.floor(state.percent * 100)}%`;
      selectors.id_dynamic.setAttribute(
        "aria-valuenow",
        Math.floor(state.percent * 100)
      );
      selectors.id_dynamic.textContent = `${Math.floor(state.percent * 100)}%`;
    })
    .on("error", err => {
      if (err) {
        alert(
          "Connection error. Please check your internet connectivity." + err
        );
        app.relaunch();
        app.exit(0);
      }
    })
    .on("end", () => {
      fs.appendFile(
        path.resolve(`${dwnpath}${path.sep}chapters.txt`),
        chapterName + "\n",
        err => {
          if (err) console.log(err);
        }
      );
      if (typeof url !== "undefined") nextVideo();
    })
    .pipe(
      fs.createWriteStream(
        path.resolve(`${dwnpath}${path.sep}${chapterName}.mp4`)
      )
    );

  selectors.id_action.addEventListener("click", e => {
    e.preventDefault();
    if (selectors.id_action.classList.contains("pause")) {
      pauseIt(_request, "#action");
    } else {
      resumeIt(_request, "#action");
    }
  });
};

const pauseIt = (req, selector) => {
  req.pause();
  selectors.id_chapterName.textContent = `Paused`;
  selectors.getQuerySelector(`${selector}`).classList.remove(["pause"]);
  selectors.getQuerySelector(`${selector}`).textContent = "Resume";
};

const resumeIt = (req, selector) => {
  req.resume();
  selectors.getQuerySelector(`${selector}`).classList.add(["pause"]);
  selectors.getQuerySelector(`${selector}`).textContent = "Pause";
};

const filter = (result, selected_ids) => {
  var names = [];
  var chapterUrls = [];
  var new_result = { names, chapterUrls };
  selected_ids.forEach(index => {
    new_result.names.push(result.names[index]);
    new_result.chapterUrls.push(result.chapterUrls[index]);
  });
  return new_result;
};

module.exports = {
  replaceAll: replaceAll,
  getDownloadedVideos: getDownloadedVideos,
  isComplete: isComplete,
  findVidExist: findVidExist,
  download: downloadOne,
  isValidURL: isValidURL,
  filter: filter
};
