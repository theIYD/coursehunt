import "./stylesheets/main.css";
import { POINT_CONVERSION_HYBRID } from "constants";
const request = require("request");
const progress = require("request-progress");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");
const isOnline = require("is-online");
const { dialog, app, getCurrentWindow } = require("electron").remote;

const helpers = require("./helpers/helpers");
const selectors = require("./helpers/selectors");

/* Download all the videos at once. */
function downloadAllVideos(videos, name, dwnpath) {
  let temp = helpers.findVidExist(videos, name, dwnpath);

  /* the loopDownload function reiterates over the array and download the files one by one instead of downloading together.
  downloading together will reduce the speed and can cause crashes. */
  const loopDownload = (video, name) => {
    helpers.download(video[temp], name[temp], dwnpath, () => {
      temp++;
      if (temp >= video.length) {
        alert("Download completed");
        selectors.id_progress_wrap.style.display = "none";
        getCurrentWindow().reload();
      }
      if (temp < video.length && name.length) {
        loopDownload(video, name);
      }
    });
  };
  loopDownload(videos, name);
  return true;
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
        $("#lessons-list").filter(() => {
          let data = $("#lessons-list");

          let dataArray = data
            .children(".lessons-item")
            .children()
            .toArray();

          const filterChapterUrls = dataArray.filter(
            el => el.name === "link" && el.attribs.itemprop === "contentUrl"
          );

          const filterNames = $("span[itemprop='name']", dataArray).each(function() {

            const name = helpers.replaceAll($(this).text(), "Урок", "Lesson");
            names.push(name);
          });

          console.log(names);

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
      alert(
        "You are offline. Make sure you are connected to the internet. Exiting..."
      );
      app.exit(0);
    }
  });

  let videoBlock,
    vidName,
    dwnBtn,
    li,
    resultul = selectors.id_resultUl,
    getVideos = selectors.id_getVideos;

  selectors.class_progress.style.display = "none";
  getVideos.addEventListener("click", () => {
    selectors.id_overlay.style.display = "block";
    const url = selectors.id_url.value;
    if (helpers.isValidURL(url)) {
      let course_url_title = url.split("/");
      getCourseNamesAndURLS(url).then(result => {
        if (result) {
          setTimeout(() => {
            selectors.id_overlay.style.display = "none";
          }, 3000);
        }
        selectors.id_resultDiv.style.display = "block";
        dwnBtn = document.createElement("button");
        dwnBtn.id = "download";
        dwnBtn.textContent = "Download";
        dwnBtn.classList.add("btn", "btn-custom", "btn-sm");
        dwnBtn.style.height = "40px";
        selectors.id_downloadWrap.appendChild(dwnBtn);

        while (selectors.id_resultUl.firstChild) {
          selectors.id_resultUl.removeChild(selectors.id_resultUl.firstChild);
        }

        if (!selectors.class_vid) {
          for (let x = 0; x < result.names.length; x++) {
            var name = `${result.names[x]}`;
            li = document.createElement("li");
            li.classList.add("list-group-item", "vid");
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.click();

            videoBlock = document.createElement("div");
            videoBlock.className = "vidNameBlock";
            vidName = document.createElement("h6");
            vidName.className = "chapter-name";

            vidName.appendChild(document.createTextNode(name));
            checkbox.id = x;
            videoBlock.id = x;
            checkbox.className = "chk_box";
            videoBlock.appendChild(vidName);
            videoBlock.appendChild(checkbox);
            videoBlock.addEventListener("click", e => {
              console.log(e.target.type);
              if (!(e.target.type === "checkbox"))
                document
                  .querySelector(
                    "#" + CSS.escape(e.currentTarget.id) + " input"
                  )
                  .click();
            });

            li.appendChild(videoBlock);
            resultul.appendChild(li);
          }

          dwnBtn.addEventListener("click", () => {
            var selected_ids = Array.from(document.querySelectorAll(".chk_box"))
              .filter(({ checked }) => checked)
              .map(obj => obj.id);

            result = helpers.filter(result, selected_ids);
            let dwnpath = dialog.showOpenDialog({
              properties: ["openDirectory"]
            });

            if (dwnpath === undefined) return;

            if (
              !fs.existsSync(
                `${dwnpath}${path.sep}${
                  course_url_title[course_url_title.length - 1]
                }`
              )
            ) {
              fs.mkdirSync(
                `${dwnpath}${path.sep}${
                  course_url_title[course_url_title.length - 1]
                }`
              );
            }

            //console.log(`${dwnpath}${path.sep}${course_url_title[course_url_title.length -1]}`);

            downloadAllVideos(
              result.chapterUrls,
              result.names,
              `${dwnpath}${path.sep}${
                course_url_title[course_url_title.length - 1]
              }`
            );
          });
        }
      });
    }
  });
};
