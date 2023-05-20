const axios = require('axios');

async function fearAndGreedIndex() {
    const options = {
        method: 'GET',
        url: 'https://fear-and-greed-index.p.rapidapi.com/v1/fgi',
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY,
          'X-RapidAPI-Host': 'fear-and-greed-index.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

module.exports = fearAndGreedIndex;