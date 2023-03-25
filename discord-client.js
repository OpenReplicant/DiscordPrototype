require('dotenv').config();
const fetch = require('node-fetch');

const { intentHandler } = require('./intent-actions.js')
const { commandHandler } = require('./commands.js')
const { checkBanStatus, checkFirstInteraction } = require('./users.js')
const { captionImage } = require('./caption.js')
const llm = require('./message.js'); //Process input, return output

const { removeEmojis } = require('@nlpjs/emoji');
const { dockStart } = require('@nlpjs/basic');

//Discord client
const Discord = require('discord.js');
const devToken = process.env.DISCORD_TOKEN;
const client = new Discord.Client({
  intents: [`DirectMessages`,`MessageContent`,`Guilds`,`GuildMessages`,`GuildMembers`],
  partials: ['MESSAGE', 'CHANNEL']});

client.on('ready', () => {
console.log(`Logged in as ${client.user.tag}!`);
});

//Initialize NLP engine
(async () => {
  const dock = await dockStart({ use: ['Basic'] });
  const nlp = dock.get('nlp');
  await nlp.addCorpus('./corpus/output.json');
  await nlp.train();
  //const response = await nlp.process('en', 'I should go now');
  console.log("*NLP.js initialized*");

  //Discord message
client.on('message', async message => {
  console.log(message);

  //Add spell check, language check, or other early modifiers

  //Translate emojis into plain text descriptions
  const emojiTranslate = removeEmojis(message.content)
  message.content = emojiTranslate

  const authorName = message.author.username; //SENDER NAME

  //double check this by replacing ref's with original object name, you need to pass whole obj
  const discordMsg = message //ACCESS DISCORD MESSAGE OBJECT IN NLP PROCESS (name conflict)

 // Use NLP.js to recognize the intent of the message
 if (!message.author.bot) { //DON'T RUN ON SELF OR OTHER BOTS
 await nlp.process('en', message.content).then(async result => {
  console.log(result);
  const intent = result.intent;
  const score = result.score;
  // Set a single score threshold value (or fine-tune each intent)
  let threshold = 0.91; //Don't trigger intent if score lower

  /////////////////////////////////////////////////////////////////////////////
  // Call your function logic to handle the direct message
  //WE NEED TO HANDLE CHATROOMS vs DM (ignore chatroom until built out)

  const banned = await checkBanStatus(discordMsg.author)
  // Ignore messages from bots, especially our own
  // (only check for own ID to enable bot-bot chats)
  if (discordMsg.author.bot) {
      return;
  } else if (!banned) { //if NOT banned, continue
  const newUser = await checkFirstInteraction(discordMsg.author) //run always to init any new users
  
  if (discordMsg.content.startsWith('!')) { 
    //Trigger command when msg starts with !
    console.log(`${authorName}: ${discordMsg}`);
    const cmdRes = await commandHandler(discordMsg, Discord, devToken, client); 
    discordMsg.channel.send(cmdRes);

  } else if (message.attachments.size > 0 && message.attachments.every(attachment => attachment.url.endsWith('.png') || attachment.url.endsWith('.jpg') || attachment.url.endsWith('.jpeg') || attachment.url.endsWith('.gif') || attachment.url.endsWith('.webp'))) {
      //Caption images sent to bot
      console.log("CAPTIONING IMG")
      // Download the image and convert to base64
      const attachment = message.attachments.first();
      const url = attachment.url;
      fetch(url)
      .then(res => res.buffer())
      .then(buffer => {
        const base64 = buffer.toString('base64');
        captionImage(base64, message, authorName);
      }).catch(console.error);

  } else if (intent!='None') { // && score>=threshold) { 
    //Trigger intent-based logic if detected
    console.log(`${intent} detected from ${authorName} ...`);
    const intentReply = await intentHandler(result, discordMsg); 
    discordMsg.channel.send(intentReply);

  } else {
    //If no special conditions met, pass directly to LLM.
    console.log(`DM from ${authorName}: ${discordMsg}`);
    const llmReply = await llm.sendMessage(discordMsg);
    discordMsg.channel.send(llmReply);
  }
} else {
  discordMsg.channel.send("You appear to be banned. Bye now.");
}
 })}; //close NLP message process
}); // close DISCORD message block

//Discord login
client.login(devToken);
})(); //close NLP.js async
