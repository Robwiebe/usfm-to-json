const usfm = require('usfm-js');
const fs = require('fs');
const repo = process.argv[2];
const versionCodes = {
	'ckbOKS20': {
		versionCode: 'ckbOKS',
		fileSuffix: 'ckbOKS20',
	},
	'swONEN14': {
		versionCode: 'swONEN',
		fileSuffix: 'swONEN14',
	},
	'hinIRV20181127': {
		versionCode: 'hinIRV',
		fileSuffix: 'HIRVB',
	},
	'vi-vcb15': {
		versionCode: 'vi-vcb',
		fileSuffix: 'vi-vcb15',
	},
	'yoOBYO17': {
		versionCode: 'yoOBYO',
		fileSuffix: 'yoOBYO17',
	},
	'twkONA20': {
		versionCode: 'twkONA',
		fileSuffix: 'twkONA20',
	},
	'ar_nav': {
		versionCode: 'ar_nav',
		fileSuffix: 'ar_nav',
	},
	'twiONA20': {
		versionCode: 'twiONA',
		fileSuffix: 'twiONA20',
	},
	'luoONL20': {
		versionCode: 'luoONL',
		fileSuffix: 'luoONL20',
	},
	'bsb_usfm': {
		versionCode: 'bsb',
		fileSuffix: 'BSB',
	},
	'ru_rob': {
		versionCode: 'ROB',
		fileSuffix: '',
	}
};
const versionCode = versionCodes[ repo ]['versionCode'];
const fileSuffix = versionCodes[ repo ]['fileSuffix'];
const finalData = { 'books': {} };

const headersPath = './' + repo + '/A0FRT' + repo + '.SFM';
if ( fs.existsSync( headersPath ) ) {
	const versionUSFM = fs.readFileSync( headersPath, {encoding:'utf8', flag:'r'} );
	const versionJSON = usfm.toJSON( versionUSFM );
	const headers = versionJSON.headers.filter( header => header.tag === 'pc' );
	let versionName = headers.map( header => header.content )[0];
	if ( ! versionName ) {
		versionName = headers.map( header => header.text )[0];
	}
	finalData.versionName = versionName;
	console.log( versionName );
}
finalData.version = versionCode;

const otBooksShortName = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL'];
const ntBooksShortName = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
const allBooksShortName = otBooksShortName.concat( [ ' ' ], ntBooksShortName );

const otBooksLongName = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','I Samuel','II Samuel','I Kings','II Kings','I Chronicles','II Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'];
const ntBooksLongName = ['Matthew','Mark','Luke','John','Acts','Romans','I Corinthians','II Corinthians','Galatians','Ephesians','Philippians','Colossians','I Thessalonians','II Thessalonians','I Timothy','II Timothy','Titus','Philemon','Hebrews','James','I Peter','II Peter','I John','II John','III John','Jude','Revelation of John'];
const allBooksLongName = otBooksLongName.concat( [ ' ' ], ntBooksLongName );

const otBooksChapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4];
const ntBooksChapters = [28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const allBooksChapters = otBooksChapters.concat( [ ' ' ], ntBooksChapters );

const getVerseText = ( verseObjects ) => {
	if ( verseObjects.length === 1 ) {
		return verseObjects.filter( verseObject => {
			return ( verseObject.type === 'text' || verseObject.type === 'quote' || verseObject.type === 'paragraph' || verseObject.tag === 'wj' || verseObject.tag.indexOf( 'li' ) === 0 );
		} ).map( verseObject => {
			if ( verseObject.text ) {
				return verseObject.text;
			}
			if ( verseObject.content ) {
				return verseObject.content;
			}
		} ).join( ' ' );
	}

	verseObjects.forEach( verseObject => {
		return getVerseText( verseObject );
	} );
}

allBooksShortName.forEach( ( bookName, index ) => {
	const bookNumber = ("0" + ( index + 1 )).slice(-2);
	let filePath = './' + repo + '/' + bookNumber + bookName + fileSuffix + '.SFM';
	if ( ! fs.existsSync( filePath ) ) {
		filePath = './' + repo + '/' + bookNumber + bookName + fileSuffix + '.usfm';
	}

	if ( ! fs.existsSync( filePath ) ) {
		filePath = './' + repo + '/' + bookNumber + '-' + bookName + fileSuffix + '.usfm';
	}

	if ( ! fs.existsSync( filePath ) ) {
		console.log( filePath + ' missing' );
		return;
	}

	const bookNameLong = allBooksLongName[ index ];
	finalData.books[ bookNameLong ] = [];
	const bookUSFM = fs.readFileSync( filePath, {encoding:'utf8', flag:'r'} );
	const bookJSON = usfm.toJSON( bookUSFM );

	for ( chapter=1; chapter <= allBooksChapters[ index ]; chapter++ ) {
		finalData.books[ bookNameLong ][ chapter - 1 ] = [];
		const verseArray = Object.keys( bookJSON.chapters[ chapter ] ).slice( 0, -1 ); // slice removes front
		for ( verse = 1 ; verse <= verseArray.length ; verse++ ) {
			const verseData = bookJSON.chapters[ chapter ][ verse ];
			if ( verseData && verseData.verseObjects ) {
				const verseText = getVerseText( verseData.verseObjects );
				finalData.books[ bookNameLong ][ chapter - 1 ][ verse - 1 ] = verseText;
			}
		}
	}
} );

fs.writeFileSync( versionCode + '.json', JSON.stringify(finalData));
