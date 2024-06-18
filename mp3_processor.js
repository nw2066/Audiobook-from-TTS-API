const { match } = require('assert');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Combines multiple MP3 files into a single MP3 file.
 * @param {string[]} mp3Files - Array of paths to MP3 files to be combined.
 * @param {string} outputPath - Path where the combined MP3 file will be saved.
 */


async function combineMP3Files(mp3Files, outputPath) {
  const flattenedMp3Files = mp3Files.flat();
  const uniqueSuffix = Date.now();
  const fileList = `fileList_${uniqueSuffix}.txt`;

  const fileContent = flattenedMp3Files.map(file => `file '${path.resolve(file).replace(/\\/g, '/')}'`).join('\n');

  try {
      await fs.promises.writeFile(fileList, fileContent, 'utf8');

      const command = `ffmpeg -f concat -safe 0 -i ${fileList} -fflags +genpts -acodec libmp3lame -b:a 192k "${outputPath.replace(/\\/g, '/')}"`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
          console.error(`stderr: ${stderr}`);
      }
      console.log(`MP3 files combined successfully into ${outputPath}`);
  } catch (error) {
      console.error(`Error: ${error.message}`);
  } finally {
      try {
          await fs.promises.unlink(fileList);
      } catch (cleanupError) {
          console.error(`Failed to clean up temporary file: ${cleanupError.message}`);
      }
  }
}
/**
 * Gets and prints the duration of an MP3 file.
 * @param {string} filePath - Path to the MP3 file.
 */
function getMP3Duration(filePath) {
    const command = `ffmpeg -i ${filePath} -f null -`;
  
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      // Extract duration from the stderr output
      const match = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/.exec(stderr);
      if (match) {
        //console.log(`Duration of the combined MP3 file: ${match[1]}`);
        return match;
      } else {
        console.error('Failed to retrieve MP3 duration.');
      }
    });
    return match;
}

function checkFileExists(sourceDir, fileName) {
    const filePath = path.join(sourceDir, fileName);
    if (fs.existsSync(filePath)) {
        return filePath;
    } else {
        throw new Error(`File not found: ${filePath}`);
    }
}

async function compileChapters(sourceDir) {
    async function readChaptersJSON(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
    
                try {
                    const chapters = JSON.parse(data);
                    resolve(chapters);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
    const chapters = await readChaptersJSON("chapters.json")

    if (!fs.existsSync(path.join(sourceDir,"chapters"))) {
        fs.mkdirSync(path.join(sourceDir,"chapters"), { recursive: true });
    }


    for (const [chapter, files] of Object.entries(chapters)) {
      const filePaths = files.map(file => path.join(sourceDir, "pages", file));
      for (const filePath of filePaths) {
          if (!fs.existsSync(filePath)) {
              throw new Error(`File not found: ${filePath}`);
          }
      }

      const chapterNumber = chapter.replace(/\D/g, '');
      await combineMP3Files(filePaths, path.join(sourceDir, "chapters", `${chapterNumber}.mp3`));
  }
}

// Example usage:
const outputPath = 'comblinedPages.mp3';
//console.log(getMP3List('temp\\Counter-Clock World (Philip K. Dick)\\pages', 1, 3))
let mp3Files = [];
for (let i = 1; i <= 3; i++) {
    let mp3File = ['temp\\Counter-Clock World (Philip K. Dick)\\pages\\' + i + '.mp3'];
    mp3Files.push(mp3File); 
}
//combineMP3Files(mp3Files, outputPath);

//getMP3Duration(outputPath)


compileChapters("temp\\Counter-Clock World (Philip K. Dick)")