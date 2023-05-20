var weights = { /* SHOULD TOTAL TO 1 (PERCENT IN DECIMAL VALUE) */
    newsSentiment: 0, 
    socialSentiment: 0,
    fearAndGreedIndex: 0,
} 

function computeAggregateSentiment(newsSentiment, ticker, socialSentiment, fearAndGreedIndex) {
    console.log(`${ticker} - News Sentiment: ${newsSentiment}
    Market Fear & Greed Index: ${fearAndGreedIndex}`);
}

module.exports = computeAggregateSentiment;