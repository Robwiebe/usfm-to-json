const embeddedDocsVerses = require('./embeddedDocs.json');
const DJHBooks = require('./BookList(DJH).json');
const isEqual = require('lodash.isequal');
const { getRef, getTextObjs } = require('./automationHelpers');
const { verifyContent } = require('./verifyContent');

const embeddedDocsBooks = [
  'Rom',
  '1Co',
  '2Co',
  'Gal',
  'Eph',
  'Php',
  'Col',
  '1Th',
  '2Th',
  '1Ti',
  '2Ti',
  'Tit',
  'Phm',
  'Heb',
  'Jam',
  '1Pe',
  '2Pe',
  '1Jn',
  '2Jn',
  '3Jn',
  'Jud',
];
const typesOfParagraphs = [
  'p',
  'm',
  'po',
  'pm',
  'pmo',
  'pmc',
  'pmr',
  'pi',
  'pi1',
  'pi2',
  'pi3',
  'pi4',
  'mi',
  'cls',
  'lh',
  'lf',
  'li',
  'li1',
  'li2',
  'li3',
  'li4',
  'lim',
  'lim1',
  'lim2',
  'lim3',
  'lim4',
  'pc',
  'pr',
  'ph',
  'ph1',
  'ph2',
  'ph3',
  'lit',
  'q',
  'q1',
  'q2',
  'q3',
  'q4',
  'qr',
  'qc',
  'qa',
  'qm',
  'qm1',
  'qm2',
  'qm3',
  'qm4',
  'qd',
  'b',
  'd',
  'iex',
  'nb',
];

const proseParagraphs = [
  'p',
  'm',
  'po',
  'pm',
  'pmo',
  'pmc',
  'pmr',
  'pi',
  'pi1',
  'pi2',
  'pi3',
  'pi4',
  'mi',
  'cls',
  'lh',
  'lf',
  'pc',
  'pr',
  'ph',
  'ph1',
  'ph2',
  'ph3',
  'lit',
  'd',
  'iex',
  'nb',
];

const typesOfNonDataTags = [
  'add',
  'bk',
  'dc',
  'k',
  'nd',
  'ord',
  'pn',
  'png',
  'addpn',
  'qac',
  'qs',
  'qt',
  'qt1',
  'qt2',
  'qt3',
  'qt4',
  'qt5',
  'qt6',
  'rq',
  'sig',
  'sls',
  'tl',
  'wj',
  'bd',
  'bdit',
  'em',
  'it',
  'no',
  'sc',
  'sup',
  'f',
  'ft',
  'fr',
  'fq',
  'fqa',
  'fk',
  'fl',
  'fw',
  'fp',
  'fv',
  'fdc',
  'litl',
  'lik',
  'liv',
  'liv1',
  'liv2',
  'liv3',
  'liv4',
  'ndx',
];
const typesOfDataTags = ['v', 'rb', 'pro', 'w', 'wg', 'wh', 'wa'];

let slateDoc = [];
let currentVerse = ['0'];
let isCurrentBubble = false;
let isPreviousSource = false;
let endOfSpeechBubble = false;
let wasSingleSource = false;

const isEmbeddedDoc = (book, chapter, verse) => {
  // if this entire book is an embedded doc (like the letters of the NT)
  if (embeddedDocsBooks.indexOf(book) !== -1) {
    return true;
  }

  // if the verse is 100% an embedded doc
  if (
    embeddedDocsVerses.complete.indexOf(
      `${book}-${chapter}-${verse}`,
    ) !== -1
  ) {
    return true;
  }

  // if the verse has parts of it as embedded doc (partial)
  if (
    embeddedDocsVerses.partial.indexOf(
      `${book}-${chapter}-${verse}`,
    ) !== -1
  ) {
    return 'partial';
  }

  // if this verse is not an embedded doc, return it as null
  // so that firebase will erase the data once saved
  // if you put 'false' then the useless data will increase file size
  return null;
};

const matchSourceData = (data1, data2) => {
  return (
    data1.sourceName === data2.sourceName &&
    data1.color === data2.color &&
    data1.recipientName === data2.recipientName
  );
};

const createSourceObj = (
  chapter,
  verse,
  automationData,
  versification,
  useDifferentiator,
  hasStartDifferentiator,
  hasEndDifferentiator,
  isFootnote
) => {
// console.log('createSourceObj FULL ARGS', {
  //   chapter,
  //   verse,
  //   automationData,
  //   versification,
  //   hasStartDifferentiator,
  //   hasEndDifferentiator,
  //   isFootnote,
  // });
  if (!versification) {
  // console.log('NO versification');
  }
  let verseData = [];
  verse.forEach((v, index) => {
    const newRef = versification
      ? versification
      : `book-${chapter}-${v}`;
  // console.log('newRef', newRef);
    const autoData =
      automationData[`${newRef.split('-')[1].replace(/\D/g, '')}`][
        `${newRef.split('-')[2].replace(/\D/g, '')}`
      ];
  // console.log('autoData', autoData);
    // console.log(v, autoData);
    if (index === 0) {
      verseData = autoData;
      return;
    }
    if (!autoData) {
      // alert(
      //   `There is no automation data for verse ${v}. Please notify a member of the SourceView Bible team or email: sourceviewteam@gmail.com`,
      // );
      return;
    }
    // process sourceData for this verse
    autoData.forEach((vS) => {
      let exists = false;
      // check if the source already exists in verseData
      verseData.forEach((s) => {
        // if the source already exists, skip the rest of the checks
        if (exists) {
          return;
        }

        if (isEqual(s, vS)) {
          exists = true;
        }
        // if the source already exists, return it
        if (exists) {
          return;
        }
        // if it's a new source, add it to verseData
        else {
          verseData.push(vS);
        }
      });
    });
  });
  // // get the source metadata specific for this verse
  // const verseData = autoData[+verse];
  if (!verseData) {
    // alert(
    //   `It could be that this version has this verse (${verse}) but the automation file does not.\n\nSubsequently there will not be any source buttons for this verse. Please contact us: sourceviewteam@gmail.com`,
    // );
  }

  // if there is more than one source in the verse
  // set the data so that it can be highlighted in the
  // editor as needed to be edited manually

  // if there is NO DATA = ERROR
  if (!verseData || verseData.length === 0) {
    wasSingleSource = false;
    // alert('NO SOURCE DATA', currentVerse);
    isCurrentBubble = false;
    return {
      source: {
        color: 'edit',
        sourceName: 'Select Source',
        unique_sources: null,
      },
      children: [],
    };
  }

  // if there are two sources in the verse
  else if (verseData.length === 2 && useDifferentiator) {
  // console.log('Double Source', `${chapter}:${verse}`);
    const hasNarrator = verseData.find((s) => s.color === 'black');
  // console.log('hasNarrator', hasNarrator);
  // console.log('hasStartDifferentiator', hasStartDifferentiator);
  // console.log('hasEndDifferentiator', hasEndDifferentiator);
    // if there are only two source options with no black text
    if (!hasNarrator) {
    // console.log('No Narrator');
      isCurrentBubble = false;
      isPreviousSource = false;
      return {
        source: {
          color: 'edit',
          sourceName: 'Select Source',
          unique_sources: null,
        },
        children: [],
      };
    }
    // if the previous block was only Narrator
    else if (wasSingleSource && !endOfSpeechBubble) {
    // console.log('the previous block was only Narrator');
      if (
        !hasStartDifferentiator &&
        !hasEndDifferentiator &&
        !isCurrentBubble
      ) {
        const narratorSource = verseData.find(
          (s) => s.color === 'black',
        );
        isCurrentBubble = false;
        isPreviousSource = true;
        endOfSpeechBubble = false;
        wasSingleSource = false;
        return {
          source: narratorSource,
          children: [],
        };
      } else {
        const speakingSource = verseData.find(
          (s) => s.color !== 'black',
        );
        isCurrentBubble = true;
        endOfSpeechBubble = false;
        isPreviousSource = false;
        wasSingleSource = false;
        return {
          source: speakingSource,
          children: [],
        };
      }
    }
    // if it's a footnote at the end of a speechbubble
    else if (isFootnote && endOfSpeechBubble) {
    // console.log('a footnote at the end of a speechbubble');
      const speakingSource = verseData.find(
        (s) => s.color !== 'black',
      );
      isCurrentBubble = false;
      endOfSpeechBubble = false;
      isPreviousSource = false;
      return {
        source: speakingSource,
        children: [],
      };
    }
    // if it's the beginning or end of speechbubble
    else if (hasStartDifferentiator || hasEndDifferentiator) {
    // console.log('the beginning or end of speechbubble');
      const speakingSource = verseData.find(
        (s) => s.color !== 'black',
      );
      isCurrentBubble = hasEndDifferentiator ? false : true;
      endOfSpeechBubble = hasEndDifferentiator ? true : false;
      isPreviousSource = false;
      return {
        source: speakingSource,
        children: [],
      };
    }
    // if it's currently in a speechbubble
    else if (
      isCurrentBubble &&
      !hasStartDifferentiator &&
      !hasEndDifferentiator
    ) {
    // console.log('currently in a speechbubble');
      const speakingSource = verseData.find(
        (s) => s.color !== 'black',
      );
      isCurrentBubble = true;
      if (isPreviousSource) {
        const lastSourceBlock = slateDoc[slateDoc.length - 1];
        if (lastSourceBlock.source.color !== 'edit') {
          return {
            source: lastSourceBlock.source,
            children: [],
          };
        } else {
          const narratorSource = verseData.find(
            (s) => s.color === 'black',
          );
          isCurrentBubble = false;
          isPreviousSource = false;
          endOfSpeechBubble = false;
          return {
            source: narratorSource,
            children: [],
          };
        }
      }
      return {
        source: speakingSource,
        children: [],
      };
    }
    // if it's continuing previous source
    else if (
      !isCurrentBubble &&
      !hasStartDifferentiator &&
      !hasEndDifferentiator &&
      !endOfSpeechBubble &&
      slateDoc.length > 0
    ) {
    // console.log('continuing previous source');
      const lastSourceBlock = slateDoc[slateDoc.length - 1];
      isCurrentBubble = true;
      isPreviousSource = true;
      if (lastSourceBlock.source.color !== 'edit') {
        return {
          source: lastSourceBlock.source,
          children: [],
        };
      } else {
        const narratorSource = verseData.find(
          (s) => s.color === 'black',
        );
        isCurrentBubble = false;
        isPreviousSource = false;
        endOfSpeechBubble = false;
        return {
          source: narratorSource,
          children: [],
        };
      }
    }
    // if it's not continuing previous source
    else if (
      !isCurrentBubble &&
        !hasStartDifferentiator &&
        !hasEndDifferentiator &&
        (endOfSpeechBubble ||
        slateDoc.length === 0)
    ) {
    // console.log('not continuing previous source');
      const narratorSource = verseData.find(
        (s) => s.color === 'black',
      );
      isCurrentBubble = false;
      isPreviousSource = false;
      endOfSpeechBubble = false;
      return {
        source: narratorSource,
        children: [],
      };
    } else {
    // console.log('*** OTHER ***');
      isCurrentBubble = false;
      isPreviousSource = false;
      return {
        source: {
          color: 'edit',
          sourceName: 'Select Source',
          unique_sources: null,
        },
        children: [],
      };
    }
  }

  // if there are more than two sources in the verse
  else if (verseData.length > 2 || (!useDifferentiator && verseData.length > 1)) {
    wasSingleSource = false;
    isCurrentBubble = false;
    return {
      source: {
        color: 'edit',
        sourceName: 'Select Source',
        unique_sources: null,
      },
      children: [],
    };
  }
  // if there is just one source in this verse
  else {
    isCurrentBubble =
      verseData[0].color !== 'black' && !hasEndDifferentiator
        ? true
        : false;
    wasSingleSource = true;
    endOfSpeechBubble = hasEndDifferentiator ? true : false;
    return {
      source: verseData[0],
      children: [],
    };
  }
};

const createInlineObj = (pIndex, pTag, hasIndent, cIndex, type) => {
  // console.log(
  //   'createInlineObj',
  //   pIndex,
  //   pTag,
  //   hasIndent,
  //   cIndex,
  //   type,
  // );

  // if it's the first leaf in a 'prose' paragraph => indent
  if (cIndex === 0 && type === 'prose') {
    return {
      pIndex,
      start: true,
      tag: pTag,
      type,
      children: [],
    };
  }
  // if it's NOT a 'prose' paragraph && hasIndent => indent
  if (hasIndent && type !== 'prose') {
    return {
      pIndex,
      start: true,
      tag: pTag,
      type,
      children: [],
    };
  }
  // if it's NOT the first leaf in a 'prose' paragraph => indent
  return {
    pIndex,
    tag: pTag,
    type,
    children: [],
  };
};

const createTextObj = (text, tag, data) => {
  // the goal is to have an object which contains the TEXT,
  // any necessary STYLES (tag),
  // and necessary DATA

  if (tag) {
    return {
      ...{
        text: `${text}`,
        tag,
      },
      ...data,
    };
  } else {
    return {
      ...{
        text: `${text}`,
      },
      ...data,
    };
  }
};

const processEditorialInsert = (
  children,
  pIndex,
  book,
  chapter,
  versification,
  version,
) => {
  // console.log('[processEditorialInsert] children: ', children);

  let fullObj = {
    source: 'Editorial Insert',
    children: [
      {
        pIndex,
        tag: 'iex',
        type: 'editorialInsert',
        children: [],
      },
    ],
  };

  children.forEach((child) => {
    if (child.name === 'verse') {
      const verse = getVerseRef(child.attrs.number);
      if (verse) {

        currentVerse = verse;
      }
    }

    // get the ref array for tagging words
    const ref = getRef(book, chapter, currentVerse);
    //


    // Create the Text Content
    const texts = getTextObjs(
      child.text,
      child,
      ref,
      null,
      versification,
      version,
    );
    //
    texts.forEach((t) => fullObj.children[0].children.push(t));
  });
  slateDoc.push(fullObj);
  return;
};

const processTable = (
  rows,
  pIndex,
  book,
  chapter,
  versification,
  version,
) => {
  // console.log(rows);
  const tableObj = {
    tag: 'table',
    type: 'table',
    pIndex,
    children: [],
  };
  rows.forEach((row) => {
    const rowData = {
      tag: row.attrs.style,
      children: [],
    };
    row.items.forEach((cell) => {
      const cellData = {
        tag: cell.attrs.style,
        children: [],
      };
      if (cell.items.length === 0) {
        cellData.children.push({
          text: '',
        });
      }
      //
      cell.items.forEach((child) => {
        //
        // update the currentVerse every time a verse reference appears
        if (child.name === 'verse') {
          const verse = getVerseRef(child.attrs.number);
          if (verse) {
            currentVerse = verse;
          }
        }

        // get the ref array for tagging words
        const ref = getRef(book, chapter, currentVerse);
        //

        // stop processing if the child is not included in
        // the SourceView project (ex. cross-references)
        if (
          child.attrs &&
          child.attrs.style &&
          typesOfNonDataTags.indexOf(child.attrs.style) === -1 &&
          typesOfDataTags.indexOf(child.attrs.style) === -1
        ) {
          return;
        }

        const texts = getTextObjs(
          child.text,
          child,
          ref,
          null,
          versification,
          version,
        );
        texts.forEach((t) => cellData.children.push(t));
      });
      rowData.children.push(cellData);
    });
    tableObj.children.push(rowData);
  });
  const lastSourceBlock = slateDoc[slateDoc.length - 1];
  lastSourceBlock.children.push(tableObj);
};

const getVerseRef = (ref) => {
  const cleanRef = ref.replace(String.fromCharCode(8207), '');
  //
  // if (ref.indexOf(String.fromCharCode(8207)) !== -1) {
  //
  // }
  // if the ref is more than 1 verse
  if (cleanRef.search('-') !== -1) {
    const splitRefs = cleanRef.split('-');
    let ref1 = splitRefs[0];
    if (ref1.indexOf('.') !== -1) {
      ref1 = splitRefs[0].split('.')[2];
    }
    const ref2 = splitRefs[1];
    // place the first verse ref in the array
    const verseNums = [ref1];

    // if the second reference is a full reference (with book/chapter)
    if (ref2.indexOf('.') !== -1) {
      const finalRef = ref2.split('.')[2];
      for (let i = +ref1 + 1; i <= +finalRef; i++) {
        verseNums.push(`${i}`);
      }
    }
    //
    else {
      for (let i = +ref1 + 1; i <= +ref2; i++) {
        verseNums.push(`${i}`);
      }
    }

    currentVerse = verseNums;
    // return an array of all the verses
    return verseNums;
  }
  // if the ref is a single verse
  else {
    let finalRef = cleanRef;
    if (cleanRef.indexOf('.') !== -1) {
      finalRef = cleanRef.split('.')[2];
    }
    // return array of a single verse number
    return [finalRef];
  }
};

// This is the starting point for automating
// the Sourcification process
module.exports.automateSourcification = (
  JSONcontent,
  book,
  chapter,
  automationData,
  versification,
  version,
  bubbleDifferentiator = []
) => {

isCurrentBubble = false;
isPreviousSource = false;
endOfSpeechBubble = false;
wasSingleSource = false;


  let isPoetryParagraphBreak = false;
  let postSubtitleParagraphBreak = false;
  let previousParagraphType = '';
  let firstPoetryParagraphExists = false;
  // First go through the paragraphs within the chapter
  JSONcontent.forEach((paragraph, pIndex) => {
    // get the paragraph style
    const tag = paragraph.attrs.style || paragraph.name;
  // console.log('pTag', tag, paragraph)

    // TABLES
    if (tag && tag === 'table') {
      processTable(paragraph.items, pIndex, book, chapter, version);
      previousParagraphType = tag;
      return;
    }

    const getType = (tagType) => {
      if (typesOfParagraphs.indexOf(tagType) === -1) {
        return null;
      }
      if (tagType && tagType === 'li4') return 'prose';
      if (tagType && tagType.substring(0, 2) === 'li') return 'list';
      if (tagType && tagType === 'b') return 'break';
      const isProse = proseParagraphs.indexOf(tagType) !== -1;
      return isProse ? 'prose' : 'poetry';
    };

    const type = getType(tag);
    previousParagraphType =
      pIndex !== 0
        ? getType(JSONcontent[pIndex - 1].attrs.style)
        : '';

    if (type === 'break') {

      if (
        previousParagraphType &&
        previousParagraphType === 'poetry'
      ) {
        isPoetryParagraphBreak = true;
      }
    }
    if (typesOfParagraphs.indexOf(tag) === -1) {
      postSubtitleParagraphBreak = true;
    }
    //
    // skip over all non-biblical-text paragraphs

    if (book === 'Psa') {
      if (
        typesOfParagraphs.indexOf(paragraph.attrs.style) === -1 &&
        paragraph.attrs.style !== 'cl'
      ) {
        return;
      }
    } else {
      if (
        typesOfParagraphs.indexOf(tag) === -1 &&
        paragraph.name !== 'table'
      ) {
      // console.log(
        //   'paragraph not biblical text...right? see log below',
        //   paragraph,
        // );
        return;
      }
    }

    const hasIndent =
      // if it's poetry/list and follows a strophe break
      (type === 'poetry' && isPoetryParagraphBreak) ||
      // if it's not a subtitle or poetry, but after a subtitle
      (!!type && type !== 'poetry' && postSubtitleParagraphBreak) ||
      // if it's poetry/list and after subtitle and previous paragraph was poetry/list
      (type === 'poetry' &&
        postSubtitleParagraphBreak &&
        firstPoetryParagraphExists) ||
      tag === 'li4';

    if (hasIndent) {
      // console.log(
      //   'hasIndent',
      //   // if it's poetry/list and follows a strophe break
      //   type === 'poetry' && isPoetryParagraphBreak,
      //   // if it's not a subtitle or poetry, but after a subtitle
      //   !!type && type !== 'poetry' && postSubtitleParagraphBreak,
      //   // if it's poetry/list and after subtitle and previous paragraph was poetry/list
      //   type === 'poetry' &&
      //     postSubtitleParagraphBreak &&
      //     firstPoetryParagraphExists,
      //   tag === 'li4',
      // );
    }
    if (type === 'poetry' && !firstPoetryParagraphExists) {
      firstPoetryParagraphExists = true;
    }
    if (!!type && type !== 'poetry' && firstPoetryParagraphExists) {
      firstPoetryParagraphExists = false;
    }

    // EDITORIAL INSERT
    if (tag === 'iex' && paragraph.items.length > 0) {
      processEditorialInsert(
        paragraph.items,
        pIndex,
        book,
        chapter,
        versification,
        version,
      );
      return;
    }
    // ----------------------------------- //
    // *** process the paragraph items *** //
    // ----------------------------------- //

    // get the children of elements within the paragraph
    const children = paragraph.items;

    if (children.length === 0) {
      const sourceObj = createSourceObj(
        chapter,
        currentVerse,
        automationData,
        versification[
          `${DJHBooks[book].YV}-${chapter}-${currentVerse}`
        ],
        bubbleDifferentiator.length > 0
      );
      sourceObj.children.push({
        tag,
        type,
        children: [
          {
            ref: getRef(book, chapter, currentVerse),
            text: ' ',
          },
        ],
      });
      const lastSourceBlock = slateDoc[slateDoc.length - 1];
      // if it's the same source as the previous child
      if (
        lastSourceBlock &&
        matchSourceData(sourceObj.source, lastSourceBlock.source)
      ) {
        lastSourceBlock.children.push(sourceObj.children[0]);
      } else {
        slateDoc.push(sourceObj);
      }
    }

    children.forEach((child, cIndex) => {
      // update the currentVerse every time a verse reference appears
      if (child.name === 'verse') {
        const verse = getVerseRef(child.attrs.number);
        if (verse) {
          currentVerse = verse;
        }
      }

      if (book !== 'Psa' && currentVerse[0] === '0') {
        currentVerse = ['1'];
      }

      // get the ref array for tagging words
      const ref = getRef(book, chapter, currentVerse);
      //

      // stop processing if the child is not included in
      // the SourceView project (ex. cross-references)
      if (child.name === 'note' && child.attrs.style !== 'f') {
        return;
      }
      if (child.name === 'note') {
      // console.log("FOOTNOTE *** ", child)
      }

    // console.log("child", child)
      // This is where we start forming the three levels of content for each item:

      let childTextLeaves = []
      let verseData = [];
      currentVerse.forEach((v, index) => {
        const newRef =
          versification &&
          versification[
            `${DJHBooks[book].YV}-${chapter}-${currentVerse}`
          ]
            ? versification[
                `${DJHBooks[book].YV}-${chapter}-${currentVerse}`
              ]
            : `book-${chapter}-${v}`;
      // console.log('newRef', newRef);
        const autoData =
          automationData[
            `${newRef.split('-')[1].replace(/\D/g, '')}`
          ][`${newRef.split('-')[2].replace(/\D/g, '')}`];
      // console.log('autoData', autoData);
        //
        if (index === 0) {
          verseData = autoData || [];
          return;
        }
        if (!autoData) {
          // alert(
          //   `There is no automation data for verse ${v}. Please notify a member of the SourceView Bible team or email: sourceviewteam@gmail.com`,
          // );
          return;
        }
        // process sourceData for this verse
        autoData.forEach((vS) => {
          let exists = false;
          // check if the source already exists in verseData
          verseData.forEach((s) => {
            // if the source already exists, skip the rest of the checks
            if (exists) {
              return;
            }

            if (isEqual(s, vS)) {
              exists = true;
            }
            // if the source already exists, return it
            if (exists) {
              return;
            }
            // if it's a new source, add it to verseData
            else {
              verseData.push(vS);
            }
          });
        });
      });

      let nextChildStartBubble = false;
      // If only two sources in verse && one is Narrator
      if (!!verseData && verseData.length === 2 && verseData.find(source => source.color === 'black')) {
        let childText = ""
        if (child.type === 'text') {
          childText = child.text;
        }
        if (child.name === 'verse') {
          childText = child.attrs.number;
          const nextChild = children[cIndex + 1];
          nextChildStartBubble = nextChild && nextChild.text &&
            nextChild.text[0] === bubbleDifferentiator[0];
        }
        if (child.name === 'note') {
          childText = "*";
        }
        if (child.name === 'char') {
          childText = child.items.map(i => i.text).join("");
        }
        const textLeaves = []
        const startSplits = childText.split(bubbleDifferentiator[0]);
        startSplits.forEach((t, index) => {
          let text = t;
          if (index > 0) {
            text = `${bubbleDifferentiator[0] ? bubbleDifferentiator[0] : ""}${t}`;
          }
          const hasEndDifferentiator = !!new RegExp(
            bubbleDifferentiator[1]
          ).test(text);

          if (!hasEndDifferentiator) {
            textLeaves.push(text);
            return
          }
          const endTexts = text.split(bubbleDifferentiator[1]);
          endTexts.forEach((t, index) => {
            let endText = t;
            if (index < endTexts.length -1 || endTexts.length === 1) {
              endText = `${t}${
                bubbleDifferentiator[1] ? bubbleDifferentiator[1] : ''
              }`;
            }
            if (endText !== "") {
              textLeaves.push(endText)
            }
          })
        })
        childTextLeaves = textLeaves;
      } else {
        childTextLeaves = [child.text]
      }

      childTextLeaves.forEach((leafText, TLIndex) => {
        if (leafText === "") return
        const hasStartDifferentiator = nextChildStartBubble || !!new RegExp(
          bubbleDifferentiator[0]
        ).test(leafText);
        const hasEndDifferentiator = !!new RegExp(
          bubbleDifferentiator[1]
        ).test(leafText);

      // console.log("createSourceObj => ", `[${leafText}]`,child)
        // Level #1: Source Block
        const sourceObj = createSourceObj(
          chapter,
          currentVerse,
          automationData,
          versification[
            `${DJHBooks[book].YV}-${chapter}-${currentVerse}`
          ],
          bubbleDifferentiator.length > 0,
          hasStartDifferentiator,
          hasEndDifferentiator,
          leafText === '*',
        );

        // Level #2: Paragraph Block
        const inlineObj = createInlineObj(
          pIndex,
          tag,
          hasIndent || (slateDoc.length === 0 && +chapter !== 1),
          cIndex,
          type,
        );

        // Level #3: Text Objects
        const texts = getTextObjs(
          leafText,
          child,
          ref,
          null,
          versification,
          version,
        );

        // put the Text Content into the Paragraph Block
        inlineObj.children = texts;
        // put the Paragraph Content into the Source Block
        sourceObj.children.push(inlineObj);
        // Everything from this child will be entered into
        // this "fullObj"
        let fullObj = sourceObj;
        //

        // SPECIAL CASE FOR PSALMS
        // NEED TO INCLUDE "PSALM #" as title
        if (tag === 'cl') {
          //
          fullObj = {
            source: 'Psalm Title',
            children: [
              {
                pIndex,
                tag,
                children: texts,
              },
            ],
          };
        }

        // if it's the first source in the chapter
        if (slateDoc.length === 0) {
          // create the chapter number
          // (which isn't included in the DBL content)
          if (book !== 'Psa' && tag !== 'cl') {
            const chapterObj = createTextObj(chapter, ['c'], {
              ref:
                currentVerse.length === 1
                  ? [
                      `${book}-${chapter}-${
                        currentVerse === ['0'] ? 1 : currentVerse[0]
                      }`,
                    ]
                  : currentVerse.map((v) => `${book}-${chapter}-${v}`),
            });
            // insert the chapter number into the first text position
            fullObj.children[0].children.unshift(chapterObj);
          }

          // add this as the first block in the chapter JSON file
          slateDoc.push(fullObj);
          return;
        }
        //
        //
        if (!fullObj) return;
        // This gets the last Source Block added
        const lastSourceBlock = slateDoc[slateDoc.length - 1];
        // if it's the same source as the previous child
        if (matchSourceData(fullObj.source, lastSourceBlock.source)) {
          const lastInline =
            lastSourceBlock.children[
              lastSourceBlock.children.length - 1
            ];

          // if it's the same paragraph
          if (
            fullObj.children[0].tag === lastInline.tag &&
            fullObj.children[0].pIndex === lastInline.pIndex
          ) {
            fullObj.children[0].children.forEach((text) => {
              lastInline.children.push(text);
            });
            // lastInline.children.push(fullObj.children[0].children[0]);
          }

          // if it's not the same paragraph
          // add the new paragraph
          else {
            lastSourceBlock.children.push(fullObj.children[0]);
          }
        }

        // if it's a different source, add the new Source Block
        else {
          slateDoc.push(fullObj);

          return;
        }

      })
    });
    if (hasIndent) {
      isPoetryParagraphBreak = false;
      postSubtitleParagraphBreak = false;
    }
    if (
      tag[0] === 'q' &&
      postSubtitleParagraphBreak &&
      firstPoetryParagraphExists
    ) {
      postSubtitleParagraphBreak = false;
    }
  });
  // save (assign) the created document to a variable that won't change
  const fullSlateDoc = Object.assign(slateDoc);

  // reset the created document to an empty array for
  // the next time you automate
  slateDoc = [];
  // reset the current verse to an empty string
  currentVerse = ['0'];

  // return the created chapter from the automation file
  // and the DBL content
// console.log('[fullSlateDoc]', fullSlateDoc);
  const verifiedDoc = verifyContent(fullSlateDoc);
// console.log('[verifiedDoc]', verifiedDoc);
  return verifiedDoc;
};
