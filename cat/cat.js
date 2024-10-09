import WebSocket from 'ws';
import { checkEnvironentVariables, unixToTicks, addHoursToISO, ticktoDate } from './utilities.js';
import 'dotenv/config'

import { writeFileSync } from 'fs';  // Using fs.promises for async file operations
//account config
const PRIVATE_KEY = "0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2"
const RPC_ENDPOINT = "https://eth.llamarpc.com"
const NODE_URL = "wss://bitcoin-betting.org:82"
const NODE_ID = 12;
const USER_ID = 95;
//sport config
const sportcat = 14;
const limitL = 1.45;
const limitM = 4.2;
const hours = 4;
const minprice = 4;
const maxprice = 6;
const limitdays = 0.5;
const limit = 9;
const minvol = 99.1;
const maxvol = 199;
const titlenot = "";
const comp = "MLB";
const include = []
const exclude = ["Props"];
const count = 900;
const enablefilter = true



// "baseball24": {
//     "sportcat": 14,
//     "limitL": 1.45,
//     "limitM": 4.2,
//     "hours": 4,
//     "count": 900,
//     "minprice": 4,
//     "maxprice": 4.9,
//     "minvol": 99.1,
//     "maxvol": 199,
//     "limitdays": 0.5,
//     "limit": 7,
//     "exclude":["Props"
//     ],
//     "include":[
//     ],
//    "titlenot": "",
//     "comp": "MLB",
//     "enablefilter":true

// },



const currencyIds = ['mBTC', 'mETH', 'WBTC'];

const testMarkets = [
    {
        "ID": "a4484983-1d4c-4594-918b-550bbfdc7b5d",
        "LastCh": 638632567316263700,
        "LastSoftCh": 638632591741181200,
        "MarketSummary": "AMERICANFOOTBALL;NFL;Buffalo Bills @ Baltimore Ravens;Game Total Points Over/Under 52.5;09/30/2024 02:32:11;Over 52.5 ,Under 52.5 ,;1597660258",
        "MainNodeID": 104,
        "Comp": "NFL",
        "CreationDate": 638632531304930200,
        "Descr": "Game Total Points Over/Under 52.5",
        "Title": "Buffalo Bills @ Baltimore Ravens",
        "Cat": 13,
        "ClosD": 638632603315860500,
        "SettlD": 638632606915860500,
        "Status": 1,
        "Ru": [
            {
                "OrdBook": {
                    "MarketID": "a4484983-1d4c-4594-918b-550bbfdc7b5d",
                    "RunnerID": 0,
                    "Bids": [
                        [
                            2.14,
                            150.11
                        ]
                    ],
                    "Asks": [
                        [
                            2.45,
                            150.11
                        ]
                    ]
                },
                "Name": "Over 52.5 ",
                "mCT": 13000
            },
            {
                "Name": "Under 52.5 ",
                "mCT": 13000
            }
        ],
        "Type": 1,
        "Period": 1,
        "Comm": 0.001,
        "Creator": 2,
        "Settler": {
            "2": true,
            "16": true,
            "104": true
        },
        "ComRecip": {
            "2": 0.5,
            "104": 0.5
        },
        "SetFin": 24,
        "evID": 1597660258
    }
]

// let parsedMarkets = parseMarkets(testMarkets, sportcat, minvol, maxvol);
// // console.log("parseMarkets");
// // consoleArray(parsedMarkets);
// parsedMarkets = filterSpor33(parsedMarkets);
// // console.log("parseMarkets filterSpor33");
// consoleArray(parsedMarkets);
// parsedMarkets = filterSpor44(parsedMarkets);
// // console.log("parseMarkets filterSpor44");
// // consoleArray(parsedMarkets);
// parsedMarkets = filterSport(parsedMarkets, count, sportcat, exclude, include);
// console.log("parseMarkets filterSport");
// consoleArray(parsedMarkets);
// process.exit(0);
// // const parsedmarkets = parseMarkets(testMarkets, sportcat, minvol, maxvol);


const ws = new WebSocket(NODE_URL);

ws.on('open', function open() {

    ws.send(JSON.stringify({
        "Type": "SubscribeSports",

    }));
});

ws.on('message', function message(data) {

    const dataObject = JSON.parse(data);
    if (dataObject.State === "Error") {
        console.log(JSON.stringify(dataObject, null, 2));
        return;
    }

    if (dataObject.Type == "SubscribeSports") {

        try {
            writeFileSync('cat.json', JSON.stringify(dataObject, null, 2));
            console.log('JSON file has been saved.');
        } catch (error) {
            console.error('Error writing file:', error);
        }
        finally {
            process.exit(0);
        }


        process.exit(0);
    }


});


ws.on('error', console.error);

