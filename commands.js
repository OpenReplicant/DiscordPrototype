const path = require('path');
const fs = require('fs');

async function commandHandler(message, Discord, devToken, Client) {
  const userId = message.author.id;
  const userDirectory = path.join('./user', userId);
  const characterFile = path.join(userDirectory, 'character.json');
  const chatLogFile = path.join(userDirectory, 'chatlog.txt');
    
  // Read character data
  let bot = {};
  try {
    bot = JSON.parse(fs.readFileSync(characterFile, 'utf8'));
  } catch (error) {
    console.error(`Failed to read character data for user ${userId}:`, error);
  }

  // COMMANDS
  const cmd = message.content;
  let res = "Error... Type !help for list of commands.";

  if (cmd.startsWith("!list")) {
    let list = JSON.stringify(bot, null, 2);
    res = list;

  } else if (cmd.startsWith("!set")) {
    const args = cmd.split(/\s+/);
    if (args.length >= 3) {
      const key = args[1];
      const value = args.slice(2).join(' ');
      bot[key] = value;
      fs.writeFileSync(characterFile, JSON.stringify(bot, null, 2), 'utf8');
      res = `Set ${key} to "${value}" for user ${userId}.`;
    } else {
      res = "Usage: !set var Value";
    }

    /*
  } else if (cmd.startsWith("!toggle")) {
      const args = cmd.slice(8).trim().split(/\s+/);
      const arrName = args.shift(); // Get the name of the array to update
      const arr = bot[arrName]; // Get the array by name
      if (args.length === 0) {
        res = `Usage: !toggle <arrayName> <value>`;
      } else if (args.length === 1) {
        const value = args[0];
        const index = arr.indexOf(value);
        if (index === -1) {
          arr.push(value); // Add value to array if it doesn't exist
          res = `Added "${value}" to ${arrName}.`;
        } else {
          arr.splice(index, 1); // Remove value from array if it exists
          res = `Removed "${value}" from ${arrName}.`;
        }
      } else {
        res = `Invalid usage of !toggle. Usage: !toggle <arrayName> <value>`;
      }
*/

  } else if (cmd === "!export") {
    const attachment = new Discord.MessageAttachment(characterFile);
    message.author.send("Here's your character file:", attachment);
    res = "Sent character file to DM.";

  } else if (cmd === "!import") {
    const attachment = message.attachments.first();
    if (attachment && attachment.name === 'character.json') {
      const data = await attachment.fetch();
      fs.writeFileSync(characterFile, data, 'utf8');
      res = "Imported character file.";
    } else {
      res = "No valid character file attached.";
    }
    
/* //Bot can't delete any DM from bot on Discord. House rules. Hmmm.
} else if (cmd === "!delog discord") {
    try {
        const messages = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = messages.filter(m => m.author.bot);
        await message.channel.bulkDelete(botMessages);
        console.log(`Deleted ${botMessages.size} messages from channel ${message.channel.name}.`);
        return `Deleted ${botMessages.size} messages from channel ${message.channel.name}.`;
      } catch (error) {
        console.error(`Failed to delete bot chat history in channel ${message.channel.name}:`, error);
        return 'Failed to delete bot chat history.';
      }
*/
  } else if (cmd === "!delog") {
      try {
          fs.writeFileSync(chatLogFile, '');
          console.log(`Chat log file ${chatLogFile} has been cleared.`);
          return 'Chat log has been cleared.';
      } catch (error) {
          console.error(`Failed to clear chat log for file ${chatLogFile}:`, error);
          return 'Failed to clear chat log.';
      }

  } else { // help
    res = `
      These are the commands available: 
      !list            (lists all variables/values - character sheet) 
      !set var Value   (sets key to value in JSON - remember: fact. )
      !export          (download character sheet in JSON format)
      !import          (JSON file must be attached with message)
      !delog           (delete internal chat history) 
      !help            (displays this message)`;
  }

  return res;
}

module.exports = { commandHandler };


// add commands for LLM settings