const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const axios = require('axios');
const fs = require('fs');

// Your Google Cloud Project ID (replace with your actual ID)
const projectId = 'tts-to-long-mp3'; 

// Create a Text-to-Speech client
const client = new TextToSpeechClient({
    keyFilename: 'key/tts-to-long-mp3-b7d386781518.json', // Replace with the actual path to your key file
  });

  
  // Function to synthesize speech
async function synthesizeSpeech(text, outputFilename) {
    // Construct the request
    const request = {
      input: { text: text },
      voice: {
        languageCode: 'en-GB	', // Specify the language code
        name: 'en-GB-News-G', // Choose a voice (see documentation for options)
        ssmlGender: 'FEMALE', // Optional: Specify gender
      },
      audioConfig: {
        audioEncoding: 'MP3', // Output format
      },
    };
  
    // Send the request and get the response
    const [response] = await client.synthesizeSpeech(request);
  
    // Write the audio content to a file
    fs.writeFileSync(outputFilename, response.audioContent);
    console.log(`Audio saved to ${outputFilename}`);
}


// write a getvoices function
async function getVoices() {
    const [voices] = await client.listVoices();
    console.log(voices);
}




  // Example usage:
  const textToSpeak = "This is a long text that will be converted to an MP3 file.";
  const outputFile = 'output\\test.mp3';
  
  //getVoices();

  //synthesizeSpeech(textToSpeak, outputFile);


  module.exports = {
    client,
    synthesizeSpeech,
    getVoices
};