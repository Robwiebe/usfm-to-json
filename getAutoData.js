const SVBAutoData = require("./SVBAutoData.json");
const versification = require("./versification.json");
const BookList = require('./BookList.json');

// chapterRef = "GEN-1" or the same format
const getNeededChapters = (chapterRef) => {
  const allKeys = Object.keys(versification);
  const neededKeys = allKeys.filter((k) => {
    const split = k.split("-");
    return `${split[0]}-${split[1]}` === chapterRef;
  });
  if (neededKeys.length === 0) return [chapterRef];
  const chaptersNeeded = [chapterRef];
  neededKeys.forEach((k) => {
    const neededChapter = versification[k] || null;
    const split = neededChapter.split("-");
    if (
      neededChapter &&
      chaptersNeeded.indexOf(`${split[0]}-${split[1]}`) === -1
    ) {
      chaptersNeeded.push(`${split[0]}-${split[1]}`);
    }
  });
  return chaptersNeeded;
};

module.exports.getAutoData = (chapterRef) => {
  const chaptersNeeded = getNeededChapters(chapterRef);
  const DBLBook = chapterRef.split("-")[0];
  const bookDJH = BookList[DBLBook].DJH;
  const chapterNum1 = chaptersNeeded[0].split("-")[1];
  const automationData = {
    [chapterNum1]: SVBAutoData[bookDJH][chapterNum1]
  }

  if (chaptersNeeded[1]) {
    const chapterNum2 = chaptersNeeded[1].split("-")[1];
    automationData[chapterNum2] = SVBAutoData[bookDJH][chapterNum2]

  }
  if (chaptersNeeded[2]) {
    const chapterNum3 = chaptersNeeded[2].split("-")[1];
    automationData[chapterNum3] = SVBAutoData[bookDJH][chapterNum3];

  }
  return automationData;
}
