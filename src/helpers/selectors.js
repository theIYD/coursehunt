const getQuerySelector = (selector) => {
    return document.querySelector(selector);
};

const id_download = getQuerySelector("#download");
const id_downloadWrap = getQuerySelector("#downloadWrap");
const id_actionWrap = getQuerySelector("#action-wrap");
const class_progress = getQuerySelector(".progress");
const id_chapterName = getQuerySelector("#chaptername");
const id_speed = getQuerySelector("#speed");
const id_timeLeft = getQuerySelector("#timeLeft");
const id_transferred = getQuerySelector("#transferred");
const id_dynamic = getQuerySelector("#dynamic");
const id_action = getQuerySelector("#action");

const id_resultUl = getQuerySelector("#resultUL");
const id_getVideos = getQuerySelector("#getVids");
const id_overlay = getQuerySelector("#overlay");
const id_url = getQuerySelector("#url");
const id_resultDiv = getQuerySelector("#resultDiv");
const class_vid = getQuerySelector(".vid");
  
module.exports = {
    id_download: id_download,
    id_downloadWrap: id_downloadWrap,
    id_actionWrap: id_actionWrap,
    id_chapterName: id_chapterName,
    id_speed: id_speed,
    id_timeLeft: id_timeLeft,
    id_transferred: id_transferred,
    id_dynamic: id_dynamic,
    id_action: id_action,
    id_resultUl: id_resultUl,
    id_getVideos: id_getVideos,
    id_overlay: id_overlay,
    id_url: id_url,
    id_resultDiv: id_resultDiv,
    class_vid: class_vid,
    class_progress: class_progress,
    getQuerySelector: getQuerySelector
};