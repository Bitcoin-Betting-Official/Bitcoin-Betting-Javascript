import WebSocket from 'ws';
import { checkEnvironentVariables, unixToTicks, addHoursToISO, ticktoDate, addMinutesToISO } from '../utilities.js';
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
const sportcat = 13;
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
const comp = "NCAA";
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

const amount = getRnd(minprice, maxprice);

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
    const ToClosT = addMinutesToISO((hours * 60 + 24 * 60 + 30));
    console.log(ToClosT)
    const data = {
        "MarketFilter": {
            Cat: sportcat,//14
            Comp: comp,//"MLB"
            NoZombie: true,
            OnlyActive: true,
            PageSize: 10000,
            Status: 0,    //active
            ToClosT //2024-10-03T22:04:50.787Z
        },
        // "SubscribeOrderbooks": true
    }

    ws.send(JSON.stringify({
        "Type": "SubscribeMarketsByFilter",
        "Data": data
    }));
});

ws.on('message', function message(data) {

    const dataObject = JSON.parse(data);
    if (dataObject.State === "Error") {
        console.log(JSON.stringify(dataObject, null, 2));
        return;
    }

    if (dataObject.Type == "SubscribeMarketsByFilter") {

        try {
            let filePath = [__dirname, 'markets.json'].join('/');
            writeFileSync(filePath, JSON.stringify(dataObject, null, 2));
            console.log('JSON file has been saved. ' + dataObject.Data.length + " item");
        } catch (error) {
            console.error('Error writing file:', error);
        }
        finally {
            process.exit(0);
        }


        const { Data, ...resStatus } = dataObject;
        console.log(JSON.stringify(resStatus, null, 2));
        console.log("items len:", Data.length)

        let parsedMarkets = parseMarkets(dataObject.Data, sportcat, minvol, maxvol);

        parsedMarkets = filterSpor33(parsedMarkets);
        parsedMarkets = filterSpor44(parsedMarkets);
        parsedMarkets = filterSport(parsedMarkets, count, sportcat, exclude, include);

        console.log(parsedMarkets)
        for (const item of dataObject.Data) {
            // Convert to JavaScript Date
            const date = ticktoDate(item.ClosD)
            console.log(JSON.stringify(item.Ru, null, 2));

            // console.log({
            //     "Title": item.Title,
            //     "Comp": item.Comp,
            //     "ClosD": date
            // })

        }


        process.exit(0);
    }


});


ws.on('error', console.error);


function getRnd(min, max) {
    return Math.random() * (max - min) + min;
}

function parseMarkets(data, sportcat, limitMaxVol, limitMinVol) {

    const markets = data;
    const arr = [];

    for (const marketKey in markets) {
        const market = markets[marketKey];


        let BIDPrice = 0;
        let BIDVolume = 0;
        let ASKPrice = 0;
        let ASKVolume = 0;

        const marketid = market['ID'];
        const Title = [market['Comp'], market['Title']].join();
        const Descr = market['Descr'];
        const Ru = market['Ru'];

        const SettlD = market['SettlD'];
        const Status = market['Status'];
        const OrdBooks = Ru.filter(e => e?.OrdBook)


        if (OrdBooks.length) {
            const OrdB = OrdBooks[0]["OrdBook"];
            console.log(JSON.stringify(OrdB))
            const bids = OrdB['Bids'];
            const asks = OrdB['Asks'];

            let Vol11 = 0;
            let Price11 = 0;

            for (const bidkey in bids) {

                const bid = bids[bidkey];
                const price = bid[0];
                const vol = bid[1];
                const decimal = vol % 1;

                if ((decimal - 0.11) < 0.0001) {

                    if (vol >= limitMaxVol && vol <= limitMinVol) {
                        if (vol > Vol11) {
                            Price11 = price;
                            Vol11 = vol;
                        }
                    }

                }

            }

            BIDPrice = Price11;
            BIDVolume = Vol11;

            Vol11 = 0;
            Price11 = 0;

            for (const askKey in asks) {
                const ask = asks[askKey];
                const price = ask[0];
                const vol = ask[1];

                if (vol >= limitMaxVol && vol <= limitMinVol) {
                    if (vol > Vol11) {
                        Price11 = price;
                        Vol11 = vol;
                    }
                }

            }

            ASKPrice = Price11;
            ASKVolume = Vol11;

            const vol = market['Ru'][0]['VolMatched'] || 0;
            const ruName = market['Ru'][0]['Name'];

            if (ASKVolume > 0 || BIDVolume > 0) {
                const Green00 = BIDPrice * 1.0013;
                const Red01 = ASKPrice * 0.9987;
                // const lastchange = "";
                let descvalue = Descr.match(/-?\d+\.\d+/);
                let desctext = Descr.replace(/[+-]?\d+\.\d+/, '');
                const row = [
                    marketid,//0
                    Title,//
                    BIDPrice,
                    BIDVolume,
                    Descr,
                    0,
                    0,
                    ASKPrice,
                    ASKVolume,
                    0,
                    0,
                    Green00,
                    Red01,
                    vol,
                    SettlD,
                    ruName,
                    "",
                    "",
                    "", //20
                    "", //21
                    Status,//22
                    "",//23
                    descvalue && descvalue.length > 0 ? parseFloat(descvalue[0]) : "", //24
                    desctext//25
                ];

                arr.push(row);
            }


        }

    }

    return arr;

}


function filterSpor33(arr) {

    return arr.filter(e => {
        let colC = e[2];
        return colC >= 1.3 && colC <= 3.2;
    });


}


function filterSpor44(arr) {

    return arr.filter(e => {
        let colH = e[7];
        return colH >= 1.45 && colH <= 3.3
    });

}



function filterghosts(arr, titlepos, pricepos, valpos, descpos) {
    let newarr = [];
    let ghosts = [];
    let ghostsmap = {};
    let noghost = [];

    let f1 = [];
    let f2 = [];
    let f3 = [];

    arr.forEach((row, key) => {
        f1[key] = row[titlepos];  // B
        f2[key] = row[descpos];   // F
        f3[key] = row[valpos];    // G
    });

    // Sorting arrays f1, f2, f3, and arr
    arr.sort((a, b) => {
        let t1 = a[titlepos].localeCompare(b[titlepos]);
        if (t1 !== 0) return t1;
        let d1 = a[descpos].localeCompare(b[descpos]);
        if (d1 !== 0) return d1;
        return a[valpos] - b[valpos];
    });

    let countrecord = arr.length;
    let pricevariation1 = 0;
    let pricevariation2 = 0;

    let price1 = arr[0][pricepos];
    let title1 = arr[0][titlepos];
    let desc1 = arr[0][descpos];

    for (let r = 1; r < countrecord; ++r) {
        let price2 = arr[r][pricepos];
        let title2 = arr[r][titlepos];
        let desc2 = arr[r][descpos];

        if (desc1 === desc2 && title1 === title2) {
            pricevariation1 = (price1 + 0.001) > (price2 + 0.001) ? 2 : 1;

            if (pricevariation2 === 0) pricevariation2 = pricevariation1;

            if (pricevariation2 === pricevariation1) {
                newarr.push(arr[r]);
            } else {
                ghostsmap[title2 + desc2] = true;
            }
        } else {
            newarr.push(arr[r]);
            pricevariation1 = 0;
            pricevariation2 = 0;
        }

        price1 = arr[r][pricepos];
        title1 = arr[r][titlepos];
        desc1 = arr[r][descpos];
    }

    arr.forEach(row => {
        if (!ghostsmap.hasOwnProperty(row[titlepos] + row[descpos])) {
            noghost.push(row);
        } else {
            ghosts.push(row);
        }
    });

    return noghost;
}


function filterSport(arrp, maxRecords, sportcat, exclude, include) {
    let filterIndex = 4;
    let arr = arrp;

    arr = filterghosts(arr, 1, 2, 22, 23);
    console.log("filterghosts", arr);


    if (exclude.length > 0) {
        arr = arr.filter(varr => {
            let desc = varr[filterIndex].toLowerCase();
            let exist = false;
            exclude.forEach(filterValue => {
                if (desc.includes(filterValue.toLowerCase())) {
                    exist = true;
                }
            });
            return !exist;
        });
    }
    console.log("exclude", arr);
    if (include.length > 0) {
        arr = arr.filter(varr => {
            let desc = varr[filterIndex].toLowerCase();
            let exist = false;
            include.forEach(filterValue => {
                if (desc.includes(filterValue.toLowerCase())) {
                    exist = true;
                }
            });
            return exist;
        });
    }
    console.log("include", arr);

    arr = arr.filter(varr => {
        return varr[20] == 0;
    });
    console.log("varr[20] == 0", arr);
    let result1 = arr.filter(varr => {
        return varr[13] > 0;
    });
    console.log("varr[13] > 0", arr);
    let result2 = arr.filter(varr => {
        return varr[13] == 0;
    });
    console.log("varr[13] == 0", arr);
    result1.sort(sortByVol);
    result2.sort(sortBySettleDate);

    let ct = result1.length;
    if (ct < maxRecords) {
        result2.forEach(row => {
            result1.push(row);
            ct++;
            if (ct == maxRecords) return;
        });
    }

    return result1;
}


function sortByVol(a, b) {
    if (a[13] === b[13]) {
        return 0;
    }
    return (a[13] > b[13]) ? -1 : 1;
}

function sortBySettleDate(a, b) {
    const t1 = DatetimeToMicroTime(a[14]);
    const t2 = DatetimeToMicroTime(b[14]);
    if (t1 === t2) return 0;
    return (t1 < t2) ? -1 : 1;
}


function DatetimeToMicroTime(dts) {
    const dt = new Date(dts);
    return dt.getTime() / 1000 + dt.getMilliseconds() * 1000; // Convert milliseconds to microseconds
}

function consoleArray(arr) {
    if (arr.length)
        arr[0].map((value, index) => {
            console.log(`${index} => ${String.fromCharCode(65 + index)} => ${value}`);
        });
}
