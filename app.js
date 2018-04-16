/* global addAttachment */
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

/*Greeting message*/
/*bot.on('conversationUpdate', function (message) {
    // Say hello
    var reply = new builder.Message()
    .address(message.address)
    .text("Thank you for contacting Soliman AL Fakeeh Hospital, I can help you to:<br>1. Book an appointment<br>2. Change an appointment");
    bot.send(reply);
});*/

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.send(new builder.Message()
                    .address(message.address)
                    .text("Thank you for contacting Soliman AL Fakeeh Hospital, Hi there"));
                    

            }
        });
    }
});


/** */




/***/
bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "I can help you to:", "Book an Appointment | Change Appointment", { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        /*
        result response index dah button
        */
        session.userData.choice = results.response.index;
        if(session.userData.choice==0){
        builder.Prompts.text(session, "Sure, which department would you like to book an appointment at?");}
        else{
                    session.endDialog("i am not trained yet to handle this request, please start another chat .");
        }
    },
    function (session, results) {
        session.userData.department = results.response;
            builder.Prompts.time(session, "Okay, at what time / date would you like to book the appointment.");

    },
    function (session, results) {
        session.dialogData.time = builder.EntityRecognizer.resolveTime([results.response]).toLocaleDateString('en-US', {timeZone: 'Asia/Riyadh'});
        builder.Prompts.choice(session, session.dialogData.time+" ,we have the below available time slots. Which one would be suitable for you?","10:00 AM|12:00 PM|11:00 AM|01:00 PM",{ listStyle: builder.ListStyle.button });
    },
        function (session, results) {
        session.userData.ChoiceTime = results.response.entity;
        builder.Prompts.text(session, "Okay, can I get your full name to complete your booking please?");
    },
        function (session, results) {
        session.userData.UserName = results.response;
        builder.Prompts.text(session, "And, your phone number please?");
    },
    function (session, results) {
        session.userData.UserPhoneNumber = results.response;
        session.send("Great "+session.userData.UserName+ ", your appointment will be " + session.dialogData.time + 
                    " with doctor Dr. Mohamed AlJawad " +session.userData.ChoiceTime +" I hope you get well soon & thank you for contacting Soliman AL Fakeeh Hospital.");
    }
]);


