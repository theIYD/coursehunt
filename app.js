const request = require('request');
const progress = require('request-progress');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const folder = path.resolve(__dirname, 'files');

/* The basic function which downloads a video from the url */
function downloadOne(url, chapterName, nextVideo) {
    /*let arr = url.split('/');
    let fileName = arr[arr.length - 1];*/
    progress(request(url), {throttle: 2000, delay: 1000})
        .on('progress', state => {
            console.log(`Downloading: ${Math.floor(state.percent * 100)}% | ${Math.floor(state.speed / 1024) } kB/s | ${Math.floor(state.time.remaining)}s | ${Math.floor(state.size.transferred / 1024)} kilobytes`)
        })
        .on('error', err => {
            console.log(err);
        })
        .on('end', () => {
            console.log("Done");
            fs.appendFile(path.resolve(__dirname, 'files', `chapters.txt`), chapterName + '\n', (err) => {
                if(err) console.log(err);
            });
            nextVideo();
        })  
        .pipe(fs.createWriteStream(path.resolve(__dirname, 'files', `${chapterName}.mp4`)));
    
}

/* Download all the videos at once. */
function downloadAllVideos(videos, name) {
    let temp = findVideoExist(videos, name);
    //console.log(temp);

    /* the loopDownload function reiterates over the array and download the files one by one instead of downloading together. 
    downloading together will reduce the speed and can cause crashes. */
    const loopDownload = (video, name) => {
        download(video[temp], name[temp], () => {
            if(temp < video.length && name.length) {
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
            if(!err) {
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
                            names.push(videoName);
                        }
                    });
    
                    /* Here chapter urls are fetched from the <span> tags */
                    filterChapterUrls.map(el => {
                        chapterUrls.push(el.attribs.href);
                    });
                    resolve({ chapterUrls, names });
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
function findVideoExist(videos, name) {
    let i=0;
    for (let x=0; x<videos.length; x++) {
        let filename = path.resolve(__dirname, 'files', `${name[x]}.mp4`)
        //console.log(filename);
        if (fs.existsSync(filename) && isCompletelyDownloaded(name[x])) {
          console.log(`File \'${name[x]}\' already exists\n`);
          i++;
        } else {
          break ;
        }
      }
      return i;
}

/* Check if the video was downloaded completely. We insert the name of video into 'chapters.txt' after the download request is ended. */ 
function isCompletelyDownloaded(videoName) {
    const downloadedVideos = getDownloadedVideos(folder);
    //console.log(downloadedVideos);
    if (typeof downloadedVideos === 'undefined' || downloadedVideos.length === 0) {
      return true;
    }
    for (let j=0; j<downloadedVideos.length; j++) {
      if (videoName === downloadedVideos[j])
        return true;
    }
    return false;
  }

/* Get an array of videos downloaded */
function getDownloadedVideos(downloadFolder) {
    const logFile =`${downloadFolder}${path.sep}chapters.txt`;
    if (!fs.existsSync(logFile)) return [];
    return fs.readFileSync(logFile).toString().split("\n");
}

getCourseNamesAndURLS('https://coursehunters.net/course/node-js-prodvinutye-temy')
    .then(result => {
        downloadAllVideos(result.chapterUrls, result.names);
    });