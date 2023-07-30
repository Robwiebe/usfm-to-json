const isEqual = require('lodash.isequal');

module.exports.verifyContent = (slateDoc) => {
// console.log('verifyContent Full Document', slateDoc);
  const newDoc = [];
  slateDoc.forEach((block, bIndex) => {
    const newBlock = {
      source: block.source,
      children: [],
    };
    block.children.forEach((paragraph, index) => {
      if (!paragraph.children || paragraph.children.length === 0) {
      // console.log('verifyContent error', [bIndex, index]);
      }
      // if it's the first paragraph in the block
      if (index === 0) {
        const lastBlock =
          newDoc.length > 0 ? newDoc[newDoc.length - 1] : null;
        if (lastBlock) {
        // console.log(
          //   'lastBlock && isEqual(lastBlock.source, block.source)',
          //   lastBlock.source,
          //   block.source,
          //   lastBlock && isEqual(lastBlock.source, block.source),
          // );
        }
        if (lastBlock && isEqual(lastBlock.source, block.source)) {
          const { pIndex } = paragraph;
        // console.log('current pIndex:', pIndex);
          const prevParagraph =
            newBlock.children.length > 0
              ? newBlock.children[newBlock.children.length - 1]
              : null;
        // console.log('prevParagraph pIndex:', prevParagraph.pIndex);
          if (prevParagraph && prevParagraph.pIndex === pIndex) {
            paragraph.children.forEach((leaf) => {
              newBlock.children[
                newBlock.children.length - 1
              ].children.push(leaf);
            });
            return;
          }
          newBlock.children.push(paragraph);
          return
        }
      }
    // console.log('newDoc', newDoc, bIndex, index);
      newBlock.children.push(paragraph);
      paragraph.children.forEach((leaf, lIndex) => {
        if (!leaf.text) {
        // console.log('verifyContent error', [bIndex, index, lIndex]);
        }
      });
    });
    newDoc.push(newBlock);
  });
  return newDoc;
};
