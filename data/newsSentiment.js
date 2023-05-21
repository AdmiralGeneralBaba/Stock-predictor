const axios = require('axios');
const moment = require('moment-timezone');


function isOutsideOperatingHours(timeString) { /* ACCEPTS !8AM - 4PM and if weekend */
    const format = "YYYYMMDDTHHmmss";
    const date = moment.tz(timeString, format, "Europe/London");

    // Get current date and time in London timezone
    const now = moment().tz("Europe/London");
    const startOfAfterHours = moment(now).subtract(1, 'days').set({hour: 16, minute: 30, second: 0, millisecond: 0});
    const endOfAfterHours = moment(now).set({hour: 8, minute: 0, second: 0, millisecond: 0});

    // If the current day is a weekday, check if the time is outside operating hours
    if (now.day() !== 0 && now.day() !== 6) {
        return !date.isBetween(startOfAfterHours, endOfAfterHours);
    }

    // If the current day is a weekend, any time is considered outside operating hours
    return false;
}



async function getafterHoursArticles(ticker) {
    console.log(`Collecting news for ${ticker} (Alphavantage).`);
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=1&apikey=75E6A1OE5RSA3LIS`;
    return axios.get(url, {
        headers: {'User-Agent': 'request'}
    }).then(response => {
        var afterHoursArticles = [];
        for (var i = 0; i < response.data.feed.length; i++) {
            const timePublished = response.data.feed[i].time_published;
            if (!isOutsideOperatingHours(timePublished)) {
                afterHoursArticles.push(response.data.feed[i]);
            }
        }
        return {
            response: afterHoursArticles,
        };
    })
}


module.exports = getafterHoursArticles;