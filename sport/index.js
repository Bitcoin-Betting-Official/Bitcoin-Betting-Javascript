import { checkEnvironentVariables, unixToTicks, addHoursToISO, ticktoDate } from '../utilities.js';
import * as api from '../api.js';
import 'dotenv/config'
import { writeFileSync, readFileSync, existsSync } from 'fs';

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function sport() {

    const currencyIds = ['mBTC', 'mETH', 'WBTC'];

    //account config
    const PRIVATE_KEY = "0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2"
    const RPC_ENDPOINT = "https://eth.llamarpc.com"
    const NODE_URL = "wss://bitcoin-betting.org:82"
    const NODE_ID = 12;
    const USER_ID = 95;

    //sport profile id
    const profileId = "football12";

    // sport config
    const comfigFilePath = path.join(__dirname, '../config.json');
    const configText = readFileSync(comfigFilePath, 'utf-8');
    const configJSON = JSON.parse(configText);
    const sportConfig = configJSON[profileId];
    console.log(["load", profileId, "sport config"].join(" "));
    console.log(sportConfig);
    const sportcat = sportConfig['sportcat'];
    const maxID = 500;
    const minprice = sportConfig['minprice'];
    const maxprice = sportConfig['maxprice'];
    const limitL = sportConfig['limitL'];
    const limitM = sportConfig['limitM'];
    const limitdays = sportConfig['limitdays'];
    const limit = sportConfig['limit'];
    const titlenot = sportConfig['titlenot'];
    const comp = sportConfig['comp'];
    const hours = sportConfig['hours'];
    const minvol = sportConfig['minvol'];
    const maxvol = sportConfig['maxvol'];
    const include = sportConfig['include'];
    const exclude = sportConfig['exclude'];
    const count = sportConfig['count'];
    const enablefilter = sportConfig['enablefilter'];

    //random amount min/max price
    const amount = api.getRnd(minprice, maxprice);
    //to close date, iso date example: 2024-09-30T03:21:08
    const ToClosT = addHoursToISO(hours + 24);
    const FromDate = addHoursToISO(-(limitdays * 24));
    // const ToDate= addHoursToISO(0);

    const marketFilterQuery = {
        "MarketFilter": {
            Cat: sportcat,
            Comp: comp,
            NoZombie: true,
            OnlyActive: true,
            PageSize: maxID,
            Status: 0,//active
            ToClosT
        }

    }

    const matchedOrderQuery =
    {
        "Data": {
            "FromDate": addHoursToISO(-(limitdays * 24)),
            "PageSize": 1000,
            "SubscribeUpdates": false,
            "AddMarketSummary": false,
        }
    }

    //markets request
    const marketFilterRequest = JSON.stringify({
        "Type": "SubscribeMarketsByFilter",
        "Data": marketFilterQuery
    });

    //unmatched request
    const matchedOrderRequest = JSON.stringify({
        Type: "SubscribeMatches",
        UserID: USER_ID,//USER_ID,
        "Data": matchedOrderQuery
    });

    const marketsRes = await api.sendMessageAndAwaitResponse(NODE_URL, marketFilterRequest);
    const markets = marketsRes.Data;
    saveFile('test/0-import-markets.json', markets);
    // console.log('markets:', markets);
    const mOrdersRes = await api.sendMessageAndAwaitResponse(NODE_URL, matchedOrderRequest);
    const uorders = mOrdersRes.Data;
    // console.log('mOrders:', uorders);
    let parseMatchedOrders = api.parseMatchedOrders(uorders);
    let filterMatchedOrders = api.filterMatchedOrders(parseMatchedOrders);
    let combineMatchedOrders = api.combineMatchedOrders(filterMatchedOrders);
    let editMatchedOrders = api.editMatchedOrders(combineMatchedOrders, limit);

    //markets
    let parsedMarkets = api.parseMarkets(markets, sportcat, minvol, maxvol);
    saveFile('test/1-parsedMarkets.json', parsedMarkets);
    parsedMarkets = api.filterSpor33(parsedMarkets);
    saveFile('test/2-filterSpor33.json', parsedMarkets);
    parsedMarkets = api.filterSpor44(parsedMarkets);
    saveFile('test/3-filterSpor44.json', parsedMarkets);
    parsedMarkets = api.filterSport(parsedMarkets, count, sportcat, exclude, include);
    saveFile('test/4-filterSport.json', parsedMarkets);
    parsedMarkets = api.cancelLess13(parsedMarkets);
    saveFile('test/5-filterSport.json', parsedMarkets);
    parsedMarkets = api.cancelOver4(parsedMarkets, limitL, limitM);
    saveFile('test/6-cancelOver4.json', parsedMarkets);
    // filePath = [__dirname, '6-cancelOver4.json'].join('/');
    // writeFileSync(filePath, JSON.stringify(parsedMarkets, null, 2));
    // console.log('JSON file has been saved.');

    const newMarkets = api.limitLandM(editMatchedOrders, parsedMarkets);

    let oldMarkets = [];

    if (existsSync("markets.json")) {
        const oldMarketJsonString = readFileSync('markets.json', 'utf8');
        oldMarkets = JSON.parse(oldMarketJsonString) || [];
    }

    saveFile('test/7-limitLandM.json', newMarkets);

    const {
        midsToCancel,
        createArrays } = api.manageOrders(oldMarkets, newMarkets, amount);
    saveFile('test/8-manageOrders.json', newMarkets);
    saveFile('test/9-createArrays.json', createArrays);
    api.cancelOldMarkets(oldMarkets, midsToCancel);
    saveFile('test/10-midsToCancel.json', midsToCancel);
    await api.handleCancelMarkets(midsToCancel);
    await api.handleCreateOrders(newMarkets, { "0": [createArrays[0][0]] });
    //     "0": [
    //         {
    //             "Mid": "db2129e0-131c-410c-8ee3-2699188e2b2d",
    //             "Rid": 0,
    //             "Oid": -1,
    //             "Type": 1,
    //             "Am": 0.18476093559370161,
    //             "Pri": 1.8246249,
    //             "Boa": 1,
    //             "Mct": 0
    //         },
    //     ]
    // });
    saveFile('test/11-handleCreateOrders.json', newMarkets);
    const jsonString = JSON.stringify(newMarkets, null, 2); // Pretty-print with 2 spaces
    writeFileSync([__dirname, 'markets.json'].join('/'), jsonString);
    // await api.handleCancelMarkets(midsToCancel);

}

function saveFile(name, data) {
    const filePath = [__dirname, name].join('/');
    writeFileSync(filePath, JSON.stringify(data, null, 2));
}


function testCancelOrder() {

    api.handleCancelMarkets([
        [
            "db2129e0-131c-410c-8ee3-2699188e2b2d",
            "NCAA,New Mexico State @ Jacksonville State",
            1.683,
            62.11,
            "Game Handicap Spread -22.5",
            0,
            0,
            1.827,
            51.11,
            0,
            0,
            1.6851879000000003,
            1.8246249,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +22.5 ",
            1.6059465201170213,
            "n",
            "288333c7-3067-4307-8b0a-451aec3bf33a",
            "",
            0,
            "",
            -22.5,
            "Game Handicap Spread "
        ],
        [
            "6b244cdb-1dda-4641-96a3-4f77ae9025b4",
            "NCAA,New Mexico State @ Jacksonville State",
            1.708,
            59.11,
            "Game Handicap Spread -22.0",
            0,
            0,
            1.856,
            49.11,
            0,
            0,
            1.7102204,
            1.8535872000000002,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +22.0 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -22,
            "Game Handicap Spread "
        ],
        [
            "b91af043-2b6d-4bb8-880c-3151a5f8f79e",
            "NCAA,New Mexico State @ Jacksonville State",
            1.745,
            56.11,
            "Game Handicap Spread -21.5",
            0,
            0,
            1.894,
            47.11,
            0,
            0,
            1.7472685000000003,
            1.8915378,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +21.5 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -21.5,
            "Game Handicap Spread "
        ],
        [
            "557035a4-d69a-437d-902c-cb2247b69e40",
            "NCAA,New Mexico State @ Jacksonville State",
            1.825,
            51.11,
            "Game Handicap Spread -21.0",
            0,
            0,
            1.972,
            43.11,
            0,
            0,
            1.8273725,
            1.9694364,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +21.0 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -21,
            "Game Handicap Spread "
        ],
        [
            "1a18e038-3031-4067-8e93-115406c5ae68",
            "NCAA,New Mexico State @ Jacksonville State",
            1.916,
            46.11,
            "Game Handicap Spread -20.5",
            0,
            0,
            2.07,
            42.11,
            0,
            0,
            1.9184908,
            2.067309,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +20.5 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -20.5,
            "Game Handicap Spread "
        ],
        [
            "7d208ecb-81f3-4fb0-94ea-3420dcacd131",
            "NCAA,New Mexico State @ Jacksonville State",
            1.961,
            44.11,
            "Game Handicap Spread -20.0",
            0,
            0,
            2.15,
            42.11,
            0,
            0,
            1.9635493000000002,
            2.147205,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +20.0 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -20,
            "Game Handicap Spread "
        ],
        [
            "fda095e2-b2c8-4468-a479-de61ef02d949",
            "NCAA,New Mexico State @ Jacksonville State",
            2.01,
            42.11,
            "Game Handicap Spread -19.5",
            0,
            0,
            2.2,
            42.11,
            0,
            0,
            2.012613,
            2.19714,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +19.5 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -19.5,
            "Game Handicap Spread "
        ],
        [
            "97ee81d7-a709-4acf-bc26-5e55156a7c0b",
            "NCAA,New Mexico State @ Jacksonville State",
            2.04,
            42.11,
            "Game Handicap Spread -19.0",
            0,
            0,
            2.26,
            42.11,
            0,
            0,
            2.0426520000000004,
            2.257062,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +19.0 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -19,
            "Game Handicap Spread "
        ],
        [
            "42c13830-1427-4426-a871-4121134936fc",
            "NCAA,New Mexico State @ Jacksonville State",
            2.06,
            42.11,
            "Game Handicap Spread -18.5",
            0,
            0,
            2.29,
            42.11,
            0,
            0,
            2.062678,
            2.287023,
            0,
            "2024-10-10T01:30:00.000Z",
            "New Mexico State +18.5 ",
            1.6059465201170213,
            "n",
            "",
            "",
            0,
            "",
            -18.5,
            "Game Handicap Spread "
        ]
    ]);

}
sport();
// testCancelOrder();
// process.exit(0);

// const testMarkets = [
//     {
//         "ID": "3b16eb5f-5aeb-45ff-b802-365a56ea93c2",  // ID is missing in the original
//         "LastSoftCh": "missing",  // LastSoftCh is missing in the original
//         "MarketSummary": "MLB;Game Over/Under 7.0;Atlanta Braves @ San Diego Padres;2024-10-03 00:38:00;Over 7.0, Under 7.0",  // Comp + Descr + Title + ClosD + Ru details
//         "MainNodeID": "missing",  // MainNodeID is missing in the original
//         "Comp": "MLB",  // Comp from the original
//         "CreationDate": "missing",  // CreationDate is missing in the original
//         "Descr": "Game Over/Under 7.0",  // Descr from the original
//         "Title": "Atlanta Braves @ San Diego Padres",  // Title from the original
//         "Cat": 14,  // CatID from the original
//         "ClosD": 638635977000000000,
//         "SettlD": 638635162800000000,
//         "Ru": [
//             {
//                 "OrdBook": {
//                     "MarketID": "3b16eb5f-5aeb-45ff-b802-365a56ea93c2",  // MarketID is missing in the original
//                     "RunnerID": 0,
//                     "Bids": [
//                         [
//                             2.107,
//                             192.11
//                         ]
//                     ],
//                     "Asks": [
//                         [
//                             2.254,
//                             192.11
//                         ]
//                     ]
//                 },
//                 "Name": "Over 7.0 ",
//                 "mCT": 6000,  // VisDelay from the original
//                 "VolMatched": 24.0638297871600
//             },
//             {
//                 "Name": "Under 7.0 ",
//                 "mCT": 6000  // VisDelay from the original
//             }
//         ],
//         "Type": 1,  // _Type from the original
//         "Period": 1,  // _Period from the original
//         "Comm": 0.0061,  // Comm from the original
//         "Creator": "missing",  // Creator is missing in the original
//         "Settler": {
//             "1": true,
//             "777889": true,
//             "888555": true
//         },
//         "ComRecip": {
//             "1011849": 0.5,
//             "1013506": 0.5
//         },
//         "SetFin": "missing",  // SetFin is missing in the original
//         "evID": "missing"  // evID is missing in the original
//     }


// ]
