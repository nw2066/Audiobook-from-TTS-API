const { client, synthesizeSpeech, getVoices } = require('./googleTTS.js');

const {
    getCharsOfPDF,
    getChapterPageLocations,
    splitPDF,
    extractTextFromPDF,
    getInputPath
} = require('./pdf_processor.js');

getCharsOfPDF(getInputPath());