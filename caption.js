require('dotenv').config();
const axios = require('axios');
const llm = require('./message.js'); //Process input, return output


async function captionImage(base64input, message, authorName) {
  //message.channel.send('ok, hang on a second.'); //Confirm and await.
  
  // API key sent in HTTP POST header to the Horde
  const config = {
  headers: {
    apikey: process.env.HORDE_APIKEY,
    'Content-Type': 'application/json',
    }
  };

  const postData = {
    "forms": [{
      "name": "caption",
      "payload": {},
    }],
    "source_image": `${base64input}`
  };
  
  try {
    // send POST request to first REST API endpoint
    const response = await axios.post('https://stablehorde.net/api/v2/interrogate/async', 
    postData, 
    config);
    const id = response.data.id; // get id from response data
    console.log(`Caption job id: ${id}`);
    
    // poll second endpoint for "done=true" value
    let done = false;
    while (!done) {
      const pollResponse = await axios.get(`https://stablehorde.net/api/v2/interrogate/status/${id}`);
      if (pollResponse.data.state==='done') {done=true};
      console.log("Caption "+ pollResponse.data.state);//`Polling caption job: ${done}`);
      
      if (done) {
        // get base64-encoded image from third endpoint
        const imageResponse = await axios.get(`https://stablehorde.net/api/v2/interrogate/status/${id}`);
        //console.log(imageResponse.data);
        const caption = imageResponse.data.forms[0].result.caption;
        console.log(`Img caption: ${caption}`);
        message.content = `${message.content} *[SENDS PICTURE: ${caption}]*`
        const llmReply = await llm.sendMessage(message);
        message.channel.send(llmReply);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds before polling again
    }
  } catch (error) {
    console.error('Error:', error);
    message.channel.send('An error occurred.');
  }
}

module.exports = { captionImage };
