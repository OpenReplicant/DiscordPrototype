require('dotenv').config();
const fs = require('fs');
const natural = require('natural');
const axios = require('axios');
const path = require('path');
const Handlebars = require('handlebars');

const maxContext = 1337
const maxOutput = 42 //Tokens to generate each call (we cut off extra text in chat)
const logLimit = 10 //How many lines of recent chat history to include in prompt
const headerLimit = 33 //Add more chat history above the character sheet

// Horde API key sent in HTTP POST header
const config = {
  headers: {
    apikey: process.env.HORDE_APIKEY,
    'Content-Type': 'application/json',
  }
}

// Export this function
async function sendMessage(message, intent) {
const authorName = message.author.username; 
const userId = message.author.id;
const userDirectory = path.join('./user', userId);
const characterFile = path.join(userDirectory, 'character.json');
const chatLogFile = path.join(userDirectory, 'chatlog.txt');


// Read character data
let bot = {};
try {
  bot = JSON.parse(fs.readFileSync(characterFile, 'utf8'));
  //Set the user's name for Handlebars, keep out of objects passed to prompt
  bot.user = authorName 
} catch (error) {
  console.error(`Failed to read character data for user ${userId}:`, error);
}
// Compile the Handlebars template to fill name/user into dialog sample
let bd = JSON.stringify(bot.dialog)
const template = Handlebars.compile(bd);
// Fill in the variables with data from the bot object
const botDialog = template(bot); 
// Prepare profile facts for prompt
let facts = JSON.stringify(bot.fact)
// Clean up the output string
const botFacts = facts.replace(/["'\{\}\[\]]/g, '');


//EXPERIMENTAL
//Use 'intent answers' for memory or other notes to bot with dynamic profile vars.
if (intent) {
  //Append intent-recognition note if attached (answer in corpus)
  const logEntry = `${authorName}: ${message.content} ${intent}\n`;
  fs.appendFileSync(chatLogFile, logEntry);
} else {
  // Append message to chat log
  const logEntry = `${authorName}: ${message.content}\n`;
  fs.appendFileSync(chatLogFile, logEntry);
}


// Read updated chat log to post to API
let chatLogContent = '';
try {
  chatLogContent = fs.readFileSync(chatLogFile, 'utf8').split('\n');
} catch (error) {
  console.error(`Failed to read chat log for user ${userId}:`, error);
}
//Get log entries
const lastLogs = chatLogContent.slice(Math.max(chatLogContent.length - logLimit, 0)).join('\n');
const headerLogs = chatLogContent.slice(Math.max(chatLogContent.length - logLimit - headerLimit, 0), Math.max(chatLogContent.length - logLimit, 0)).join('\n');



//Build the prompt now!
 //This can be fine-tuned... have fun!
let state = `[It is ${bot.time} in ${bot.location}, ${bot.name} is wearing ${bot.wearing} and feeling ${bot.mindset}.]`
let prompt = `${headerLogs}\n[${botFacts}]\n${botDialog}\n${state}\n${lastLogs}\n${bot.name}:`
console.log(prompt);
  
// Count the tokens (for dev/debug, not used in logic yet)
const tokenizer = new natural.WordTokenizer();
const tokens = tokenizer.tokenize(prompt);
const tokenCount = tokens.length;
console.log(tokenCount + " TOKENS IN PROMPT")

  //Build the REST payload (kobold AI/horde settings)
  const apiPayload = {
    "prompt": prompt,
    "params": {
        "n": 1,
        "max_context_length": maxContext,
        "max_length": maxOutput,
        "rep_pen": 1.1,
        "temperature": 0.69,
        "top_p": 0.5,
        "top_k": 0,
        "top_a": 0.75,
        "typical": 0.19,
        "tfs": 0.97,
        "rep_pen_range": 1024,
        "rep_pen_slope": 0.7,
        "sampler_order": [6,5,4,3,2,1,0]
    },
    "models": [
        "PygmalionAI/pygmalion-6b"
    ],
    "workers": []
};

  // POST to LLM API
  let response = await axios.post(
    'https://horde.koboldai.net/api/v2/generate/text/async', 
    apiPayload, 
    config);
  let jobId = response.data.id;
  console.log("HORDE: "+ response); //DEBUG ===========

  // GET polling response API
  let generations;
  while (true) {
    const jobStatus = await axios.get(`https://horde.koboldai.net/api/v2/generate/text/status/${jobId}`);
    if (jobStatus.data.done) {
      generations = jobStatus.data.generations || []; //NEW
      //generations = jobStatus.data.generations;
      console.log(generations); //DEBUG ===========
      break;
    }
    console.log(JSON.stringify(jobStatus.data))
    await new Promise(resolve => setTimeout(resolve, 1111)); // 1111ms polling

    //Add fail counter and/or faulted check.
  }


  //////////////////////////////////////////////
  // Extract bot response from returned payload
  // This needs some work to not cut off our bot's reply too early
  //let botResponse = generations[0].text;
  let botResponse = '[Error in LLM call.]'; //Return "error" if value not overwritten, avoid undefined error
  //why is this even giving an error sometimes?

  if (generations && generations.length > 0) {
    for (let i = 0; i < generations.length; i++) {
      botResponse = `${generations[i].text}`;
      console.log("FULL REPLY> "+`${generations[i].text}`); //DEBUG ===========
    }
  }
  
  //THIS SHOULD INSTEAD LOOK FOR FIRST INSTANCE OF "USERNAME:" ...MULTI-LINE REPLIES EXIST
  // Clean response, discarding extra dialog generated
  //let cleanedString = botResponse.replace(/^\s+/, ''); // remove line breaks before words
  let matchPattern = bot.user+':'; // variable name to match with colon at the end
  let index = botResponse.indexOf(matchPattern); // find index of match pattern
  if (index !== -1) {
      botResponse = botResponse.substring(0, index); // return everything up to match pattern
  } else {
      botResponse = botResponse; // match pattern not found, return entire string
  }
  

  // Append bot response to chat log
  let botLogEntry = `${bot.name}: ${botResponse}\n`;
  try {
      fs.appendFileSync(chatLogFile, botLogEntry);
      //console.log(botLogEntry); //DEBUG ===========
  } catch (err) {
      console.error(`Error writing to chat log: ${err}`);
  }

  return botResponse;
}

module.exports = { sendMessage };
