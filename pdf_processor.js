// DOESNT WORK-- ADD PDF SnPLITTER FOR INDIVIDUAL PAGES

const fs = require('fs');
const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
/**
 * Splits a PDF into separate files based on a given page range or a single page.
 * @param {string} sourcePath - The file path of the source PDF.
 * @param {array | number} pages - The pages to extract. Can be a single page number or an array of numbers as [startPage, endPage].
 * @param {string} outputPath - The folder path where the split PDFs should be saved.
 */
async function splitPDF(sourcePath, pages, outputPath) {
    const dataBuffer = fs.readFileSync(sourcePath);
    const sourcePDF = await PDFDocument.load(dataBuffer);

    const createPDFPage = async (pdfDoc, sourcePdf, pageIndex) => {
        const [newPage] = await pdfDoc.copyPages(sourcePdf, [pageIndex]);
        pdfDoc.addPage(newPage);
    };

    let startPage, endPage;
    if (typeof pages === 'number') {
        startPage = endPage = pages;
    } else if (Array.isArray(pages)) {
        [startPage, endPage] = pages;
    } else {
        throw new Error('Invalid input for pages. Must be a single number or a range in the form "start-end".');
    }

    if (startPage === endPage) {
        // If there's only one page, just copy that page to the new PDF
        const newPDF = await PDFDocument.create();
        await createPDFPage(newPDF, sourcePDF, startPage-1);
        const pdfBytes = await newPDF.save();

        const filename = `${outputPath}/${path.basename(sourcePath, '.pdf')}_pg${startPage}.pdf`;
        fs.writeFileSync(filename, pdfBytes);
        console.log(`Page ${startPage} saved successfully.`);
        return filename;
    } else {
        // If there's multiple pages, copy each page to the new PDF
        const newPDF = await PDFDocument.create();
        for (let i = startPage; i <= endPage; i++) {
            await createPDFPage(newPDF, sourcePDF, i - 1);
        }
        const pdfBytes = await newPDF.save();

        const outputFilename = `${outputPath}/${path.basename(sourcePath, '.pdf')}_pg${startPage}-${endPage}.pdf`;
        fs.writeFileSync(outputFilename, pdfBytes);
        console.log(`Pages ${startPage}-${endPage} saved successfully.`);
        return outputFilename;
    }
}



async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);

    // Extracting text from the PDF
    const data = await pdf(dataBuffer);
    const text = data.text;
    console.log(text);
}

let input_path = 'input\\Counter-Clock World (Philip K. Dick) (Z-Library).pdf'

splitPDF(input_path, 2, 'output').catch(err => console.error('Error splitting PDF:', err));

// extractTextFromPDF(input_path).catch(err => console.error('Error extracting text:', err)); 
