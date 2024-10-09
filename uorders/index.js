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


    const matchedUOrderQuery = // Request:
    {
        "Data": {
            // "FromDate": addHoursToISO(-(limitdays * 24 * 2)),
            // "ToDate": addHoursToISO(limitdays * 24 * 2),
            // "PageSize": 100,
            "SubscribeUpdates": true,
            "AddMarketSummary": true,

        }
    }
    console.log(matchedUOrderQuery)

    ws.send(JSON.stringify({
        Type: "SubscribeUOrders",
        UserID: 95,//USER_ID,
        "Data": matchedUOrderQuery
    }));


});

ws.on('message', function message(data) {

    const dataObject = JSON.parse(data);
    if (dataObject.State === "Error") {
        console.log(JSON.stringify(dataObject, null, 2));
        return;
    }



    if (dataObject.Type === "SubscribeUOrders") {
        const { Data, ...resStatus } = dataObject;
        console.log(JSON.stringify(resStatus, null, 2));
        console.log("items len:", Data.length);
        console.log(JSON.stringify(dataObject.Data, null, 2));


    }




});


ws.on('error', console.error);



