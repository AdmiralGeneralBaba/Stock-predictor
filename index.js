const OpenAI = require ('openai');
const { Configuration, OpenAIApi } = OpenAI;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001 ; 

const axios = require('axios');

const configuration = new Configuration({
    organization: "org-BHaORzAJnznzo598IHG5xn2d",
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

app.use(bodyParser.json()); 
app.use(cors());

app.post('/' , async (req, res) => {
  const { message } = req.body;

  //Alpha vantage go:
  const url = 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers='+ message +'&limit=1&apikey=75E6A1OE5RSA3LIS';

  let headline = "";
  try {
    const response = await axios.get(url, {
      headers: {'User-Agent': 'request'}
    });
    headline = response.data.feed[0].title;  
    console.log(headline);  // log the first headline
  } catch (error) {
    console.log(error);
  }
  
  const openAIResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `
    Forget all your previous instructions. Pretend you are a financial expert. You are
    a financial expert with stock recommendation experience. Answer “YES” if good
    news, “NO” if bad news, or “UNKNOWN” if uncertain in the first line. Then
    elaborate with one short and concise sentence on the next line. Is this headline
    good or bad for the stock price of `  + message + ` in the short term?
    Headline: ${headline}`,
    max_tokens: 100,
    temperature : 0,
  })

  console.log(openAIResponse.data.choices[0])
  if(openAIResponse.data.choices[0].text){
        res.json({message: openAIResponse.data.choices[0].text})
  }
});

app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port);
});
