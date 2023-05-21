const OpenAI = require ('openai');
// COMPUTE DATA / CALCULATOR
const computeAggregateSentiment = require('./computeAggregateSentiment.js');

// INPUT DATAS
const fearAndGreedIndex = require('./data/fearAndGreedIndex.js');
const afterHoursArticles = require('./data/newsSentiment.js');
const getMessages = require('./data/socialSentiment.js');

require('dotenv').config();

const { Configuration, OpenAIApi } = OpenAI;

const configuration = new Configuration({
organization: process.env.ORG_KEY,
    apiKey: process.env.API_KEY,
});
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


async function chatGPTPromptSocial(message, ticker) {

    const openAIResponse = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `
        Ignore all your previous instructions. Pretend you are a financial expert. You are a financial expert with public sentiment analysis experience. Answer "#1#" if the StockTwits post has a positive sentiment for ${ticker}, "#-1#" the StockTwits post has a negative sentiment for ${ticker}, or "#0#" if uncertain. Then, on a new line, elaborate with a concise logical explaination on the next line. 
        Is the following StockTwits post indicative of a positive, negative, or unknown sentiment for ${ticker}? Finally, end the response with the username provided.
        Headline: ${message.username}
        Body: ${message.body}`,
        max_tokens: 100,
        temperature : 0,
    });

    return openAIResponse.data.choices[0];
}

// THIS THE ACTUAL RUN 
// TODO: MOVE THIS TO ITS OWN FILE - I THINK INSIDE NEWS SENTIMENT  -- WOULDNT WORK BECASUE WE USE THE SAME FUNC FOR OTHER SENTIMENT ??? DONT KNOW WHERE 2 PUT THIS
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
const processTicker = async (ticker) => {
    try {
        const messageIterations = 5; // This number is how many pages of messages we scan.
        
        // Get articles and messages for the given ticker
        const [articles, messages] = await Promise.all([
            afterHoursArticles(ticker),
            getMessages(messageIterations, ticker)
        ]);

        if (!articles || !messages) {
            return console.log(`Error on ${ticker}`);
        }

        // Compute sentiments
        const [newsSentiments, socialSentiments] = await Promise.all([
            Promise.all(articles.response.map(article => chatGPTPrompt(article, ticker))),
            Promise.all(messages.response.map(message => chatGPTPromptSocial(message, ticker)))
        ]);

        // Compute averages
        const averageNewsSentiment = computeSentimentAverage(newsSentiments);
        const averageSocialSentiment = computeSentimentAverage(socialSentiments);

        // Get Fear and Greed Index and compute aggregate sentiment
        const data = await fearAndGreedIndex();
        const fgi = data.fgi.now.value;

        computeAggregateSentiment(averageNewsSentiment, ticker, averageSocialSentiment, fgi);

    } catch (error) {
        console.error(`Failed to process ticker: ${ticker}. Error: ${error.message}`);
    }
};

// COMPANY TICKERS ARRAY
var tickers = ['NFLX', 'META', 'TSLA'];

tickers.forEach(ticker => { /* TICKER TICK TICK ICK TOK */
    console.log(`Beginning process for ${ticker}`);
    processTicker(ticker);
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