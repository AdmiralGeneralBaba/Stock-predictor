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
   const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt:"Say this is a test",
    max_tokens: 7,
    tempreature: 0,
   })
   console.log(response.data)
   if(response.data.choices[0].text){
        res.json({message: response.data.choices[0].text})
   }
});

app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port);
});

