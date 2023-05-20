const OpenAI = require ('openai');
const axios = require('axios');
const moment = require('moment-timezone');

const { Configuration, OpenAIApi } = OpenAI;

const configuration = new Configuration({
    organization: "org-BHaORzAJnznzo598IHG5xn2d",
    apiKey: "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",
});

const openai = new OpenAIApi(configuration);

function isWithinOperatingHours(timeString) {
    const format = "YYYYMMDDTHHmmss";
    const date = moment.tz(timeString, format, "Europe/London");

    const hours = date.hours();
    const minutes = date.minutes();
    
    return (hours > 8 || (hours === 8 && minutes >= 0)) && (hours < 16 || (hours === 16 && minutes < 30));
}



async function afterHoursArticles(ticker, index) {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=1&apikey=75E6A1OE5RSA3LIS`;
    return axios.get(url, {
        headers: {'User-Agent': 'request'}
    }).then(response => {
        if (index === 0) {
            return {
                response: response.data.feed[0],
                ticker: ticker
            };
        } else if (index === "all") {
            var afterHoursArticles = [];
            for (var i = 0; i < response.data.feed.length; i++) {
                const timePublished = response.data.feed[i].time_published;
                if (!isWithinOperatingHours(timePublished)) afterHoursArticles.push(response.data.feed[i]);
            }
            return {
                response: afterHoursArticles,
                ticker: ticker
            };
        }
    })
}


afterHoursArticles("META", "all").then(i => { 
    var sentimentCollection = [];
    var average = 0;

    // Store all promises in an array
    var promises = [];
    for (var j = 0; j < i.response.length; j++) {
        promises.push(chatGPTPrompt(i.response[j], i.ticker));
    }

    // Use Promise.all to wait for all promises to resolve before proceeding
    Promise.all(promises).then(values => {
        sentimentCollection = values;
        // Ensure that every element is a number before trying to calculate the average
        sentimentCollection.forEach(i => { 
            console.log(i.text.split('#')[1])
            i = i.text.split('#')[1]
            i = Number(i);
            if (!isNaN(i)) {
                average += i;
            }
        });

        average = average / sentimentCollection.length;
        console.log(average);
    });
});

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