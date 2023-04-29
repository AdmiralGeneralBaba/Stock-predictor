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
  try {
    const symbolsBottom10thPercentile = req.body.symbols;  // Assume symbols sent in body
    let responses = [];

    for(let i = 0; i < Math.min(10, symbolsBottom10thPercentile.length); i++) {
      const symbol = symbolsBottom10thPercentile[i];
      
      const url = 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers='+ symbol +'&limit=1&apikey=75E6A1OE5RSA3LIS';

      let headline = "";
      try {
        const response = await axios.get(url, {
          headers: {'User-Agent': 'request'}
        });
        headline = response.data.feed[0].title;
      } catch (error) {
        console.log(error);
        continue;
      }

      const openAIResponse = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `
        Forget all your previous instructions. Pretend you are a financial expert. You are
        a financial expert with stock recommendation experience. Answer “YES” if good
        news, “NO” if bad news, or “UNKNOWN” if uncertain in the first line. Then
        elaborate with one short and concise sentence on the next line. Is this headline
        good or bad for the stock price of `  + symbol + ` in the short term?
        Headline: ${headline}`,
        max_tokens: 100,
        temperature : 0,
      });

      console.log(openAIResponse.data.choices[0]);
      responses.push({symbol: symbol, response: openAIResponse.data.choices[0].text});
    }

    if(responses.length > 0) {
      res.json({messages: responses});
    } else {
      throw new Error("No responses");
    }
  } catch (err) {
    res.status(500).send("An error occurred: " + err);
  }
});



app.get('/tickers', async (req, res) => {
  try {
    const response = await axios.get("https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=75E6A1OE5RSA3LIS");
    const data = response.data;

    const rows = data.split('\n');
    rows.shift();

    const symbols = rows.map(row => row.split(',')[0]);

    console.log(`Fetched ${symbols.length} symbols`);

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

    console.log(`Fetched market cap for ${marketCaps.length} symbols`);

    const sortedMarketCaps = marketCaps.sort((a, b) => a.marketCap - b.marketCap);
    const percentileIndex = Math.ceil(sortedMarketCaps.length * 0.1) - 1;
    const percentile10th = sortedMarketCaps[percentileIndex].marketCap;

    console.log(`10th percentile market cap: ${percentile10th}`);

    const symbolsBottom10thPercentile = marketCaps.filter(({ marketCap }) => marketCap <= percentile10th)
                                                   .map(({ symbol }) => symbol);

    console.log(`Symbols in the bottom 10th percentile: ${symbolsBottom10thPercentile.length}`);

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
