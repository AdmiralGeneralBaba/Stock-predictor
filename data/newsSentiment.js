const axios = require('axios');
const moment = require('moment-timezone');


function isWithinOperatingHours(timeString) {
    const format = "YYYYMMDDTHHmmss";
    const date = moment.tz(timeString, format, "Europe/London");
    
    // Get current date and time in London timezone
    const now = moment().tz("Europe/London");
    const startOfAfterHours = moment(now).subtract(1, 'days').set({hour: 16, minute: 30, second: 0, millisecond: 0});
    const endOfAfterHours = moment(now).set({hour: 8, minute: 0, second: 0, millisecond: 0});

    // If current date is not a weekday, adjust start and end of after-hours
    if (now.day() === 0 || now.day() === 6) {
        startOfAfterHours.subtract(1, 'days');
        endOfAfterHours.subtract(1, 'days');
    }

    return date.isBetween(startOfAfterHours, endOfAfterHours, null, '[]');
}



async function afterHoursArticles(ticker, index) {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=1&apikey=75E6A1OE5RSA3LIS`;
    return axios.get(url, {
        headers: {'User-Agent': 'request'}
    }).then(response => {
        if (!response.data.feed.length) return;
        if (index === 0) {
            return {
                response: response.data.feed[0],
                ticker: ticker
            };
        } else if (index === "all") {
            var afterHoursArticles = [];
            for (var i = 0; i < response.data.feed.length; i++) {
                const timePublished = response.data.feed[i].time_published;
                if (!isWithinOperatingHours(timePublished)) {
                    afterHoursArticles.push(response.data.feed[i]);
                }
            }
            return {
                response: afterHoursArticles,
                ticker: ticker
            };
        }
    })
}


module.exports = afterHoursArticles;