import "./stylesheets/main.css";
const request = require('request');
const progress = require('request-progress');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const isOnline = require('is-online');
const {
  dialog,
  app
} = require('electron').remote;

const helpers = require('./helpers/helpers');

/* Download all the videos at once. */
function downloadAllVideos(videos, name, dwnpath) {
  let temp = helpers.findVidExist(videos, name, dwnpath);

  /* the loopDownload function reiterates over the array and download the files one by one instead of downloading together. 
  downloading together will reduce the speed and can cause crashes. */
  const loopDownload = (video, name) => {
    helpers.download(video[temp], name[temp], dwnpath, () => {
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
      let chapterUrls = [];
      let names = [];
      if (!err) {
        let $ = cheerio.load(body.body);
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
              const name = helpers.replaceAll(videoName, 'Урок', 'Lesson')
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

/*  All Clientside Javascript */
window.onload = () => {
  isOnline().then(online => {
    if (!online) {
      alert("You are offline. Make sure you are connected to the internet. Exiting...");
      app.exit(0);
    }
  });

  let videoBlock,
    vidName,
    dwnBtn,
    li,
    resultul = helpers.getQuerySelector("#resultUL"),
    getVideos = helpers.getQuerySelector("#getVids");

  helpers.getQuerySelector(".progress").style.display = 'none';
  getVideos.addEventListener("click", () => {
    helpers.getQuerySelector("#overlay").style.display = 'block';
    const url = helpers.getQuerySelector("#url").value;
    let course_url_title = url.split('/');
    getCourseNamesAndURLS(url)
      .then(result => {
        if(result) {
          setTimeout(() => {
            helpers.getQuerySelector("#overlay").style.display = 'none';
          }, 3000)
        }
        helpers.getQuerySelector("#resultDiv").style.display = "block";
        dwnBtn = document.createElement("button");
        dwnBtn.id = "download";
        dwnBtn.textContent = "Download";
        dwnBtn.classList.add("btn", "btn-dark", "btn-sm");
        dwnBtn.style.height = '40px';
        helpers.getQuerySelector("#downloadWrap").appendChild(dwnBtn);

        while (helpers.getQuerySelector('#resultUL').firstChild) {
          helpers.getQuerySelector('#resultUL').removeChild(helpers.getQuerySelector('#resultUL').firstChild);
        }

        if (!helpers.getQuerySelector(".vid")) {
          for (let x = 0; x < result.names.length; x++) {
            li = document.createElement("li");
            li.classList.add("list-group-item", "vid")
            videoBlock = document.createElement("div");
            videoBlock.className = 'vidNameBlock';
            vidName = document.createElement("h6");
            vidName.className = "chapter-name";
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

            if(dwnpath === undefined) return;

            if(!fs.existsSync(`${dwnpath}${path.sep}${course_url_title[course_url_title.length -1]}`)) {
              fs.mkdirSync(`${dwnpath}${path.sep}${course_url_title[course_url_title.length -1]}`);
            }
            //console.log(`${dwnpath}${path.sep}${course_url_title[course_url_title.length -1]}`);
            downloadAllVideos(result.chapterUrls, result.names, `${dwnpath}${path.sep}${course_url_title[course_url_title.length -1]}`);
          });
        }
      });
  });
}
