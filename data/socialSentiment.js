/* STOCKTWITS */
var axios = require('axios');
const getMessages = async (numMessages, ticker) => {  
    console.log(`Collecting social stock posts for ${ticker} (StockTwit).`);
    let max; 
    var socialMediaPosts = [];
    try {
        for (let i = 0; i < numMessages; i++) {
            const response = await axios.get(`https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json?max=${max}`);
            for (let j = 0; j < response.data.messages.length; j++) {
                socialMediaPosts.push(response.data.messages[j]);
            }
            max = response.data.cursor.max;
        }
        return {
            response: socialMediaPosts,
        };
    } catch (error) {
        console.log(error);
    }
}
module.exports = getMessages;