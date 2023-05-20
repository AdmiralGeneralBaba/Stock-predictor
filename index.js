const OpenAI = require ('openai');
const axios = require('axios');
const computeAggregateSentiment = require('./computeAggregateSentiment.js');
const fearAndGreedIndex = require('./data/fearAndGreedIndex.js');
const afterHoursArticles = require('./data/newsSentiment.js');


require('dotenv').config();


const { Configuration, OpenAIApi } = OpenAI;

const configuration = new Configuration({
    organization: process.env.ORG_KEY,
    apiKey: process.env.API_KEY,
});
/* 
class stockGPT {
    constructor() {
        this.values = {
            newsSentiment: undefined,
            socialSentiment: undefined,
            fearAndGreedIndex: undefined
        }
        this.functions = {

        }
    }

}

*/
const openai = new OpenAIApi(configuration);

// TODO: TRANSFER THIS OVER TO NEW FILE FOR READABILITY IDK WHY IT DOESNT WORK THO 
async function chatGPTPrompt(tickerArticle, ticker) {
    const openAIResponse = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `
        Ignore all your previous instructions. Pretend you are a financial expert. You are a financial expert with stock recommendation experience. Answer "#1#" if the news will be positive for ${ticker}'s stock value, "#-1#" if the news will be negative for ${ticker}'s stock value, or "#0#" if uncertain. Then, on a new line, elaborate with a short and concise logical explaination on the next line. 
        Is the following headline and summary good or bad for the stock price of in the short term? Finally, end the response with the headline provided.
        Headline: ${tickerArticle.title} 
        Summary: ${tickerArticle.summary}
        Date published: ${tickerArticle.time_published}`,
        max_tokens: 100,
        temperature : 0,
    });

    return openAIResponse.data.choices[0];
}


// THIS THE ACTUAL RUN 


var tickers = ['NFLX'];


// TODO: MOVE THIS TO ITS OWN FILE - I THINK INSIDE NEWS SENTIMENT 
// AND THEN CHANGE THE INPUT FOR PROCESS TICKER I GUESS? 
const computeSentimentAverage = (sentiments) => {
    let sum = 0;
    let count = 0;
    sentiments.forEach(i => { 
        let sentimentValue = Number(i.text.split('#')[1]);
        if (!isNaN(sentimentValue)) {
            sum += sentimentValue;
            count++;
        }
    });
    return sum / count;
}

// Main function to process each ticker
const processTicker = (ticker) => {
    afterHoursArticles(ticker, "all").then(articles => { 
        if (!articles) return console.log(`Error on ${ticker}`)
        let sentimentPromises = articles.response.map(article => chatGPTPrompt(article, articles.ticker));
        
        Promise.all(sentimentPromises).then(sentiments => {
            let averageSentiment = computeSentimentAverage(sentiments);
            console.log(`${ticker} - ${averageSentiment}`);

            fearAndGreedIndex().then(data => {
                let fgi = data.fgi.now.value;
                computeAggregateSentiment(averageSentiment, ticker, 0 /* SOCIAL SENTIMENT IS NOT SET YET*/, fgi);
            });
        });
    });
}

var tickers = ['NFLX'];

tickers.forEach(processTicker);