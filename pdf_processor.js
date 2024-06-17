// DOESNT WORK-- ADD PDF SnPLITTER FOR INDIVIDUAL PAGES

const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

/**
 * Splits a PDF file from a given source path based on specified start and end pages.
 *
 * @param {string} sourcePath - The path of the source PDF file.
 * @param {number} startPage - The starting page number for splitting.
 * @param {number} [endPage=startPage] - The ending page number for splitting. Defaults to startPage if not provided.
 * @param {string} [outputPath='temp'] - The path where the split PDF will be saved.
 * @param {boolean} [includePaths=false] - Flag to include additional paths in the output filename.
 * @return {string} The filename of the split PDF.
 */
async function splitPDF(sourcePath, startPage,endPage=startPage,outputPath='temp',  includePaths=false) {
    const dataBuffer = fs.readFileSync(sourcePath);
    const sourcePDF = await PDFDocument.load(dataBuffer);

    if (startPage > sourcePDF.getPageCount()) {
        throw new Error(`Start page ${startPage} is greater than the total number of pages in the PDF.`);
    } else if (startPage <= 0) {
        throw new Error(`Start page ${startPage} must be greater than 0.`);
    }

    if (endPage > sourcePDF.getPageCount()) {
        console.log(`End page ${endPage} is greater than the total number of pages in the PDF. Setting end page to ${sourcePDF.getPageCount()}.`);
        endPage = sourcePDF.getPageCount();
    } else if (endPage === sourcePDF.getPageCount()) {
        console.log(`end of pdf is reached`)
    }

    const createPDFPage = async (pdfDoc, sourcePdf, pageIndex) => {
        const [newPage] = await pdfDoc.copyPages(sourcePdf, [pageIndex]);
        pdfDoc.addPage(newPage);
    };

    const newPDF = await PDFDocument.create();
    for (let i = startPage; i <= endPage && i <= sourcePDF.getPageCount(); i++) {
        await createPDFPage(newPDF, sourcePDF, i - 1);
    }
    const pdfBytes = await newPDF.save();

    const outputFilename = `${outputPath + "\\" + (includePaths ? "/" + path.basename(sourcePath, '.pdf') +_pg : "" ) + startPage + ( startPage !== endPage ? '-' + endPage : '' )}.pdf`;
    fs.writeFileSync(outputFilename, pdfBytes);
    //console.log(`Pages ${startPage}${startPage !== endPage ? '-' + endPage : ''} saved successfully.`);
    return outputFilename;

}

/**
 * Retrieves the path of the first PDF file found in the specified input location.
 *
 * @param {string} [inputLocation='input'] - The directory to search for PDF files. Defaults to 'input'.
 * @return {string} The path of the first PDF file found.
 * @throws {Error} If no PDF files are found in the input location.
 */
function getInputPath(inputLocation = 'input') {
    let files = fs.readdirSync(inputLocation);
    let pdfFiles = files.filter(file => path.extname(file) === '.pdf');
    if (pdfFiles.length === 0) {
        throw new Error(`No PDF files found in ${inputLocation} folder.`);
    }
    if (pdfFiles.length > 1) {
        console.log(`Multiple PDF files found in ${inputLocation} folder. Using the first one: ${pdfFiles[0]}`);
    }
    return `${inputLocation}\\${pdfFiles[0]}`;
}

/**
 * Asynchronously extracts text from a PDF file.
 *
 * @param {string} filePath - The path to the PDF file.
 * @return {Promise<string>} A Promise that resolves to the extracted text from the PDF.
 * @throws {Error} If there is an error reading the PDF file or extracting the text.
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    // Extracting text from the PDF
    const data = await pdf(dataBuffer);
    const text = data.text;
    return(text)
}

/**
 * Retrieves the page numbers of chapters from a PDF file.
 *
 * @param {string} filePath - The path to the PDF file.
 * @param {RegExp} [chapterStartRegex=/^\n\n\d+/] - The regular expression used to identify the start of a chapter.
 * @return {Promise<void>} A Promise that resolves when the page numbers of chapters are retrieved and saved to 'chapters.csv'.
 * @throws {Error} If there is an error reading the PDF file, extracting the text, or deleting a temporary file.
 */
async function getChapterPageLocations(filePath, chapterStartRegex = /^\n\n\d+/) {
    const dataBuffer = fs.readFileSync(filePath);
    const sourcePDF = await PDFDocument.load(dataBuffer);

    let chapterStarts = [];

    for (let i = 1; i <= sourcePDF.getPageCount(); i++) {
        let tempPath = await splitPDF(filePath, i); // Assuming splitPDF is implemented elsewhere

        const text = await extractTextFromPDF(tempPath); // Assuming extractTextFromPDF is implemented elsewhere

        if (chapterStartRegex.test(text)) {
            chapterStarts.push(i);
        }

        fs.unlinkSync(tempPath);
    }

    // Add the last page as the end of the last chapter
    chapterStarts.push(sourcePDF.getPageCount() + 1);

    let chapters = {};
    for (let i = 0; i < chapterStarts.length - 1; i++) {
        let chapterName = `chapter${i+1}`;
        chapters[chapterName] = [];

        for (let j = chapterStarts[i]; j < chapterStarts[i+1]; j++) {
            chapters[chapterName].push(`${j}.mp3`);
        }
    }

    // Save the chapters as a JSON file
    fs.writeFileSync('chapters.json', JSON.stringify(chapters, null, 2));

    console.log(chapters);
}

/**
 * Retrieves the total number of characters in a PDF file.
 *
 * @param {string} filePath - The path to the PDF file.
 * @return {Promise<number>} A Promise that resolves to the total number of characters in the PDF.
 */
async function getCharsOfPDF(filePath) {
    extractTextFromPDF(filePath).then((text) => {
        console.log(text.length);
    })
}


//getCharsOfPDF(getInputPath()).catch(err => console.error('Error getting total number of characters:', err));

getChapterPageLocations(getInputPath()).catch(err => console.error('Error getting chapter page locations:', err));

// splitPDF(getInputPath(),72).catch(err => console.error('Error splitting PDF:', err));

// extractTextFromPDF("temp\\72.pdf")
//     .then(text => console.log(text))
//     .catch(err => console.error('Error extracting text:', err)); 


module.exports = {
    getInputPath,
    getCharsOfPDF,
    getChapterPageLocations,
    splitPDF,
    extractTextFromPDF
}
