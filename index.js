const { client, synthesizeSpeech, getVoices } = require('./googleTTS.js');
path = require('path');

const {
    getCharsOfPDF,
    getChapterPageLocations,
    splitPDF,
    extractTextFromPDF,
    getInputPath
} = require('./pdf_processor.js');

const getMP3FromPage = async (pagePath,location="") => {
    const text = await extractTextFromPDF(pagePath);
    const mp3Path = path.join(path.dirname(pagePath),location, `${path.basename(pagePath, '.pdf')}.mp3`);
    await synthesizeSpeech(text,mp3Path);
    return mp3Path;
}

const testCode = async () => {
    
let pageplace = await splitPDF( getInputPath(), 1)
console.group(pageplace);
console.log(await getMP3FromPage(pageplace,"pages"))

}

testCode()
//console.log(getMP3FromPage(pageplace))