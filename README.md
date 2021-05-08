# Balance Auto Earn Money Bot

- Vultr
- Telegram

## Introduction

Balance Bot (BB) makes it easy to balance a portfolio of crypto coins. It continuously checks the latest coin prices and adjusts to number of coins to keep the portfolio balanced. BB can do this fully automated, 24/7, or you can choose to trigger transactions manually when certain coins need to be rebalanced.

The BB application is offered free of charge. It can be installed locally on a PC, in the cloud, on a Raspberry Pi, a capable NAS, etc. 

## Disclaimers

Using the BB application is fully at your own risk, and the developers of BB take no responsibility for any problems that may be caused by the use of BB. As a user, it is your responsibility to check if everything is working as expected, and to stop the application if it appears to be causing problems.

Investing in and trading with cryptocurrencies is risky. You may loose your money. Never invest money that you cannot afford to loose.

There is no guarantee that using BB will lead to positive results.

By using BB, you acknowledge and accept all of the above.

The BB application is made available under the MIT license. For further details, please refer to the LICENSE.txt file which is included with the software.

## Before you start

To use BB, you need an account with a trading platform, where you create your crypto portfolio by buying cryptocurrencies. BB currently only works with a [Binance account](https://www.binance.com/en/register?ref=121753644), a world-leading crypto trading platform. If you don't have a Binance account yet, you can create one using this [link](https://www.binance.com/en/register?ref=121753644) and get a 10% discount on your trading fees. Since BB will be executing buy and sell orders 24/7, any discount is worth it. And... by using the link, you'll support the BB project. :heart:

To further reduce your trading costs, it is advisable to keep some BNB (Binance crypto coin) on your account and use that for paying trading fees. By doing so, Binance will grant an additional 25% discount on every trade. Make sure this is enabled on your Binance [Fee Schedule](https://www.binance.com/en/fee/schedule) page. 

You don't have to make BNB part of your balancing portfolio, but it might be a good idea to do so. This way, you make sure that you always have enough BNB to pay the trading fees and get the additional discount. 

BB executes trades of altcoins versus Bitcoin (BTC). In other words, when your portfolio holds too many of a certain altcoin, it will be sold for BTC, and vice versa. Therefore, BTC always needs to be part of your portfolio. And you can only use BB with altcoins that can be traded for BTC. But this rarely is a limitation.

Finally, Binance applies a minimum order size of 0.0001 BTC. Therefore, please make sure that your total portfolio amount is not too small and/or that you don't split it over too many different coins. Otherwise, trades may get refused and it will be difficult to keep your portfolio in balance. 

## Installation

Ok, with all that out of the way, let's start with the fun part and get BB installed. The installation may be slightly more technical than what you are used to, but by following along step-by-step, you should have it up and running in no time.

### Install Node.js

BB is a web application, and to run it locally on your PC, it requires Node.js to be installed. Start by downloading it:

- For [Windows](https://nodejs.org/dist/v14.16.1/node-v14.16.1-x64.msi)
- For [macOS](https://nodejs.org/dist/v14.16.1/node-v14.16.1.pkg)

Select the downloaded package and follow the installation steps. Just accept the standard settings. There is no need to change anything.

### Install Balance Bot

BB comes with an installer, which needs to be downloaded and stored on your PC. The installer will then download and install the actual BB application. You can also use the installer to install BB updates in the future in a very easy way.

Follow these steps:

1. Download the BB installer [here](https://github.com/hodlerhacks/balance/archive/refs/heads/bot.zip)
2. Unzip the file and copy/move the balance-bot folder to a place that's easily accessible. It's recommended to go for the root of your drive, so the installer is available in `c:\balance-bot`
3. Open the following program:
   - On Windows: Command Prompt
   - On macOS: Terminal
4. Go to the folder where you stored the installer, e.g. `c:\balance-bot`
   - On Windows: type `cd\` to go to the root of your drive. Type `cd balance-bot` to go into the right folder
   - On macOS: type `cd ~` to go to the root of your drive. Type `cd balance-bot` to go into the right folder
5. Start the installer by typing `node install`
6. Wait for the process to complete
7. BB is now installed on your system

Well done, the hard part is over now!  

### Start Balance Bot

To start BB, from the same folder (e.g. `c:\balance-bot`), type `node bb`.

You should see a message saying that a new bot is started, followed by a URL: http://localhost:3001. Open this URL in your browser to get access to the web dashboard.

That's it, you're in, and ready to start your balancing adventure!

### Configure your bot

The application opens on the configuration screen. You're 4 steps away from launching your bot:

1. **Enter your Binance API details**. If you have never created a Binance API, have a look [here](https://www.binance.com/en/support/faq/360002502072) for some help
2. **Adjust your coin settings**. BB uses the Binance API to check which coins are in your trading account. All available coins will be listed in this step. You can now select coins that you may want to excluded from balancing. For the remaining coins you can use the sliders to indicate with which distribution you want to balance. By default, all coins will get an even distribution, and if you're happy with that, you don't have to change anything here
3. **Set your starting balance**. If you just start balancing now, you can also skip this step. However, if you have been balancing for some time already, either manually, or by using an older BB version, you can set your starting balance here. Your starting balance represents the value of each coin in your portfolio when you first started balancing. This information is used to calculate the performance of your portfolio, so it's worth investing a bit of time to get this set up properly. For further hints on how to do this, please hoover your mouse over the (i) icon on the configuration screen
4. **Enter some general settings**. Finally, give your bot a name and set the threshold at which coins need to be balanced. This threshold is the percentage of deviation from the ideal distribution. The default is set to 3%. Let's say you have 10 coins, each with a target distribution of 10%, then BB starts selling/buying coins when the actual distribution is above 10.3% or below 9.7%. If you run BB in the cloud, on a server with a different time zone, then you can adjust the time here as well, so timestamps are shown in your local time. And finally, here you indicate if you want BB to run automatically, or if you want to use it in manual mode. It is advisable to start in manual mode, so you can make sure everything is set up and working as expected. Once you feel comfortable, you can change this setting to automatic mode, lean back and let BB do its thing.

### Stop Balance Bot

To stop BB in Command Prompt or Terminal, type CTRL+C / Control+C once or a few times.

## Updates

When an update of the BB application is available, this will be announced [here](https://twitter.com/hodlerhacks). It is advised to keep an eye on that, so that you're aware of any important updates that may be released.

To install an update, simply open the Command Prompt (Windows) or Terminal (macOS), go into the BB folder (e.g. `c:\balance-bot`), and type `node install`. The latest version will be installed. Once the process completes, you can restart BB by typing `node bb` again.

## Using Balance Bot

The BB application has a number of screens, which are explained in more detail below.

### Portfolio

This is the main screen, where you'll see a table with key data about your portfolio and each coin. It shows the current distribution and the target distribution. If the relative delta between the two exceeds the configured threshold, the last column will show a red 'sell' or a green 'buy' indicator. If you're using BB in manual mode, you can select a row in the table and then confirm that BB should execute an order to the coin back in balance.

This screen also shows some key performance indicators:

1. The value of your portfolio in BTC and the change compared to the starting balance
2. The value of your portfolio in EUR or USD (depending on the toggle in the lower left corner) and the change compared to the starting balance
3. The net change in BTC and as a percentage. These values are a measure of the balancing effect. It compares the value of your portfolio with what it would have been if you wouldn't have done any balancing, but just kept your coins in place after the initial purchase. 
4. The net change in EUR or USD and as a percentage. Let's hope you're seeing positive numbers here :wink:

### Performance

On this screen you'll find four graphs showing how the key performance indicators, as explained above, evolved over time.

### Coin Analysis

This screen shows a graph with the relative price change of the coins in your portfolio since the start date. This gives a quick insight into which coins are your winners, and which are your underperformers.

### Event History

All orders are logged by BB, and in the table on this screen you can go back in time and go through the order history. Possible errors and other system alerts are included here as well. Using the two buttons above the table, you can control what events are shown: orders and/or alerts. The 'filter events' can be used to show events that contain specific text. For instance, by typing BNB, all BNB trades will be shown. 

### Multi-instance

You can use BB to run multiple bots in parallel. To configure a new bot, open the Command Prompt (Windows) or Terminal (macOS), go into the BB folder (e.g. `c:\balance-bot`), and type `node bb new`. Your existing bot(s) will be started as with `node bb`, but you'll also see a new bot being started. If it is your 2nd bot, it will have id 002, and you can access it through the indicated URL: http://localhost:3002. This is where you can configure your new bot. The first bot will still be available through http://localhost:3001. This way you can access each bot through individual tabs in your browser, and easily switch between them.

## Frequently Asked Questions (FAQ)

##### How many coins can I hold in my portfolio?

There is no specific limit. The only thing to keep in mind is that Binance applies a minimum order size of 0.0001 BTC. Therefore, please make sure that your total portfolio amount is not too small and/or that you don't split it over too many different coins. Otherwise, trades may get refused and it will be difficult to keep your portfolio in balance. 

##### Are stable coins and EUR supported?

The short answer: yes! BB supports any .../BTC and BTC/... pair on Binance. Stable coins and EUR typically don't have a .../BTC pair like altcoins. However, BB will automatically use the equivalent BTC/... pair instead to make trades. In this case, the table on the portfolio screen will show 'reverse' in the order side column (as a sell order is reversed into a buy order through the BTC/... pair, and vice versa). 

##### No trades are being executed

If you're running BB on your PC, make sure that it doesn't power off, as that will obviously stop your bot(s). 

In any case, depending on how the market moves, and your coins in particular, it is quite common that not much happens over the span of several hours. This also very much depends on the threshold percentage that you've configured, of course. 

If you're wondering if the bot is still running, open the web dashboard, and check the status in the top right corner. It should show 'connected' and a recent timestamp.

##### How often is the portfolio table refreshed?

The refresh rate is 10 seconds. 

##### My trading tool shows a different distribution 

Trading tools often show the distribution of your portfolio. However, this data is not updated as frequently as with BB. As a result, you may see (significant) differences between the two applications. In case of doubt, you may want to check the real-time price information in your trading tool and compare those with the prices in BB. You should see prices that are (almost) identical. 

##### My BTC balance is off, but BB doesn't place an order

Your BTC is never sold or bought. It is used as the exchange currency for your other coins. As a result, you may see a BTC distribution that is beyond your configured threshold. That isn't problem, as with subsequent altcoin trades, the BTC distribution will be corrected automatically.