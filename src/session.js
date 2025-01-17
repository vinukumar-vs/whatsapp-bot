const session = require('express-session');

const inMemoryStore = {};
const sessionLangKey = "lang";
const sessionBotKey = "bot";
var isLangSelection, isBotSelection;
var deafultSession = {};

const oneDay = 1000 * 60 * 60 * 24;

const init = () => {
  return session({
    secret: "ABEGkZlkMAYjAgs-sJSPdqSRIMDoHg",
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: oneDay }
})
  
  console.log("Session init called.");
}

/**
 * Returns user session id based of incoming message data
 * @param {*} incomingMsg 
 * @returns 
 */
const getUserSessionId = (incomingMsg) => {
  return "user0623"
}

const createSession = (req, incomingMsg) => {
  // inMemoryStore[id]
  let sessionId = req?.session?.sessionId || deafultSession.sessionId;
  if(!sessionId) {
    sessionId = getUserSessionId(incomingMsg);
    deafultSession.sessionId = sessionId;
    req.session.sessionId = sessionId;
    console.log("✅ new session created: ", sessionId);
    return false;
  } else {
    console.log("✓ session already exist: ", sessionId);
    return true;
  }
}

const setUserLanguage = (req, msg) => {
    console.log("⭆ setUserLanguage");
    
    let userReplyBtnId = msg?.input?.context?.id;
    console.log("userReplyBtnId: ",userReplyBtnId, "btn_reply: ", msg?.input);
    let selLang =  userReplyBtnId && userReplyBtnId.includes(sessionLangKey) && userReplyBtnId?.split('__')[1]
    // console.log('User selected Language: ', selLang)

    if (selLang) {
        // If not present, set the default value from the incoming message
        req.session[sessionLangKey] = selLang;
      deafultSession[sessionLangKey] = selLang
        console.log(`✅ Language set ${selLang}, req session`);
    } else {
        console.log('✓ User selected lang: ', req.session[sessionLangKey]);
        // if (id && languageSelection !== id && id.includes('lan')) {
        //     req.session.languageSelection = id;
        //     console.log('Updated languageSelection:', id);
        // }
    }
    return selLang;
}

const getUserLanguage = (req, msg) => {
  let lang = req?.session[sessionLangKey] || deafultSession[sessionLangKey];
  return lang;
} 

const setUserBot = (req, msg) => {
  console.log("⭆ setUserBot:",  msg?.input?.context?.id);
  let userReplyBtnId = msg?.input?.context?.id;

  let botId =  userReplyBtnId && userReplyBtnId.includes(sessionBotKey) && userReplyBtnId?.split('__')[1]
    
  if (botId) {
      req.session[sessionBotKey] = botId;
    deafultSession[sessionBotKey] = botId;
      console.log(`✅ User selected bot ${botId}, req session`, req.session);
  } else {
      console.log('✓ User selected bot: ', req.session[sessionBotKey]);
  }
  return botId;
} 

const getUserBot = (req, msg) => {
  let userSelectedBotId = req?.session[sessionBotKey] || deafultSession[sessionBotKey];
  return userSelectedBotId;
} 

const getSession = (req, msg) => {
  var userSesKey = 'user'+ (msg?.context?.from || msg?.context?.display_phone_number);
  return req.session;
}

module.exports = {init, getUserLanguage, setUserLanguage, setUserBot, getUserBot, createSession }