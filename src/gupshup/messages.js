const language = require("../language");
const userSession = require("../session");
const axios = require("axios");
const qs = require('qs');

const WA_PROVIDER_TOKEN = process.env.WA_PROVIDER_TOKEN;
const ACTIVITY_SAKHI_URL = process.env.ACTIVITY_SAKHI_URL;
const STORY_SAKHI_UTL = process.env.STORY_SAKHI_UTL;
const BOT_API_TOKEN = process.env.BOT_API_TOKEN;
const WA_PROVIDER_NUMBER = process.env.WA_PROVIDER_NUMBER;
const WA_PROVIDER_APPNAME = process.env.WA_PROVIDER_APPNAME;

const audienceMap = {
  'bot_1': null,
  'bot_2': 'teacher',
  'bot_3': 'parent'
};
/**
 * First message to the user
 * Welcome messsage along with Language selection
 * @param {*} incomingMsg 
 */
const sendLangSelection = (incomingMsg) => {
  console.log("⭆ sendLangSelection");
  let langSelecBody = language.getMessage(language.defaultLang, null, 'lang_selection');
  sendMessage(langSelecBody, incomingMsg);
}

/**
 * Send bot selction options to the user 
 * In the user selected language
 * @param {*} req 
 * @param {*} msg 
 */
const sendBotSelection = (req, msg) => {
  console.log("⭆ sendBotSelection");
  let body = language.getMessage(userSession.getUserLanguage(req, msg), null, "bot_selection");
  sendMessage(body, msg);
}

/**
 * Send welcome message for the selected bot 
 * In the user selected language
 * @param {*} req 
 * @param {*} msg 
 */
const sendBotWelcomeMsg = (req, msg) => {
  console.log("⭆ sendBotWelcomeMsg");
  let userLang = userSession.getUserLanguage(req, msg);
  let userBot = userSession.getUserBot(req, msg);
  let body = language.getMessage(userLang, userBot, 'Welcome');
  sendMessage(body, msg);
}

/**
 * Send Bot response for the user query
 * @param {*} req 
 * @param {*} msg 
 */
const sendBotResponse = async (req, msg) => {
  console.log("⭆ sendBotResponse \n\n\n");
  let userLang = userSession.getUserLanguage(req, msg);
  let userBot = userSession.getUserBot(req, msg);

  await sendBotLoadingMsg(req, msg, userLang, userBot);
  await sendBotAnswer(req, msg, userLang, userBot);
  await sendBotReplyFooter(req, msg, userLang, userBot);
}

/**
 * Loading message while getting the response from the Bot
 * @param {*} userLang 
 * @param {*} userBot 
 */
const sendBotLoadingMsg = async (req, msg, userLang, userBot) => {
  console.log("⭆ sendBotLoadingMsg \n");
  let body = language.getMessage(userLang, null, 'loading_message');
  await sendMessage(body, msg);
}

/**
 * Send bot response as answer & audio message
 * @param {*} req 
 * @param {*} msg 
 * @param {*} userLang 
 * @param {*} userBot 
 */
const sendBotAnswer = async (req, msg, userLang, userBot) => {
  console.log("⭆ sendBotAnswer\n");
  // console.log('msgcheck', JSON.stringify(msg))
  await fetchQueryRespone(req, msg, userLang, userBot)
    .then(async (queryResponse) => {
      let bodyMessage = language.getMessage(language.defaultLang, null, 'bot_answer_text');
      bodyMessage.message.text = queryResponse?.output?.text;
      await sendMessage(bodyMessage, msg);

      let audioMessage = language.getMessage(language.defaultLang, null, 'bot_answer_audio');
      audioMessage.message.url = "https://www.buildquickbots.com/whatsapp/media/sample/audio/sample02.mp3";//queryResponse?.output?.audio;
      await sendMessage(audioMessage, msg)
    })
    .catch(err => {
      console.error('Error in fetchQueryRespone:', err);
    });
}

/**
 * Footer options for Bot response message
 * "*" to go main menu & "#" to go language selection
 * @param {*} userLang 
 * @param {*} userBot 
 */
const sendBotReplyFooter = async (req, msg, userLang, userBot) => {
  console.log("⭆ sendBotReplyFooter \n");
  let body = language.getMessage(userLang, null, 'footer_message');
  await sendMessage(body, msg);
}

/**
 * Sending message to WhatApp number
 * @param {*} body 
 * @param {*} incomingMsg 
 */
const sendMessage = async (body, msg) => {
  let incomingMsg = JSON.parse(JSON.stringify(msg));
  console.log('⭆ sendMessage', body);
  body = decorateWAMessage(body, incomingMsg);

  let data = qs.stringify(body);
  try {
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.gupshup.io/wa/api/v1/msg',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': WA_PROVIDER_TOKEN
      },
      data: data
    };

    await axios(config)
    .then((resp)=> {
      console.log("sendMessage success - ", resp.status);
      return resp;
    })
    .catch((error) => {
      console.log(error.toJSON());
    })
    // request
    // .then((response) => {
    //     console.log(JSON.stringify(response.data));
    // })
    // .catch((error) => {
    //     console.log(error);
    // });
  } catch (error) {
    console.log("webhook => error occurred with status code:", error);
  } 
}


/**
 * For the whatsApp service provider message body
 * Add the WA details of service provider
 * @param {Object} body 
 * @param {Object} incomingMsg 
 */
const decorateWAMessage = (body, incomingMsg) => {
  let payloadFormat = {
    "channel": "whatsapp",
    "source": WA_PROVIDER_NUMBER,
    "src.name": WA_PROVIDER_APPNAME
  }
  body.message = JSON.stringify(body.message);
  Object.assign(body, payloadFormat);
  let finalPayload = setMessageTo(body, incomingMsg);
  return finalPayload;
}

const sendTestMessage = async () => {
  let data = qs.stringify({
    'channel': 'whatsapp',
    'source': '917834811114',
    'destination': '919964300623',
    'message': '{\n   "type":"text",\n   "text":"Hello user, how are you?"\n}',
    'src.name': 'TestDJP' 
  });
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.gupshup.io/wa/api/v1/msg',
    headers: { 
      'Cache-Control': 'no-cache', 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'apiKey': 'wkwzvw6yducqvbebadi13qnouc88zdbd', 
      'cache-control': 'no-cache'
    },
    data : data
  };
  
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
}

/**
 * Update the user number to the body (to whome we have to send)
 * @param {*} body 
 * @param {*} incomingMsg 
 * @returns 
 */
const setMessageTo = (body, incomingMsg) => {
  console.log('⭆ sendMessage', incomingMsg);
  if (incomingMsg.fromMobile) {
    body.destination = incomingMsg?.fromMobile;
  } else {
    body.destination = incomingMsg?.rawData?.payload?.sender?.phone;
  }

  return body;
}
/**
 * @description Fetches query response data based on provided parameters.
 * @param {Object} req - The request object.
 * @param {Object} msg - The message object.
 * @param {string} userLang - The user language.
 * @param {string} userBot - The user bot identifier.
 * @returns {Promise<Object>} - A promise resolving to the response data.
 */
const fetchQueryRespone = async (req, msg, userLang, userBot) => {
  console.log("⭆ fetchQueryRespone");
  console.log(msg);
  let data = {
    input: {
      "language": userLang
    },
    output: {
      "format": "audio"
    }
  };

  // Based on Bot selection add the properties
  let botUrl;
  if(userBot != 'bot_1') {
    botUrl = ACTIVITY_SAKHI_URL ;
    data.input.audienceType = audienceMap[userBot];
  } else {
    botUrl = STORY_SAKHI_UTL;
  }

  // Updating text/audio property to the input request
  if (msg?.type === "text" || msg?.type === "audio") {
    data.input[msg.type] = msg?.input[msg.type];
  }

  var axiosConfig = {
    method: 'POST',
    url: botUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  // Add Authorization token if it is defined
  if(BOT_API_TOKEN) {
    axiosConfig.headers.Authorization = `Bearer ${BOT_API_TOKEN}`;
  }
  console.log('axios', axiosConfig);

  try {
    const response = await axios(axiosConfig);
    // console.log('Telemetry request successful:', response.data);
    return response.data; // Resolve the promise with response data
  } catch (error) {
    // console.error('Telemetry request failed:', error);
    throw error; // Throw an error to handle it wherever the function is called
  }
};

module.exports = { sendLangSelection, sendBotSelection, sendBotWelcomeMsg, sendMessage, sendBotResponse, fetchQueryRespone, sendBotAnswer }