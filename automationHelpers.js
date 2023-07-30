const embeddedDocs = require('./embeddedDocs.json');
const BookListDBL = require('./BookList.json');
const BookListDJH = require("./BookList(DJH).json");

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

const isEmbeddedDoc = (refArray, versification) => {
  if (refArray.length === 1) {
    let isED = false;
    refArray.forEach((ref) => {
      const curRefSplit = ref.split('-');
      const newRef =
        versification &&
        versification[
          `${BookListDJH[curRefSplit[0]].YV}-${curRefSplit[1]}-${
            curRefSplit[2]
          }`
        ]
          ? versification[
              `${BookListDJH[curRefSplit[0]].YV}-${curRefSplit[1]}-${
                curRefSplit[2]
              }`
            ]
          : ref;
      const split = newRef.split('-');
      const fullRef = `${BookListDBL[split[0]] || split[0]}-${
        split[1]
      }-${split[2]}`;
      // const refSplit = ref.split('-');
      if (
        embeddedDocsBooks.indexOf(
          BookListDBL[split[0]] || split[0],
        ) !== -1
      ) {
        isED = true;
      }
      if (embeddedDocs.complete.indexOf(fullRef) !== -1) {
        isED = true;
      }
      if (embeddedDocs.partial.indexOf(fullRef) !== -1) {
      // console.log('partial');
        isED = 'partial';
      }
    });
    return isED || null;
  } else {
    let isED = [];
    refArray.forEach((ref) => {
      const refSplit = ref.split('-');
      if (embeddedDocsBooks.indexOf(refSplit[0]) !== -1) {
        isED.push(true);
      } else if (embeddedDocs.complete.indexOf(ref) !== -1) {
        isED.push(true);
        return;
      } else if (embeddedDocs.partial.indexOf(ref) !== -1) {
        isED.push('partial');
        return;
      } else {
        isED.push(false);
      }
    });
    const isTrue =
      isED.filter((el) => el === true).length === refArray.length;
    const isFalse =
      isED.filter((el) => el === false).length === refArray.length;
    if (isTrue) {
      return true;
    }
    if (isFalse) {
      return null;
    }
    return 'partial';
  }
};

module.exports.getTextObjs = (
  leafText,
  child,
  ref,
  styles,
  versification,
  version,
) => {
// console.log('getTextObjs: leafText => ', leafText);
  const isEmbeddedDocTag = isEmbeddedDoc(ref, versification);
  let arrayOfTexts = [];
  // process the TEXT obj
  if (child.type === 'text') {
    const textObj = createTextObj(
      leafText,
      child,
      ref,
      styles,
      isEmbeddedDocTag,
    );
    arrayOfTexts.push(textObj);
    // }
  }

  // process the TAG obj
  else {
    if (
      child.name === 'note' ||
      (child.name === 'char' &&
        child.attrs &&
        child.attrs.style === 'rq')
    ) {
      const noteData = getNoteData(child, ref);
      arrayOfTexts.push({
        note: { type: 'f', children: noteData },
        embeddedDoc: isEmbeddedDocTag,
        text: '*',
        ref,
      });
    } else {
      const taggedTexts = getTaggedTextObj(
        child,
        ref,
        [],
        isEmbeddedDocTag,
      );
      taggedTexts.forEach((t) => arrayOfTexts.push(t));
    }
  }

  // check that all text objects have strings
  arrayOfTexts.forEach((textObj) => {
    // console.log(typeof textObj.text, textObj);
    if (
      typeof textObj.text !== 'string' ||
      textObj.text.length === 0
    ) {
    // console.log(`NO TEXT IN ${ref.toString()}`, textObj);
    }
  });

  // Return an array of text objects to be inserted into
  // Inline Elements (Paragraphs & Tables)
  return arrayOfTexts;
};
module.exports.getNoteTextObjs = (
  child,
  ref,
  styles,
  versification,
  version
) => {
// console.log("*** getNoteTextObjs ***", child, ref);
  const isEmbeddedDocTag = isEmbeddedDoc(ref, versification);
  let arrayOfTexts = [];
  // process the TEXT obj
  if (child.type === "text") {
    // const hasJPNFootnote =
    //   version === `jpn-JCB` &&
    //   child.text.indexOf('\uFF08') !== -1 &&
    //   child.text.indexOf('\uFF09') !== -1;
    // if (hasJPNFootnote) {
    //   // if the entire string is a footnote
    //   if (
    //     child.text[0] === '\uFF08' &&
    //     child.text[child.text.length - 1] === '\uFF09'
    //   ) {
    //     const noteData = getNoteData(child, ref);
    //     arrayOfTexts.push({
    //       note: { type: 'f', children: noteData },
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: '*',
    //       ref,
    //     });
    //   }
    //   // if the string starts with a footnote
    //   else if (child.text[0] === '\uFF08') {
    //     const splitText1 = child.text.split('\uFF09');
    //     const footnoteText = splitText1[0];
    //     arrayOfTexts.push({
    //       note: {
    //         type: 'f',
    //         children: [{ text: footnoteText, tag: ['ft'], ref }],
    //       },
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: '*',
    //       ref,
    //     });
    //     const regularText = splitText1[1];
    //     arrayOfTexts.push({
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: regularText,
    //       ref,
    //     });
    //   }
    //   // if the string ends with a footnote
    //   else if (child.text[child.text.length - 1] === '\uFF09') {
    //     const splitText1 = child.text.split('\uFF08');
    //     const regularText = splitText1[0];
    //     arrayOfTexts.push({
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: regularText,
    //       ref,
    //     });
    //     const footnoteText = splitText1[1];
    //     arrayOfTexts.push({
    //       note: {
    //         type: 'f',
    //         children: [{ text: footnoteText, tag: ['ft'], ref }],
    //       },
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: '*',
    //       ref,
    //     });
    //   }
    //   // if the footnote is in the middle of the text string
    //   else {
    //     const splitText1 = child.text.split('\uFF08');
    //     const regularText1 = splitText1[0];
    //     arrayOfTexts.push({
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: regularText1,
    //       ref,
    //     });
    //     const splitText2 = splitText1[1].split('\uFF09');
    //     const footnoteText = splitText2[0];
    //     arrayOfTexts.push({
    //       note: {
    //         type: 'f',
    //         children: [{ text: footnoteText, tag: ['ft'], ref }],
    //       },
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: '*',
    //       ref,
    //     });
    //     const regularText2 = splitText2[1];
    //     arrayOfTexts.push({
    //       embeddedDoc: isEmbeddedDocTag,
    //       text: regularText2,
    //       ref,
    //     });
    //   }
    // } else {
    const textObj = createTextObj(
      child.text,
      child,
      ref,
      styles,
      isEmbeddedDocTag
    );
    arrayOfTexts.push(textObj);
    // }
  }

  // process the TAG obj
  else {
    if (
      child.name === "note" ||
      (child.name === "char" && child.attrs && child.attrs.style === "rq")
    ) {
      const noteData = getNoteData(child, ref);
      arrayOfTexts.push({
        note: { type: "f", children: noteData },
        embeddedDoc: isEmbeddedDocTag,
        text: "*",
        ref,
      });
    } else {
      const taggedTexts = getTaggedTextObj(child, ref, [], isEmbeddedDocTag);
      taggedTexts.forEach((t) => arrayOfTexts.push(t));
    }
  }

  // check that all text objects have strings
  arrayOfTexts.forEach((textObj) => {
    // console.log(typeof textObj.text, textObj);
    if (typeof textObj.text !== "string" || textObj.text.length === 0) {
    // console.log(`NO TEXT IN ${ref.toString()}`, textObj);
    }
  });

  // Return an array of text objects to be inserted into
  // Inline Elements (Paragraphs & Tables)
  return arrayOfTexts;
};

const getTaggedTextObj = (child, ref, styles, isEmbeddedDocTag) => {
  let arrayOfTexts = [];
  const textStyles = [];
  const childStyle = child.attrs ? child.attrs.style : null;
  if (childStyle && childStyle !== 'wj') {
    textStyles.push(childStyle);
  }
  const uniqueRef = child.name === 'ref' ? child.attrs.id : null;
  // console.log('[helper] child:', child);
  child.items.forEach((item) => {
    if (item.type === 'text') {
      // console.log('[helper] getTaggedText text item:', item);
      const itemText = createTextObj(
        item.text,
        item,
        uniqueRef || ref,
        styles ? [...styles, ...textStyles] : textStyles,
        isEmbeddedDocTag,
      );
      arrayOfTexts.push(itemText);
    } else {
      // console.log('[helper] getTaggedText tagged item:', item);
      arrayOfTexts = [
        ...arrayOfTexts,
        ...getTaggedTextObj(item, ref, textStyles, isEmbeddedDocTag),
      ];
    }
  });

  return arrayOfTexts;
};

const createTextObj = (
  leafText,
  child,
  ref,
  styles,
  isEmbeddedDocTag,
) => {
  // console.log('[helper] createTextObj child:', child);
// console.log('createTextObj', ref)
// console.log('createTextObj => child', child)
// console.log('createTextObj => leafText', leafText)
  return {
    tag: styles && styles.length > 0 ? styles : null,
    embeddedDoc: isEmbeddedDocTag,
    ref: ref ? ref : null,
    text: leafText || child.text,
  };
};

const getNoteData = (child, ref) => {
  const { attrs } = child;
  let isRQ = false;
  if (attrs && attrs.style === 'rq') {
    isRQ = true;
  }
  let arrayOfNoteTexts = [];
  child.items.forEach((c) => {
    if (isRQ) {
      if (c.name === 'ref' && c.items) {
        c.items.forEach((i) => {
          const texts = getNoteTextObjs(c, ref);
          texts.forEach((t) => arrayOfNoteTexts.push(t));
        });
      }
    } else {
      const texts = getNoteTextObjs(c, ref);
      texts.forEach((t) => arrayOfNoteTexts.push(t));
    }
  });
  return arrayOfNoteTexts;
};

module.exports.getRef = (book, chapter, verses) => {
  if (verses.length === 1) {
    return [`${book}-${chapter}-${verses === ["0"] ? 1 : verses[0]}`];
  } else {
    return verses.map((v) => `${book}-${chapter}-${v}`);
  }
};
