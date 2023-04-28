// a express server which will handle api requests coming in and respond back with a json object. it will use body parser as well as cors
const OpenAI = require ('openai');
const { Configuration, OpenAIApi } = OpenAI;


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001 ; 

const configuration = new Configuration({
    organization: "org-BHaORzAJnznzo598IHG5xn2d",
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);


app.use(bodyParser.json()); 
app.use(cors());

app.post('/' , async (req, res) => {
    const { message } = req.body;
   const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `
    Forget all your previous instructions. Pretend you are a financial expert. You are
    a financial expert with stock recommendation experience. Answer “YES” if good
    news, “NO” if bad news, or “UNKNOWN” if uncertain in the first line. Then
    elaborate with one short and concise sentence on the next line. Is this headline
    good or bad for the stock price of`  + `  in the ` + ` term?
    Headline:` + ` 
    
    `  + message, 
    max_tokens: 100,
    temperature : 0,
   })
   console.log(response.data.choices[0])
   if(response.data.choices[0].text){
        res.json({message: response.data.choices[0].text})
   }
});

app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port);
});

