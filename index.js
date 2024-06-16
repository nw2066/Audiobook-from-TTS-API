const { client, synthesizeSpeech, getVoices } = require('./googleTTS.js');
const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const {
    getCharsOfPDF,
    getChapterPageLocations,
    splitPDF,
    extractTextFromPDF,
    getInputPath
} = require('./pdf_processor.js');

const getMP3FromPage = async (pagePath,location=false) => {
    const text = await extractTextFromPDF(pagePath);
    let mp3Path;
    if (location){
        mp3Path = path.join(location,`${path.basename(pagePath, '.pdf')}.mp3`);
    } else{
        mp3Path = path.join(path.dirname(pagePath),`${path.basename(pagePath, '.pdf')}.mp3`);
    }
    await synthesizeSpeech(text,mp3Path);
    return mp3Path;
}
const getMP3Pages= async (sourcePath, startPage,endPage=startPage,outputPath=path.join("temp",path.basename(sourcePath,'.pdf'),"pages")) => {
    
    //create outputPath if it doesnt already exist
    if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const pagesToGetFilePath = await splitPDF(sourcePath, startPage, endPage);

    const dataBuffer = fs.readFileSync(pagesToGetFilePath);
    const sourcePDF = await PDFDocument.load(dataBuffer);

    // Split the PDF file into a temporary file for each page
    // Generate mp3 for each page

    for (let i = 1; i <= sourcePDF.getPageCount(); i++) {
        
        let pagePath = await splitPDF(pagesToGetFilePath,i)    

        //generate mp3 for each page
        await getMP3FromPage(pagePath,outputPath);

        // Delete the temporary file
        fs.unlinkSync(pagePath);

    
    }

}
const testCode = async () => {
    
// let pageplace = await splitPDF( getInputPath(), 1)
// console.group(pageplace);
// console.log(await getMP3FromPage(pageplace,"pages"))

    getMP3Pages(getInputPath(),1,3)

}

testCode()
//console.log(getMP3FromPage(pageplace))