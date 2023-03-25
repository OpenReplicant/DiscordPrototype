
const getImage = require('./diffusion.js'); //Send selfies on command
const llm = require('./message.js'); //Process input, return output

async function intentHandler(result,discordMsg) {
const i = result.intent;
const score = result.score;
const min = 0.91 //minimum score, or use custom value
let hit = score>=min

if (i==="selfie") { //&& hit) {
  //Selfie maker
  getImage.execute(discordMsg); //, args); //await
  const llmReply = await llm.sendMessage(discordMsg, result.answer);
  return llmReply;

  // This is where we can pass metadata in LLM prompt from intent 'answers' in corpus file.
//} else if (score>0.99) {
//  const llmReply = await llm.sendMessage(discordMsg, result.answer);
//  return llmReply;

} else { 
  // This avoids polluting the prompt if score is low.
  const llmReply = await llm.sendMessage(discordMsg);
  return llmReply;
}
}

module.exports = { intentHandler };