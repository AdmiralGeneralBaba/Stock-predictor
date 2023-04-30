# Stock-predictor
Uses gpt-4 to predict the intra-day movement of stocks. 

Uses the findings and methodology of this paper : https://arxiv.org/pdf/2304.07619.pdf, and automates the process

Aim of this project:
1. To be able to predict the day-to-day movement of a stock
2. To be able to locate stocks at the bottom 10th percentile of the NYSE, find which ones have headlines with dates less then 1 - 2 days away
3. To be able to find stocks with these headlines, that return as NO - predicted to be moving downwards, as GPT seems to have the highest success with this 
4. To be able to automatically fill in the order, and input in the risk tolerance based on the information of the headline 
5. To be able to keep track of live data, so that in the trades it is holding, another GPT agent will pull out the trade if the headline results in 'YES', meaning the short position will make a loss, or 'UNKNOWN' if during the trading day it is revealed, as to mitigate risk. 
