import WebSocket from 'ws';
import { checkEnvironentVariables, unixToTicks, addHoursToISO, ticktoDate } from './../utilities.js';
import * as api from './../api.js';
import 'dotenv/config'
import { writeFileSync } from 'fs';  // Using fs.promises for async file operations

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//account config
const PRIVATE_KEY = "0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2"
const RPC_ENDPOINT = "https://eth.llamarpc.com"
const NODE_URL = "wss://bitcoin-betting.org:82"
const NODE_ID = 12;
const USER_ID = 95;
//sport config
const sportcat = 1;
const limitL = 1.45;
const limitM = 4.2;
const hours = 4;
const minprice = 6;
const maxprice = 6.9;
const limitdays = 4;
const limit = 9;
const minvol = 0.1991;
const maxvol = 25000;
const titlenot = "";
const comp = "";
const include = []
const exclude = ["Props"];
const count = 900;
const enablefilter = true

const amount = api.getRnd(minprice, maxprice);

const currencyIds = ['mBTC', 'mETH', 'WBTC'];


const ws = new WebSocket(NODE_URL);

ws.on('open', function open() {
    const ToClosT = addHoursToISO(hours);

    const matchedUOrderQuery = // Request:
    {
        "Data": {
            "FromDate": addHoursToISO(-(limitdays * 24 * 2)),
            // "ToDate": addHoursToISO(0),
            "PageSize": 100,
            "SubscribeUpdates": false,
            "AddMarketSummary": false,

        }
    }
    console.log(matchedUOrderQuery)

    ws.send(JSON.stringify({
        Type: "SubscribeMatches",
        UserID: 95,//USER_ID,
        // "Data": matchedUOrderQuery
    }));


});

ws.on('message', function message(data) {

    const dataObject = JSON.parse(data);
    if (dataObject.State === "Error") {
        console.log(JSON.stringify(dataObject, null, 2));
        return;
    }

    if (dataObject.Type === "SubscribeMarketsByFilter") {
        const { Data, ...resStatus } = dataObject;
        console.log(JSON.stringify(resStatus, null, 2));
        console.log("items len:", Data.length)

        let parsedMarkets = api.parseMarkets(dataObject.Data, sportcat, minvol, maxvol);
        parsedMarkets = api.filterSpor33(parsedMarkets);
        parsedMarkets = api.filterSpor44(parsedMarkets);
        parsedMarkets = api.filterSport(parsedMarkets, count, sportcat, exclude, include);
        parsedMarkets = api.cancelLess13(parsedMarkets)
        parsedMarkets = api.cancelOver4(parsedMarkets, limitL, limitM)
        //  parsedMarkets =api.limitLandM(,parsedMarkets)

        console.log(parsedMarkets)
        // for (const item of dataObject.Data) {
        //     // Convert to JavaScript Date
        //     const date = ticktoDate(item.ClosD)
        //     console.log(JSON.stringify(item.Ru, null, 2));

        //     // console.log({
        //     //     "Title": item.Title,
        //     //     "Comp": item.Comp,
        //     //     "ClosD": date
        //     // })

        // }

        // process.exit(0);
    }

    if (dataObject.Type === "SubscribeMatches") {
        const { Data, ...resStatus } = dataObject;
        console.log(JSON.stringify(resStatus, null, 2));
        console.log("items len:", Data.length);
        console.log(JSON.stringify(dataObject.Data, null, 2));
        // let parsedMatchedOrders = api.parseMatchedOrders(dataObject.Data);
        // console.log("editedMatchedOrder", parsedMatchedOrders);
        // // parsedMatchedOrders = api.filterMatchedOrders(parsedMatchedOrders);


        // let combinedMatchedOrders = api.combineMatchedOrders(parsedMatchedOrders);
        // let editedMatchedOrder = api.editMatchedOrders(combinedMatchedOrders, limit);

    }




});


ws.on('error', console.error);



