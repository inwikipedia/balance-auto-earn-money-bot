'use strict';

const ccxt = require('ccxt');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fns = require('date-fns');
const api = require('binance');
const exchangeId = 'binance';
const exchangeClass = ccxt[exchangeId];
let exchange;
let binanceRest;
global.ticker = {};

let config;
let allSymbols;
let currentCoins = [];
let previousCoins = [];
let lastBalances;
let mybalances;
let lastPerformanceEmitted;
let lastPerformanceStored;
let lockOrders = false;
let lastOrders;
const getBalancesInterval = 10 * 1000;
const retryInterval = 60 * 1000;
const validateOrderInterval = 10 * 1000;
let initialPerformanceStored;
let socket = null;
const logPageSize = 20;
let pidBalances;
let pidOrders;

const botID = process.argv[2] || '001';
const pattern = /^[0-9]{3}$/
if (!pattern.test(botID)) {
    console.log(`Error: Invalid argument ${botID}, must be a 3 digit number`)
    return process.exit(1);
}

const configfile = 'config.json';
const logfile = `event-log-${botID}.json`;
const performancefile = `performance-log-${botID}.json`;

const adapter = new FileSync(logfile);
const dbLogs = low(adapter);
dbLogs.defaults({ logs: [] })
    .write();

const adapter2 = new FileSync(performancefile);
const dbPerformance = low(adapter2);
dbPerformance.defaults({ data: [] })
    .write();

const adapter3 = new FileSync(configfile);
const dbConfig = low(adapter3);
dbConfig.defaults({ bots: [] })
    .write();

const PORT = `3${botID}`;

const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

config = getConfiguration(botID);

http.listen(PORT);

if (config.headless) {
    console.log(`Bot ${botID} started in automatic mode | open: http://localhost:${PORT}`);
} else {
    console.log(`Bot ${botID} started in manual mode | open: http://localhost:${PORT}`);
}

const io = require('socket.io')(http, {
    // transports: 'websocket',
});

io.on("connection", sckt => {
    config = getConfiguration(botID);
    let emittedConfig;

    if (config.apiKey == '') {
        emittedConfig = config;
    } else {
        emittedConfig = {
            ...config,
            apiKey: '************',
            apiSecret: '************',
        }
    }

    console.log(`Bot ${botID} | client connected`);
    socket = sckt;

    socket.emit('status', 'connected');
    socket.emit('configuration', emittedConfig);

    socket.on("get-logs", (filter) => {
        emitHistory(logPageSize, filter);
    });

    socket.on("get-portfolio", (api) => {
        getPortfolio(api);
    });

    socket.on("store-configuration", (input) => {
        storeConfiguration(input);
    });

    socket.on("get-starting-balances", () => {
        getStartingBalances();
    });

    socket.on("get-initial-trades", (input) => {
        getInitialTrades(input);
    });

    socket.on("market-order", (coins) => {
        placeOrder('market', coins);
    });

    socket.on("limit-order", (coins) => {
        placeOrder('limit', coins);
    });

    socket.on("disconnect", (reason) => {
        console.log(`Bot ${botID} | client disconnected: ` + reason);
        socket = null;
    });

    if (config.apiKey != '') {
        initExchange();
        init();
    }
});

async function reset() {
    await initExchange();
    init();
}

async function initExchange() {
    await setExchange(config.apiKey, config.apiSecret);
    await loadSymbols();
    currentCoins = await getCoins();
    initws();
}

async function init() {
    initialPerformanceStored = false;

    if (lastBalances) socket.emit('balances', lastBalances);
    emitPerformance();

    emitHistory(logPageSize);

    if (pidBalances) clearTimeout(pidBalances);

    // Check that all global tickers are loaded
    let check;
    while (check != currentCoins.length-1) {
        check = 0;
        currentCoins.forEach((coin) => {
            if (coin.coin != 'BTC' && global.ticker[noslash(coin.symbol)]) check++;
        })
        await sleep(200);
    }

    await getBalances();
    getStartingBalances();
}

async function setExchange(apiKey, apiSecret) { 
    exchange = new exchangeClass({
        'apiKey': apiKey,
        'secret': apiSecret,
        'timeout': 30000,
        'enableRateLimit': true,
    });

    binanceRest = new api.BinanceRest({
        key: apiKey, 
        secret: apiSecret, 
        timeout: 15000, 
        recvWindow: 10000, 
        handleDrift: false,
    });
}

async function initws() {
    let mysymbols = [];

    currentCoins.forEach((coin) => {
        if (coin.coin != 'BTC') mysymbols.push(noslash(coin.symbol));
    });
    mysymbols.push('BTCEUR');
    mysymbols.push('BTCUSDT');

    const binanceWS = new api.BinanceWS(true);
    const streams = binanceWS.streams;

    binanceWS.onCombinedStream(
        mysymbols.map((symbol) => streams.ticker(symbol)),
        streamEvent => {
            let symbol = (streamEvent.stream.split('@')[0]).toUpperCase();
            global.ticker[symbol] = streamEvent.data.currentClose;
        }
    );

    binanceWS.onUserData(
        binanceRest,
        data => {
            updateNumberCoins(data);
        },
        60000
    )
    .then(ws => {
    });
}

async function loadSymbols() {
    try {
        await exchange.loadMarkets();
        allSymbols = exchange.symbols;
    } catch (e) {
        await handleError(e, 'loadSymbols()');
        loadSymbols();
    }
}

async function getFiat() {
    let EUR = 0;
    let USD = 0;

    try {
        EUR = global.ticker['BTCEUR'];
        USD = global.ticker['BTCUSDT'];
    } catch (e) {
        await handleError(e, 'getFiat()');
    }

    return {
        eur: Number(EUR),
        usd: Number(USD),
    };
}

async function getInitialTrades(input) {
    let orders;
    const limit = 1;

    const startdate = input.startdate;
    let coins = input.coins;

    logHistory('success', 'Retrieving initial trades - this may take a minute');

    try {
        for (const coin of coins) {
            if (coin.coin != 'BTC') {
                orders = await exchange.fetchOrders(coin.symbol, Date.parse(startdate), limit);
                const order = orders[0];
                const reverse = (coin.symbol.includes('BTC/'));

                let coinamount;
                if (order.side == 'buy' && reverse == false) coinamount = order.amount;
                if (order.side == 'buy' && reverse == true) coinamount = 0;
                if (order.side == 'sell' && reverse == false) coinamount = 0;
                if (order.side == 'sell' && reverse == true) coinamount = order.amount * order.price;

                coin.coinamount = formatResult(coinamount, 8);
                coin.price = formatResult(order.price, 8);
            } else {
                coin.coinamount = 0;
                coin.price = 1;
            }
        }
        if (socket) socket.emit("initial-trades", coins);

        logHistory('success', 'Initial trades retrieved');
    } catch (e) {
        if (e.toString().includes('API-key format invalid')) {
            logHistory('error', 'Binance API key is invalid');
        } else if (e.toString().includes('AuthenticationError')) {
            logHistory('error', 'Binance API key or API secret are invalid');
        } else await handleError(e, 'recreateHistory()');
    }
}

async function recreateHistory(input) {
    let orders;
    let includedCoins = [];

    logHistory('success', 'Performance recreation process started - this may take several minutes');

    input.portfolio.forEach((coin) => {
        if (coin.coin != 'BTC' && !coin.excluded) includedCoins.push({
            coin: coin.coin,
            symbol: coin.symbol,
        });
    });

    let coinorders = [];
    try {
        const startdate = fns.format(fns.parseISO(input.startdate.replace(/\//g, '-')), "yyyy-MM-dd'T'HH:mm:ss");
        for (const coin of includedCoins) {
            if (coin.coin != 'BTC') orders = await exchange.fetchOrders(coin.symbol, Date.parse(startdate));
            orders.forEach((order) => {
                const reverse = (coin.symbol.includes('BTC/'));
                // Convert UTC timestamp to local time
                const timestamp = fns.format(fns.parseISO(order.datetime), "yyyy/MM/dd HH:mm:ss");
                const date = fns.format(fns.parseISO(order.datetime), "yyyy/MM/dd");

                let coinamount;
                if (order.side == 'buy' && reverse == false) coinamount = order.amount;
                if (order.side == 'buy' && reverse == true) coinamount = -order.amount * order.price;
                if (order.side == 'sell' && reverse == false) coinamount = -order.amount;
                if (order.side == 'sell' && reverse == true) coinamount = order.amount * order.price;

                coinorders.push({
                    timestamp: timestamp,
                    date: date,
                    coin: coin.coin,
                    symbol: coin.symbol,
                    type: order.type,
                    side: order.side,
                    reverse: reverse,
                    amount: formatResult(order.filled, 8),
                    coinamount: formatResult(coinamount, 8),
                    price: formatResult(order.price, 8),
                });

                let btcamount;
                if (order.side == 'buy' && reverse == false) btcamount = -order.amount * order.price;
                if (order.side == 'buy' && reverse == true) btcamount = order.amount;
                if (order.side == 'sell' && reverse == false) btcamount = order.amount * order.price;
                if (order.side == 'sell' && reverse == true) btcamount = -order.amount;

                // Inject equivalent BTC order
                coinorders.push({
                    date: date,
                    coin: 'BTC',
                    coinamount: formatResult(btcamount, 8),
                });
            });
        }

        coinorders.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0));

        // Recreate event-log
        dbLogs.get('logs')
            .remove()
            .write();

        coinorders.forEach((order) => {
            let log;
            if (order.coin != 'BTC') {
                log = {
                    time: order.timestamp,
                    type: 'order',
                    event: `Order: ${order.symbol} ${order.type} ${order.side} #${order.amount} @${order.price}`,
                };

                dbLogs.get('logs')
                    .push(log)
                    .write();
            }
        });

        // Recreate performance-log
        const dates = fns.eachDayOfInterval({
            start: fns.sub(new Date(input.startdate), {days: 1}),
            end: new Date()
        }).map(d => fns.format(d, 'yyyy/MM/dd'))

        let daybalance = [];
        input.portfolio.forEach((coin) => {
            daybalance[coin.coin] = [];
            let balance = coin.startnumber;
            dates.forEach((date, i) => {
                if (i == 0) daybalance[coin.coin][date] = balance;
                let match = coinorders.filter(o => o.coin == coin.coin && o.date == date);
                if (match.length != 0) {
                    let change = match.reduce((total, coin) => {
                        total += coin.coinamount
                        return total
                    }, 0);
                    balance += change;
                }
                daybalance[coin.coin][date] = balance;
            });
        });

        const extendedCoins = [...includedCoins];
        extendedCoins.push({
            coin: 'BTCEUR',
            symbol: 'BTC/EUR',
        });
        extendedCoins.push({
            coin: 'BTCUSD',
            symbol: 'BTC/USDT',
        });

        let dayCloses = [];
        for (const coin of extendedCoins) {
            dayCloses[coin.coin] = await getCandles(coin.symbol, fns.sub(new Date(input.startdate), { days: 1 }));
        }

        dbPerformance.get('data')
            .remove()
            .write();

        dates.forEach((date, i) => {
            let log;
            let coins = [];
            if (i == 0) {
                input.portfolio.forEach((coin) => {
                    coins.push({
                        coin: coin.coin,
                        number: coin.startnumber,
                        price: coin.startprice,
                    });
                });
                log = {
                    date: date,
                    eur: dayCloses['BTCEUR'][i],
                    usd: dayCloses['BTCUSD'][i],
                    coins: coins,
                }
            } else {
                input.portfolio.forEach((coin) => {
                    coins.push({
                        coin: coin.coin,
                        number: daybalance[coin.coin][date],
                        price: coin.coin == 'BTC' ? 1 : dayCloses[coin.coin][i],
                    });
                });
                log = {
                    date: date,
                    eur: dayCloses['BTCEUR'][i],
                    usd: dayCloses['BTCUSD'][i],
                    coins: coins,
                }
            }
            // console.log(log)
            dbPerformance.get('data')
                .push(log)
                .write();
        });

        logHistory('success', 'Performance recreation completed successfully');
        emitPerformance();
        getStartingBalances();

    } catch (e) {
        if (e.toString().includes('API-key format invalid')) {
            logHistory('error', 'Binance API key is invalid');
        } else if (e.toString().includes('AuthenticationError')) {
            logHistory('error', 'Binance API key or API secret are invalid');
        } else await handleError(e, 'recreateHistory()');
    }
}

async function getCandles(pair, startdate) {
    const periods = '1d';
    let prices;
    let ticker;

    const days = fns.differenceInCalendarDays(new Date(), startdate) + 1;

    try {
        const since = exchange.milliseconds() - days * 24 * 3600 * 1000;
        prices = await exchange.fetchOHLCV(pair, periods, since);
        ticker = await (exchange.fetchTickers(pair));
    } catch (e) {
        await handleError(e, 'getCandles()');
    }
    let closes = ohlcvToCloses(prices);
    closes.push(ticker.last);

    return closes;
}

function ohlcvToCloses(prices) {
    let closes = [];

    prices.forEach(function (price) {
        closes.push(price[4])
    });
    return closes;
}

function getConfiguration(botID) {
    let result = dbConfig.get('bots')
        .find({ botID: botID })
        .value()

    if (!result) {
        result = {
            botID: botID,
            apiKey: '',
            apiSecret: '',
            botname: `Bot ${botID}`,
            status: 'new',  // new, (starting), running, (stopping), stopped
            threshold: '3',
            startdate: getDate(),
            recreate: false,
            timeshift: 0,
            headless: false,
            cooldown: 12,
            portfolio: [],
        };
    }
    return result;
}

async function storeConfiguration(input) {
    // input.botID = botID;
    let result = dbConfig.get('bots')
        .find({ botID: botID })
        .value()

    if (result) {
        if (input.apiKey == '************') input.apiKey = config.apiKey;
        if (input.apiSecret == '************') input.apiSecret = config.apiSecret;
        // Replace with latest config for this bot
        dbConfig.get('bots')
            .find({ botID: botID })
            .assign(input)
            .write()
    } else {
        dbConfig.get('bots')
            .push(input)
            .write();
    }

    if (input.recreate) recreateHistory(input);
    input.recreate = false;

    config = {...input};

    if (socket) socket.emit("configuration-stored");

    reset();
}

function noslash(symbol) {
    return symbol.replace('/', '');
}

function updateNumberCoins(data) {
    if (data.e && data.e == 'outboundAccountPosition') {
        let balances = data.B;
        balances.forEach((coin) => {
            let match = currentCoins.find(c => c.coin == coin.a);
            if (match) match.number = Number(coin.f);
        });
    }
}

async function getCoins(exclude = true) {
    let allBalances;
    let symbols = [];
    let portfolio = [];
    let excluded = [];

    if (exclude) {
        config.portfolio.forEach((coin) => {
            if (coin.excluded) excluded.push(coin.coin);
        });
    }

    try {
        allBalances = await exchange.fetchBalance();
        mybalances = allBalances.total;

        for (const [coin, number] of Object.entries(mybalances)) {
            // ilter coins that are excluded in the config file
            if (!excluded.includes(coin)) {
                // Filter coins with zero balance and coins that do not have a /BTC pair
                if (number.toString() != 0 && (allSymbols.includes(coin + '/BTC') || coin == 'BTC')) {
                    portfolio.push({
                        coin: coin,
                        symbol: coin + '/BTC',
                        reverse: false,
                        number: number
                    });
                    if (coin != 'BTC') {
                        symbols.push(coin + '/BTC');
                    }
                    // Allow coins that have a BTC/ pair
                } else if (number.toString() != 0 && allSymbols.includes('BTC/' + coin)) {
                    portfolio.push({
                        coin: coin,
                        symbol: 'BTC/' + coin,
                        reverse: true,
                        number: number
                    });
                    if (coin != 'BTC') {
                        symbols.push('BTC/' + coin);
                    }
                }
            }
        }
        // tickers = await (exchange.fetchTickers(symbols));
    } catch (e) {
        if (e.toString().includes('API-key format invalid')) {
            logHistory('error', 'Binance API key is invalid');
        } else if (e.toString().includes('AuthenticationError')) {
            logHistory('error', 'Binance API key or API secret are invalid');
        } else if (e.toString().includes('Signature for this request is not valid')) {
            logHistory('error', 'Binance API secret is invalid');
        } else await handleError(e, 'getPortfolio()');
        return;
    }
    return portfolio;
}

async function getPortfolio(api) {
    let allBalances;
    let symbols = [];
    let tickers = [];
    let last;
    let coins = [];

    let apiKey;
    let apiSecret;
    if (api.apiKey === '************' || api.apiSecret === '************') {
        apiKey = config.apiKey;
        apiSecret = config.apiSecret;
    } else {
        apiKey = api.apiKey;
        apiSecret = api.apiSecret;
    }

    await setExchange(apiKey, apiSecret);
    await loadSymbols();

    coins = await getCoins(false);

    coins.forEach((coin) => {
        symbols.push(coin.symbol);
    })

    try {
        tickers = await (exchange.fetchTickers(symbols));
    } catch (e) {
        if (e.toString().includes('API-key format invalid')) {
            logHistory('error', 'Binance API key is invalid');
        } else if (e.toString().includes('AuthenticationError')) {
            logHistory('error', 'Binance API key or API secret are invalid');
        } else if (e.toString().includes('Signature for this request is not valid')) {
            logHistory('error', 'Binance API secret is invalid');
        } else await handleError(e, 'getPortfolio()');
    }

    coins.forEach((coin) => {
        if (coin.coin != 'BTC') {
            last = (coin.reverse) ? 1 / tickers[coin.symbol].last : tickers[coin.symbol].last;
        } else {
            last = 1;
        }

        coin.price = formatResult(last, 8);
    });

    if (socket) socket.emit("portfolio", coins);
}

async function getBalances() {
    let totalValue = 0;
    let totalAssets = 0;
    let last;
    const threshold = config.threshold;

    currentCoins.forEach((coin) => {
        if (coin.coin != 'BTC') {
            let ticker = global.ticker[noslash(coin.symbol)];
            last = (coin.reverse) ? 1 / ticker : ticker;
        } else {
            last = 1;
        }
        let value = coin.number * last;
        totalValue += value;
        totalAssets++;

        coin.last = formatResult(Number(last), 8);
        coin.value = value;
    });

    currentCoins.forEach((coin) => {
        let match = config.portfolio.find(c => c.coin == coin.coin);
        let target = Number(match.distribution);

        let distribution = coin.value / totalValue * 100;
        let tradeRatio = target / distribution;
        let tradeNumber = (tradeRatio - 1) * coin.number;

        coin.distribution = formatResult(distribution, 3);
        coin.target = formatResult(target, 3);
        coin.trade = formatResult(tradeNumber, 8);

        coin.side = '';
        if (coin.coin != 'BTC') {
            if (coin.distribution > target) {
                coin.side = 'sell';
            } else if (coin.distribution < target) {
                coin.side = 'buy';
            }
        }
    });

    currentCoins.sort((a,b) => (a.distribution < b.distribution) ? 1 : ((b.distribution < a.distribution) ? -1 : 0));

    const fiat = await getFiat();

    lastBalances = {
        time: getTimeStamp(),
        headless: config.headless,
        eur: fiat.eur,
        usd: fiat.usd,
        portfolio: JSON.stringify(currentCoins),
        threshold: threshold
    };

    if (socket) socket.emit("balances", lastBalances);

    if (!initialPerformanceStored) {
        initialPerformanceStored = true;
        await storePerformance();
        emitPerformance();
    }

    if (config.headless) headlessMode({
        portfolio: currentCoins,
        threshold: threshold
    });

    // Update performance data every hour. If it's a new day, send update to client
    if (lastPerformanceStored !== getHour()) {
        await storePerformance();
        if (lastPerformanceEmitted !== getDate()) {
            emitPerformance();
        }
    }
    
    pidBalances = setTimeout(getBalances, getBalancesInterval);
}

async function storePerformance() {
    if (!lastBalances) {
        return;
    }

    let startingBalanceStored = await getStartingBalances(false);
    let coins = [];
    let newcoins = [];
    let log;
    let firstlog = false;


    JSON.parse(lastBalances.portfolio).forEach((coin) => {
        let data = {
            coin: coin.coin,
            number: coin.number,
            price: coin.last,
        }
        coins.push(data);
        if (!startingBalanceStored.coins || !startingBalanceStored.coins.find(c => c.coin == coin.coin && c.number != 0)) newcoins.push(data);
    });

    const fiat = await getFiat();

    log = {
        date: lastBalances.time.split(" ")[0],
        eur: fiat.eur,
        usd: fiat.usd,
        coins: coins,
    };

    if (newcoins.length != 0) {
        firstlog = true;
        let yesterday = getDate('yesterday');
        let performance = dbPerformance.get('data')
            .find({date: yesterday})
            .value();
        if (performance) {
            let replacecoins = [...performance.coins];
            performance.coins = replacecoins.concat(newcoins);
            dbPerformance.get('data')
                .find({ date: yesterday })
                .assign(performance)
                .write();
        } else {
            log.date = yesterday;
        }
    }
    let result = dbPerformance.get('data')
        .find({ date: log.date })
        .value()

    if (result) {
        dbPerformance.get('data')
            .find({ date: log.date })
            .assign(log)
            .write()
    } else {
        dbPerformance.get('data')
            .push(log).write();
    }

    lastPerformanceStored = getHour();

    // Run once more to create a record for today
    if (firstlog) storePerformance();
}

function emitPerformance() {
    if (dbPerformance.has('data').value()) {
        let logs = dbPerformance.get('data')
            .sortBy('date')
            .value();
        if (socket) socket.emit("performance", logs);
        lastPerformanceEmitted = getDate();
    } else {
        if (socket) socket.emit("performance", []);
    }
}

async function getStartingBalances(doEmit = true) {
    if (!lastBalances || config.apiKey == '') {
        return {};
    }

    if (dbPerformance.has('data').value()) {
        let performance = dbPerformance.get('data')
            .sortBy('date')
            .value();

        let valueBTC = 0;
        let valueEUR = 0;
        let valueUSD = 0;
        
        let dayOne = [];
        const portfolio = JSON.parse(lastBalances.portfolio);
        portfolio.forEach((coin, i) => {
            dayOne[i] = {
                coin: coin.coin,
                number: 0,
                // price: 0,
            };
        });

        dayOne.forEach((coin) => {
            performance.forEach((day) => {
                // For each coin in current portfolio, find first occurance in performance logs
                const match = day.coins.find(c => c.coin === coin.coin);
                if (match) {
                    if (coin.number === 0) {
                        coin.number = match.number;
                        // coin.price = match.price;
                        valueBTC += match.price * match.number;
                        valueEUR += match.price * match.number * day.eur;
                        valueUSD += match.price * match.number * day.usd;
                    }
                }
            });
        });
        let balances = {
            btc: valueBTC,
            eur: valueEUR,
            usd: valueUSD,
            coins: dayOne,
        };
        if (socket && doEmit) socket.emit("starting-balances", balances);
        else return balances;
    } else {
        if (socket && doEmit) socket.emit("starting-balances", {});
        else return balances;
    }
}

function headlessMode(response) {
    let portfolio = response.portfolio;
    let threshold = response.threshold;

    let selected = [];
    portfolio.forEach(coin => {
        if (coin.coin != 'BTC') {
            if (coin.distribution / coin.target - 1 >= threshold / 100) {
                selected.push(coin);
            } else if (coin.distribution / coin.target - 1 <= -threshold / 100) {
                selected.push(coin);
            }
        }
    });

    if (selected.length > 0) {
        placeOrder('market', selected);
    }
}

function symbolToCoin(symbol) {
    let coin;
    if (symbol.includes('/BTC')) coin = symbol.replace('/BTC', '');
    if (symbol.includes('BTC/')) coin = symbol.replace('BTC/', '');
    return coin;
}

async function validateOrders(n = 0) {
    // const coins = await getCoins();
    let validated = [];

    lastOrders.forEach((order) => {
        let previouscoin = previousCoins.find(c => c.coin == symbolToCoin(order.symbol));
        let currentcoin = currentCoins.find(c => c.coin == symbolToCoin(order.symbol));

        let targetmin;
        let targetmax;
        if ((order.side == 'buy' && !order.reverse) || (order.side == 'sell' && order.reverse)) {
            targetmin = previouscoin.number + 0.9 * order.amount;
            targetmax = previouscoin.number + 1.1 * order.amount;
        } else {
            targetmin = previouscoin.number - 1.1 * order.amount;
            targetmax = previouscoin.number - 0.9 * order.amount;
        }
        // Allow for small deviations
        validated.push((currentcoin.number >= targetmin) && (currentcoin.number <= targetmax));

    });

    if (validated.includes(false)) {
        if (n == 0) logHistory('error', 'Waiting for order(s) to be validated');
        pidOrders = setTimeout(function () { validateOrders(++n) }, validateOrderInterval);
    } else {
        lockOrders = false;
        if (n > 0) logHistory('success', `Order(s) validated after ${n+1} attempts`);
        if (pidBalances) clearTimeout(pidBalances);
        getBalances();
    }
}

async function placeOrder(type, coins) {
    if (!lockOrders) {
        lastOrders = [];

        // Deep copy
        previousCoins = JSON.parse(JSON.stringify((currentCoins)));

        for (const coin of coins) {
            let price;
            let side;
            let amount;
            let symbol = coin.symbol;

            if (coin.reverse) {
                price = 1 / coin.last;
                side = (coin.side == 'buy') ? 'sell' : 'buy';
                amount = Math.abs(coin.trade) / price;
            } else {
                price = coin.last;
                side = coin.side;
                amount = Math.abs(coin.trade);
            }

            amount = formatResult(amount, 8);
            price = formatResult(price, 8);

            try {
                const order = await exchange.createOrder(symbol, type, side, amount, price);

                lastOrders.push({
                    symbol: symbol,
                    side: side,
                    reverse: coin.reverse,
                    amount: (coin.reverse) ? order.filled * order.price : order.filled,
                    price: order.price,
                });

                if (config.headless) {
                    logHistory('order', `Automatic order: ${symbol} ${type} ${side} #${formatResult(order.filled, 8)} @${formatResult(order.price, 8)}`, `Automatic order: ${symbol} ${type} ${side}`);
                } else {
                    logHistory('order', `Manual order: ${symbol} ${type} ${side} #${formatResult(order.filled, 8)} @${formatResult(order.price, 8)}`, `Manual order: ${symbol} ${type} ${side}`);
                }
            } catch (e) {
                if (e.toString().includes('MIN_NOTIONAL')) {
                    logHistory('error', `Order amount is too small to trade: ${symbol}`);
                } else if (e.toString().includes('Invalid quantity')) {
                    logHistory('error', `Order amount is invalid: ${symbol}`);
                } else await handleError(e, 'placeOrder()');
            }
        }
        if (lastOrders.length != 0) {
            lockOrders = true;
            pidOrders = setTimeout(validateOrders, 3000);
        }
    } else {
        logHistory('error', 'Ordering not possible while waiting for validation of previous order(s)')
    }
}

function logHistory(type, event, summary = '') {
    let log = {
        time: getTimeStamp(),
        type: type,
        event: event,
    };

    dbLogs.get('logs')
        .push(log).write();
    
    if (summary == '') summary = event;

    if (socket) socket.emit("event", log, summary);
    
    console.log(`${log.time} | ${log.event}`);
}

function emitHistory(pageSize, filter = {}) {
    if (Object.keys(filter).length == 0) {
        filter = {
            type: ['order', 'event'],
            event: '',
            page: 1,
        }
    }

    if (filter.type.includes('event')) filter.type.splice(filter.type.indexOf('event'), 1, 'error', 'success');

    if (dbLogs.has('logs').value()) {
        let logs = dbLogs.get('logs')
            .filter((log) => {
                if (filter.type.length == 0) return false;
                else return filter.type.includes(log.type);
            })
            .filter((log) => {
                if (filter.event == '') return true;
                else return log.event.toLowerCase().includes(filter.event.toLowerCase());
            })
            .sortBy('time');

        let total = logs.value().length;

        logs = logs
            .reverse()
            .slice((filter.page-1)*pageSize, filter.page*pageSize-1)
            .reverse()
            .value();
        if (socket) socket.emit("event-history", logs, total);
    } else {
        if (socket) socket.emit("event-history", [], 0);
    }
}

async function handleError(e, func, symbol = '') {
    if (e.toString().includes('DDoSProtection')) {
        logHistory('error', `${func} | API overload - sleeping for 60 sec`);
        await sleep(retryInterval);
    } else if (e.toString().includes('ExchangeNotAvailable')) {
        logHistory('error', `${func} | Binance exchange is not responding`);
    } else if (e.toString().includes('API-key format invalid')) {
        logHistory('error', `${func} | Binance API key is invalid - closing bot`);
        return process.exit(1);
    } else if (e.toString().includes('AuthenticationError')) {
        logHistory('error', `${func} | Binance API key or API secret are invalid - closing bot`);
        return process.exit(1);
    } else if (e.toString().includes('Signature for this request is not valid')) {
        logHistory('error', `${func} | Binance API secret is invalid - closing bot`);
        return process.exit(1);
    } else if (e.toString().includes('Timestamp for this request was 1000ms ahead')) {
        logHistory('error', `${func} | Your computer's internal clock is out of sync - closing bot`);
        return process.exit(1);
    } else {
        logHistory('error', `${func} | Error occured, see node server console for details`);
        console.log('Error occured: ', e);
    }
}

function formatResult(num, dec) {
    // return Number(Math.round(num + 'e' + dec) + 'e-' + dec).toFixed(dec);
    return parseFloat(num.toFixed(dec));
}

function getTimeStamp() {
    const now = shiftedDate();

    return now.getFullYear() + "/" + (now.getMonth() + 1).toString().padStart(2, '0') + "/" + now.getDate().toString().padStart(2, '0') + " " + now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0') + ":" + now.getSeconds().toString().padStart(2,'0');
}

function getDate(when = 'now') {
    let now;

    if (when == 'yesterday') now = fns.sub(shiftedDate(), {days: 1});
    else now = shiftedDate();

    return now.getFullYear() + "/" + (now.getMonth() + 1).toString().padStart(2, '0') + "/" + now.getDate().toString().padStart(2, '0');
}

function getHour() {
    const now = shiftedDate();

    return now.getHours().toString().padStart(2, '0');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shiftedDate() {
    const now = new Date();
    let adjusted = now;
    if (config && config.timeshift !== 0) adjusted = fns.add(now, { hours: config.timeshift });
    return adjusted;
}