const OpenAI = require ('openai');
const { Configuration, OpenAIApi } = OpenAI;

const configuration = new Configuration({
    organization: process.env.ORG_KEY,
    apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

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

module.exports = chatGPTPrompt;