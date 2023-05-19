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


var sentimentCollection = [

]

async function getSentiment(message) {
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


    console.log(headline);
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
          console.log({message: openAIResponse.data.choices[0].text + timepublished})
    }
  } catch (err) {
    console.log("An error occurred: " + err);
  }
}

function sentimentAdder(sentiment, sentimentCollection) {

}

getSentiment("META");
setInterval(() => {
  sentimentCollection = sentimentAdder(getSentiment("META"), sentimentCollection) ;
}, 60 * 1000);

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
