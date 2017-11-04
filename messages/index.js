/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var cognitiveservices = require("botbuilder-cognitiveservices");
var path = require('path');
var opn = require('opn');
var HeroCardName = 'Hero card';

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Adding code for QnA
var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());    

var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
                                                                knowledgeBaseId: 'YOUR KB',
                                                                subscriptionKey: 'YOUR KEY'});
//QNA dialog
var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [qnarecognizer],
    defaultMessage: 'Sorry, I\'m a just bot and I\'m still learning. Maybe you could check with Nick, Chris or Kristi to answer that one...',
    qnaThreshold: 0.7}
);
//qna return
bot.dialog('qna', basicQnAMakerDialog);

// Connection to LUIS Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('Greeting',(session, args) => {
    session.send('Welcome to Azure Boot Camp. What did you need?');
})

.matches('Lookup.Meaning',(session, args) => {
    session.send('Checking Glossary...');
    session.beginDialog("qna");
})

.matches('Get.Boot.Camp.Data',(session, args) => {
    var card = new createDataHeroCard(session);
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg);
})

.matches('Get.My.Content',(session, args) => {
    var card = new createContentHeroCard(session);
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg);
})

.matches('Places.ShowMap',(session, args) => {
    var card = new createMapHeroCard(session);
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg);
})

//.matches('Who',(session, args) => {
 //   session.send('Checking Address Book....');
    //session.beginDialog("qna");
//})

.onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    
//Card return for DATA
function createDataHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Azure Boot Camp Data')
        .subtitle('Statistical Data for Boot Camp Admins')
        .text('Boot camp attendance data is being placed in Lens to help track Boot Camp attendance rates across each session. Click below to see the latest attendance data.')
        .images([
          builder.CardImage.create(session, 'https://microsoft.sharepoint.com/teams/WAG/EngSys/Monitor/SiteAssets/AmdWiki/Lens%20V2%20User%20Guide/WikiHero.fw.png')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://lens.msftcloudes.com/v2/#/dashboard/AzureBootcamp%20attendees?_g=(ws:lenshealth)', 'Get Data')
        ]);
}
//Card return for CONTENT
function createContentHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Azure Boot Camp Content')
        .subtitle('Shows the latest Content for Boot Camp Admins')
        .text('Boot camp content is stored in Teams on within a SharePoint library. Click below to check the latest content files.')
        .images([
          builder.CardImage.create(session, 'https://microsoft.sharepoint.com/teams/Azure_Boot_Camp/SiteAssets/ServicesULogo.png')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://microsoft.sharepoint.com/teams/AzureBootCamp/Shared%20Documents/General', 'Get Content')
        ]);
}
//Card return for FIND
function createMapHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Find your way')
        .subtitle('Access Microsofts intenral Map services to help find your way around.')
        .text('Microsoft has a number of services to help you find your way around the Redmond, as well as other campus locations.  Click the button below to get some assistance.')
        .images([
          builder.CardImage.create(session, 'https://microsoft.sharepoint.com/sites/refweb/PublishingImages/News%20Images/REFWeb%20News/GFSC%20REFWeb%20Ad.jpg')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://microsoft.sharepoint.com/sites/msw/Maps/Pages/default.aspx?cp=47.6448594777762~-122.1366351842876&lvl=17&sty=r&isShare=1&pp=0&sid=1c1d9831-ad3b-45b8-8a31-740063f7797e', 'Find your way')
        ]);
}

//listen
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

