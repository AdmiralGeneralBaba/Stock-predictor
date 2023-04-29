const { StringStream } = require("scramjet");
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

app.post('/', async (req, res) => {
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

  try {
    const tickersResponse = await axios.get('http://localhost:3001/tickers');
    const tickersData = tickersResponse.data;
    console.log(tickersData); // log the tickers data

    // Filter the data to find the ticker matching the message
    const tickerData = tickersData.filter(ticker => ticker.symbol === message)[0];
    console.log("Ticker:", tickerData.symbol);

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
  } catch (err) {
    res.status(500).send("An error occurred: " + err);
  }
});


app.get('/tickers', async (req, res) => {
  try {
    const response = await axios.get("https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=75E6A1OE5RSA3LIS");
    const data = response.data;
    
    const rows = data.split('\n');  // split the CSV data by rows
    rows.shift();  // remove the first row (column headers)

    const symbols = rows.map(row => row.split(',')[0]);  // assuming the ticker is the first column

    const marketCaps = [];
    const BATCH_SIZE = 100;  // Adjust this according to the API's limit

    // Split symbols into batches and make requests for each batch
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batchSymbols = symbols.slice(i, i + BATCH_SIZE);
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${batchSymbols.join(',')}`;
      try {
        const batchResponse = await axios.get(url);
        const results = batchResponse.data.quoteResponse.result;

        results.forEach(result => {
          marketCaps.push({ symbol: result.symbol, marketCap: result.marketCap });
        });
      } catch (error) {
        console.error(`Error fetching market cap for ${batchSymbols.join(', ')}: ${error}`);
      }
    }

    // Calculate the 10th percentile market cap
    marketCaps.sort((a, b) => a.marketCap - b.marketCap);
    const percentile10th = marketCaps[Math.floor(marketCaps.length * 0.1)].marketCap;

    // Filter the symbols that are in the bottom 10th percentile
    const symbolsBottom10thPercentile = marketCaps.filter(({ marketCap }) => marketCap <= percentile10th)
                                                   .map(({ symbol }) => symbol);

    console.log("Symbols in the bottom 10th percentile:", symbolsBottom10thPercentile);

    res.send("Symbols in the bottom 10th percentile: " + symbolsBottom10thPercentile.join(', '));
  } catch (err) {
    res.status(500).send("An error occurred: " + err);
  }
});

app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port);
});
