require('dotenv').config();
const axios = require('axios');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

async function getImage(message, args) {

  // Read character data
  const userId = message.author.id;
  const userDirectory = path.join('./user', userId);
  const characterFile = path.join(userDirectory, 'character.json');
  let char = {}; //Our character sheet
  try {
    char = JSON.parse(fs.readFileSync(characterFile, 'utf8'));
  } catch (error) {
    console.error(`Failed to read character data for user ${userId}:`, error);
  }
  let c = char.fact

  let promptHelpers = "selfie, anime, best_quality, highres, big_eyes, perfect face, dramatic lighting, depth of field, symmetry, perfect eyes, beautiful, selfie, "
  let posPrompt = `${c.age}yo, ${c.sex}, ${c.nationality}, ${c.ethnic}, wearing ${char.wearing}, ${char.time}, ${c.hair} hairstyle, ${c.eyes} eyes, feeling ${char.mindset}, ${c.weight}, ${c.name}, in ${char.location}, `+ promptHelpers + c.traits +", "+ message.content;
  let negPrompt = "blemish, cracks, worst quality, low_quality, monochrome, greyscale, multiple views, comic, sketch, blurry, aged_down, loli, tween, teen, child, bad_image, lowres, bad_hands, bad_artist, poorly_drawn, amputee, malformed"; //NSFW, lewd, nude, naked, breasts, 
  let model = "GorynichMix" //BEST:"Abyss OrangeMix" //"DucHaiten Classic Anime" //"Eimis Anime Diffusion" //"Uhmami" //"Counterfeit"
  //remember some models need trigger tokens

  // API key sent in HTTP POST header to the Horde
  const config = {
  headers: {
    apikey: process.env.HORDE_APIKEY,
    'Content-Type': 'application/json',
    }
  };

  //FORMAT: this is a positive prompt ### this is a negative prompt
  const postData = {
    "prompt": posPrompt+" ### "+negPrompt,
    "params": {
      "sampler_name": "k_lms",
    //  "cfg_scale": 7,
    //  "denoising_strength": 0.75,
      "height": 512,
      "width": 512,
    //  "post_processing": [
     //   "GFPGAN"
      //],
      "karras": true,
      "tiling": false,
      "hires_fix": false,
      "clip_skip": 2,
    //  "control_type": "canny",
      "image_is_control": false,
      "return_control_map": false,
    //  "facefixer_strength": 0.75,
      "steps": 30,
      "n": 1
    },
    "nsfw": true, //true allows lewds - false filters
    "trusted_workers": false,
    "slow_workers": true,
    "censor_nsfw": false,
    //"workers": [
    //  "string"
    //],
    "models": [
      model
    ],
    //"source_image": "string",
    //"source_processing": "img2img",
    //"source_mask": "string",
    "r2": true,
    "shared": true,
    //"replacement_filter": true
  };
  
  try {
    // send POST request to first REST API endpoint
    const response = await axios.post('https://stablehorde.net/api/v2/generate/async', 
    postData, 
    config);
    const id = response.data.id; // get id from response data
    console.log(`Img job id: ${id}`);
    
    // poll second endpoint for "done=true" value
    let done = false;
    while (!done) {
      const pollResponse = await axios.get(`https://stablehorde.net/api/v2/generate/check/${id}`);
      done = pollResponse.data.done;
      console.log(`Polling img job: ${done}`);
      
      if (done) {
        // get base64-encoded image from third endpoint
        const imageResponse = await axios.get(`https://stablehorde.net/api/v2/generate/status/${id}`);
        //console.log(imageResponse);
        const imageUrl = imageResponse.data.generations[0].img;
        console.log(`Received img URL: ${imageUrl}`);
        
        // send image as reply in Discord
        const attachment = new Discord.MessageAttachment(imageUrl);
        message.channel.send('', { files: [attachment] });
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds before polling again
    }
  } catch (error) {
    console.error('Error:', error);
    message.channel.send('An error occurred.');
  }
}

module.exports = {
  name: 'getimage',
  description: 'Get an image from the API',
  async execute(message, args) {
    await getImage(message, args);
  },
};
