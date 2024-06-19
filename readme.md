# description
This project is a tool for converting PDF files to MP3 files, while preserving the page structure.
It uses the Google Cloud Text-to-Speech API to generate MP3 files from the text content of each page.
The tool also splits the PDF file into individual pages, allowing for easier navigation and audio playback.

# instructions
1. clean up PDF with splitter (zlib EPUB -> PDF typically formats well (no pg numbers)) (pdf_processor)
2. get chapters (pdf_processor)
3. get pages for MP3 
4. 