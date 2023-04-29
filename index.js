const { StringStream } = require("scramjet");
const OpenAI = require ('openai');
const { Configuration, OpenAIApi } = OpenAI;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001 ; 

const axios = require('axios');
const { time } = require("console");

const configuration = new Configuration({
    organization: "org-BHaORzAJnznzo598IHG5xn2d",
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

app.use(bodyParser.json()); 
app.use(cors());

// Cache variables
let symbolsBottom10thPercentileCache;
let symbolsBottom10thPercentileCacheTimestamp;

async function getSymbolsBottom10thPercentile() {
  const CACHE_VALIDITY = 60 * 60 * 1000; // 1 hour in milliseconds
  const now = Date.now();

  // If the cache is valid and not too old, return the cached data
  if (symbolsBottom10thPercentileCache && now - symbolsBottom10thPercentileCacheTimestamp < CACHE_VALIDITY) {
    return symbolsBottom10thPercentileCache;
  }

  // Otherwise, fetch the data and update the cache
  try {
    const response = await axios.get("https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=75E6A1OE5RSA3LIS");
    const data = response.data;
  
    const rows = data.split('\n');
    rows.shift();
  
    const symbols = rows.map(row => row.split(',')[0]);
  
    const marketCaps = [];
    const BATCH_SIZE = 100;
  
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
  
    const sortedMarketCaps = marketCaps.sort((a, b) => a.marketCap - b.marketCap);
    const percentileIndex = Math.ceil(sortedMarketCaps.length * 0.1) - 1;
    const percentile10th = sortedMarketCaps[percentileIndex].marketCap;
  
    const symbolsBottom10thPercentile = marketCaps.filter(({ marketCap }) => marketCap <= percentile10th)
                                                   .map(({ symbol }) => symbol);

    // Update the cache
    symbolsBottom10thPercentileCache = symbolsBottom10thPercentile;
    symbolsBottom10thPercentileCacheTimestamp = now;
  
    return symbolsBottom10thPercentile;
  } catch (err) {
    console.error("An error occurred: " + err);
  }
}



app.post('/', async (req, res) => {
  const { message } = req.body;

  // try {
  //   // Log the first 10 symbols from the bottom 10th percentile
  //   const symbolsBottom10thPercentile = await getSymbolsBottom10thPercentile();
  //   const symbolsBottom10thPercentileFirst10 = symbolsBottom10thPercentile.slice(0, 10);
  //   console.log('First 10 symbols in the bottom 10th percentile:', symbolsBottom10thPercentileFirst10);
  // } catch (error) {
  //   console.error("An error occurred when fetching the bottom 10th percentile symbols: " + error);
  // }

  //Alpha vantage go:
  const url = 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers='+ message +'&limit=1&apikey=75E6A1OE5RSA3LIS';

  let headline = "";
  let timepublished = "";
  let summary = "";
  try {
    const response = await axios.get(url, {
      headers: {'User-Agent': 'request'}
    });
    console.log(response.data);
    headline = response.data.feed[0].title; 
    timepublished = response.data.feed[0].time_published;
    summary = response.data.feed[0].summary;


    console.log(headline);  // log the first headline
  } catch (error) {
    console.log(error);
  }

  try {
  
    const openAIResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `
      Forget all your previous instructions. Pretend you are a financial expert. You are
      a financial expert with stock recommendation experience. Answer “YES” if good
      news, “NO” if bad news, or “UNKNOWN” if uncertain in the first line. Then
      elaborate with one short and concise sentence on the next line. Is this headline and summary
      good or bad for the stock price of `  + message + ` in the short term?
      Headline: ${headline} + ${summary} + ${timepublished}`,
      max_tokens: 100,
      temperature : 0,
    })

    console.log(openAIResponse.data.choices[0])
    if(openAIResponse.data.choices[0].text){
          res.json({message: openAIResponse.data.choices[0].text + timepublished})
    }
  } catch (err) {
    res.status(500).send("An error occurred: " + err);
  }
});



app.get('/tickers', async (req, res) => {
  try {
    const symbolsBottom10thPercentile = await getSymbolsBottom10thPercentile();
    
    console.log(`Symbols in the bottom 10th percentile: ${symbolsBottom10thPercentile.length}`);

    const symbolsBottom10thPercentileFirst10 = symbolsBottom10thPercentile.slice(0, 10);
    console.log('First 10 symbols in the bottom 10th percentile:', symbolsBottom10thPercentileFirst10);

    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet_data = symbolsBottom10thPercentile.map(symbol => [symbol]);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'});
    res.setHeader('Content-Disposition', 'attachment; filename=stocks.xlsx');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error("An error occurred: " + err);
    res.status(500).send("An error occurred: " + err);
  }
});






app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port);
});
