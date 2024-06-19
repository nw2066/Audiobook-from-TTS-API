const { match } = require('assert');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const util = require('util');
const { start } = require('repl');
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
 * Converts a time string (HH:MM:SS.SS) to milliseconds.
 * @param {string} time - The time string to convert.
 * @returns {number} - The time in milliseconds.
 */
function timeToMilliseconds(time) {
  const [hours, minutes, seconds] = time.split(':');
  const [sec, ms] = seconds.split('.');

  return (
    parseInt(hours, 10) * 60 * 60 * 1000 +
    parseInt(minutes, 10) * 60 * 1000 +
    parseInt(sec, 10) * 1000 +
    parseInt(ms, 10) * 10
  );
}

/**
 * Gets the duration of an MP3 file.
 * @param {string} filePath - Path to the MP3 file.
 * @returns {Promise<string>} - A promise that resolves with the duration of the MP3 file.
 */
async function getMP3Duration(filePath) {
  const command = `ffmpeg -i "${filePath}" -f null -`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      // Extract duration from the stderr output
      const match = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/.exec(stderr);
      if (match) {
        const durationInMilliseconds = timeToMilliseconds(match[1]);
        resolve(durationInMilliseconds);
      } else {
        reject('Failed to retrieve MP3 duration.');
      }
    });
  });
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

/**
 * Compiles chapters into chunks of less than the target duration.
 * @param {string} sourceDir - Directory containing the source MP3 files.
 * @param {number} targetDuration - Target duration for each chunk in milliseconds.
 * @param {number} start - Start index for chapters.
 * @param {number} end - End index for chapters.
 * @returns {Promise<void>}
 */
async function compileChunks(sourceDir,outputDir = 'output', targetDuration = 3900000, start = 1, end = 1000) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  let totalDuration = 0;
  let combinedChapters = [];
  let chunkIndex = 1;
  let lastChapter = start;

  for (let i = start; i <= end; i++) {
    const chapterPath = path.join(sourceDir, "chapters",`${i}.mp3`);
    if (!fs.existsSync(chapterPath)) {
      console.log(`Chapter ${i} does not exist`);
      if (combinedChapters.length > 0) {
        const outputFile = path.join(outputDir, path.basename(sourceDir)+`_chapter${lastChapter}-${i-1}.mp3`);
        lastChapter = i;
        await combineMP3Files(combinedChapters, outputFile);
        console.log(`Combined chapters into ${outputFile}`);
      }

      return;
    }
    let duration;
    try {
      duration = await getMP3Duration(chapterPath);
      console.log(`Duration of the MP3 file: ${duration}`);
    } catch (error) {
      console.error(error)
      throw error;
    }


    if (totalDuration + duration > targetDuration && combinedChapters.length > 0) {
      const outputFile = path.join(outputDir, path.basename(sourceDir)+`_chapter${lastChapter}-${i-1}.mp3`);
      lastChapter = i;
      await combineMP3Files(combinedChapters, outputFile);
      console.log(`Combined chapters into ${outputFile}`);

      combinedChapters = [];
      totalDuration = 0;
      chunkIndex++;
    }

    combinedChapters.push(chapterPath);
    totalDuration += duration;
  }


}

// Usage example
(async () => {
  try {
    await compileChunks('path/to/sourceDir', 3600000, 1, 1000);
  } catch (error) {
    console.error(error);
  }
})()
// Example usage:
const outputPath = 'comblinedPages.mp3';
//console.log(getMP3List('temp\\Counter-Clock World (Philip K. Dick)\\pages', 1, 3))
let mp3Files = [];
for (let i = 1; i <= 3; i++) {
    let mp3File = ['temp\\Counter-Clock World (Philip K. Dick)\\pages\\' + i + '.mp3'];
    mp3Files.push(mp3File); 
}
//combineMP3Files(mp3Files, outputPath);
// (async () => {
//   try {
//     const duration = await getMP3Duration('output\\test.mp3');
//     console.log(`Duration of the MP3 file: ${duration}`);
//   } catch (error) {
//     console.error(error);
//   }
// })();

//compileChapters("temp\\Counter-Clock World (Philip K. Dick)")

compileChunks("temp\\Counter-Clock World (Philip K. Dick)",undefined, undefined ,20)