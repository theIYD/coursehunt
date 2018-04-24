import "./stylesheets/main.css";

// Small helpers you might want to keep
/*import "./helpers/context_menu.js";
import "./helpers/external_links.js";*/

const request = require('request');
const progress = require('request-progress');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const {
  dialog
} = require('electron').remote;
const dns = require('dns');
const folder = path.resolve(__dirname, 'files');

let $ = cheerio.load(path.resolve(__dirname, "app", "app.html"));
const progressDynamic = document.querySelector("#dynamic");
/* The basic function which downloads a video from the url */
function downloadOne(url, chapterName, dwnpath, nextVideo) {
  /*let arr = url.split('/');
  let fileName = arr[arr.length - 1];*/
  progress(request(url), {
      throttle: 2000,
      delay: 1000
    })
    .on('progress', state => {
      console.log(`Downloading: ${Math.floor(state.percent * 100)}% | ${Math.floor(state.speed / 1024) } kB/s | ${Math.floor(state.time.remaining)}s | ${Math.floor(state.size.transferred / 1024)} kilobytes`)

      /*$('#dynamic').css("width", Math.floor(state.percent * 100) + "%")
          .attr("aria-valuenow", Math.floor(state.percent * 100))
          .text(Math.floor(state.percent * 100) + "% Complete");*/
      document.querySelector(".progress").style.display = 'block';
      document.querySelector("#chaptername").textContent = chapterName;
      progressDynamic.style.width = `${Math.floor(state.percent * 100)}%`;
      progressDynamic.setAttribute("aria-valuenow", Math.floor(state.percent * 100));
      progressDynamic.textContent = `${Math.floor(state.percent * 100)}%`;
    })
    .on('error', err => {
      console.log(err);
    })
    .on('end', () => {
      fs.appendFile(path.resolve(`${dwnpath}${path.sep}chapters.txt`), chapterName + '\n', (err) => {
        if (err) console.log(err);
      });
      nextVideo();
    })
    .pipe(fs.createWriteStream(path.resolve(`${dwnpath}${path.sep}${chapterName}.mp4`)));
}

/* Download all the videos at once. */
function downloadAllVideos(videos, name, dwnpath) {
  let temp = findVideoExist(videos, name, dwnpath);
  //console.log(temp);

  /* the loopDownload function reiterates over the array and download the files one by one instead of downloading together. 
  downloading together will reduce the speed and can cause crashes. */
  const loopDownload = (video, name) => {
    downloadOne(video[temp], name[temp], dwnpath, () => {
      if (temp < video.length && name.length) {
        temp++;
        loopDownload(video, name);
      }
    });
  }
  loopDownload(videos, name);
}

/* Scrape the video download hrefs and course names from courseURL provided. */
function getCourseNamesAndURLS(courseURL) {
  return new Promise((resolve, reject) => {
    request(courseURL, (err, body) => {
      /*fs.writeFile(path.resolve(__dirname, 'files', `file.html`), body.body, () => {
          console.log("Done");
      })*/
      //console.log(body.body);
      let chapterUrls = [];
      let names = [];
      if (!err) {
        $ = cheerio.load(body.body);
        /* Filter out names of chapters and their urls from the current course url */
        $('#lessons-list').filter(() => {
          let data = $('#lessons-list');
          let dataArray = data
            .children('.lessons-list__li')
            .children()
            .toArray();

          const filterChapterUrls = dataArray.filter(el => el.name === 'link' && el.attribs.itemprop === 'contentUrl');
          const filterNames = dataArray.filter(el => el.name === 'span');

          /* Here chapter names are fetched from the <span> tags */
          filterNames.map(el => {
            if (el.name === 'span') {
              const videoName = el.children[0].data.replace(/[\/:*?"<>|]/g, '');
              const name = replaceAll(videoName, 'Урок', 'Lesson')
              names.push(name);
            }
          });

          /* Here chapter urls are fetched from the <span> tags */
          filterChapterUrls.map(el => {
            chapterUrls.push(el.attribs.href);
          });
          resolve({
            chapterUrls,
            names
          });
        });
      } else {
        reject(err);
      }
    });
  });
}

/*function getFilesizeInKiloBytes(filename) {
    let stats = fs.statSync(filename);
    return stats["size"] / 1024;
}*/

/* Check if the video already exists in the directory. This is to avoid downloading files again. */
function findVideoExist(videos, name, dwnpath) {
  let i = 0;
  for (let x = 0; x < videos.length; x++) {
    let filename = `${dwnpath}${path.sep}${name[x]}.mp4`
    //console.log(filename);
    if (fs.existsSync(filename) && isCompletelyDownloaded(name[x], dwnpath)) {
      console.log(`File \'${name[x]}\' already exists\n`);
      i++;
    } else {
      break;
    }
  }
  return i;
}

/* Check if the video was downloaded completely. We insert the name of video into 'chapters.txt' after the download request is ended. */
function isCompletelyDownloaded(videoName, dfolder) {
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
}

/* Get an array of videos downloaded */
function getDownloadedVideos(downloadFolder) {
  const logFile = `${downloadFolder}${path.sep}chapters.txt`;
  if (!fs.existsSync(logFile)) return [];
  return fs.readFileSync(logFile).toString().split("\n");
}

const replaceAll = function (target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
};

/*getCourseNamesAndURLS('https://coursehunters.net/course/node-js-prodvinutye-temy')
    .then(result => {
        downloadAllVideos(result.chapterUrls, result.names);
    });*/

/*  All Clientside Javascript */
window.onload = () => {
  let videoBlock, vidName, dwnBtn, li, resultul = document.querySelector("#resultUL");
  document.querySelector(".progress").style.display = 'none';
  const getVideos = document.querySelector("#getVids");
  getVideos.addEventListener("click", () => {
    const url = document.querySelector("#url").value;
    getCourseNamesAndURLS(url)
      .then(result => {
        document.querySelector("#resultDiv").style.display = "block";
        dwnBtn = document.createElement("button");
        dwnBtn.id = "download";
        dwnBtn.textContent = "Download All";
        dwnBtn.classList.add("btn", "btn-dark", "mr-auto");
        document.querySelector("#downloadWrap").appendChild(dwnBtn);

        while (document.querySelector('#resultUL').firstChild) {
          document.querySelector('#resultUL').removeChild(document.querySelector('#resultUL').firstChild);
        }

        if (!document.querySelector(".vid")) {
          for (let x = 0; x < result.names.length; x++) {
            li = document.createElement("li");
            li.classList.add("list-group-item", "vid")
            videoBlock = document.createElement("div");
            videoBlock.className = 'vidNameBlock';
            vidName = document.createElement("p");
            vidName.appendChild(document.createTextNode(`${result.names[x]}`));
            videoBlock.appendChild(vidName);
            //console.log(videoBlock);
            li.appendChild(videoBlock);
            resultul.appendChild(li);
          }
          dwnBtn.addEventListener("click", () => {
            let dwnpath = dialog.showOpenDialog({
              properties: ['openDirectory']
            });
            //console.log(temp);
            downloadAllVideos(result.chapterUrls, result.names, dwnpath);
          });
        }
      });
  });
}
