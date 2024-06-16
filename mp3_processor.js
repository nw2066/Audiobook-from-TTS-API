const { match } = require('assert');
const { exec } = require('child_process');
const fs = require('fs');

/**
 * Combines multiple MP3 files into a single MP3 file.
 * @param {string[]} mp3Files - Array of paths to MP3 files to be combined.
 * @param {string} outputPath - Path where the combined MP3 file will be saved.
 */
function combineMP3Files(mp3Files, outputPath) {
  // Create a temporary text file to store file paths in the format required by ffmpeg
  const fileList = 'fileList.txt';
  const fileContent = mp3Files.map(file => `file '${file}'`).join('\n');
  fs.writeFileSync(fileList, fileContent);

  // Command to combine MP3 files using ffmpeg
  const command = `ffmpeg -f concat -safe 0 -i ${fileList} -c copy ${outputPath}`;

  exec(command, (error, stdout, stderr) => {
    // Clean up the temporary file
    fs.unlinkSync(fileList);

    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    //console.log(`stdout: ${stdout}`);
    console.log(`MP3 files combined successfully into ${outputPath}`);
  });
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


// Example usage:
const mp3Files = ['temp\\Counter-Clock World (Philip K. Dick)\\pages\\1.mp3', 'temp\\Counter-Clock World (Philip K. Dick)\\pages\\2.mp3'];
const outputPath = 'comblinedPages.mp3';
//combineMP3Files(mp3Files, outputPath);
//getMP3Duration(outputPath)