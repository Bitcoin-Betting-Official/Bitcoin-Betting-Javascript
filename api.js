import WebSocket from 'ws';
import { checkEnvironentVariables, unixToTicks, addHoursToISO, ticktoDate, hexToBase64 } from './utilities.js';
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { v4 as uuidv4 } from 'uuid';

const currencyIds = ['mBTC', 'mETH', 'WBTC'];
const currencyId = 1;

const PRIVATE_KEY = "0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2"
const RPC_ENDPOINT = "https://eth.llamarpc.com"
const NODE_URL = "wss://bitcoin-betting.org:82"
const NODE_ID = 104;
const USER_ID = 95;

export function parseMarkets(data, sportcat, limitMaxVol, limitMinVol) {
    // console.log(data.length)
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

        const SettlD = ticktoDate(market['SettlD']);
        const Status = market['Status'] || 0;
        const OrdBooks = Ru?.filter(e => e?.OrdBook)

        if (!OrdBooks)
            continue;

        if (OrdBooks.length) {

            const OrdB = OrdBooks[0]["OrdBook"];

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
                    Title,//1
                    BIDPrice,//2
                    BIDVolume,//3
                    Descr,//4
                    0,//5
                    0,//6
                    ASKPrice,//7
                    ASKVolume,//8
                    0,//9
                    0,//10
                    Green00,//11
                    Red01,//12
                    vol,//13
                    SettlD,//14
                    ruName,//15
                    "",//16
                    "",//17
                    "", //18
                    "", //10
                    Status,//20
                    "",//21
                    descvalue && descvalue.length > 0 ? parseFloat(descvalue[0]) : "", //22
                    desctext//23
                ];

                arr.push(row);
            }


        }

    }

    return arr;

}


export function filterSpor33(arr) {

    return arr.filter(e => {
        let colC = e[2];//
        return colC >= 1.3 && colC <= 3.2;
    });


}


export function filterSpor44(arr) {

    return arr.filter(e => {
        let colH = e[7];
        return colH >= 1.45 && colH <= 3.3
    });

}



export function filterghosts(arr, titlepos, pricepos, valpos, descpos) {
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


export function filterSport(arrp, maxRecords, sportcat, exclude, include) {
    let filterIndex = 4;
    let arr = arrp;
    if (arr.length === 0)
        return [];
    arr = filterghosts(arr, 1, 2, 22, 23);

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
    // console.log("exclude", arr);
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
    // console.log("include", arr);

    arr = arr.filter(varr => {
        return varr[20] === 0 || !varr[20];
    });

    let result1 = arr.filter(varr => {
        return varr[13] > 0;
    });
    // console.log("varr[13] > 0", arr);
    let result2 = arr.filter(varr => {
        return varr[13] == 0;
    });
    // console.log("varr[13] == 0", arr);
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


export function sortByVol(a, b) {
    if (a[13] === b[13]) {
        return 0;
    }
    return (a[13] > b[13]) ? -1 : 1;
}

export function sortBySettleDate(a, b) {
    const t1 = DatetimeToMicroTime(a[14]);
    const t2 = DatetimeToMicroTime(b[14]);
    if (t1 === t2) return 0;
    return (t1 < t2) ? -1 : 1;
}


export function DatetimeToMicroTime(dts) {
    const dt = new Date(dts);
    return dt.getTime() / 1000 + dt.getMilliseconds() * 1000; // Convert milliseconds to microseconds
}

export function consoleArray(arr) {
    if (arr.map) arr.map(arre => {
        arre.map((value, index) => {
            console.log(`${index} => ${String.fromCharCode(65 + index)} => ${value}`);
        });
    })

}


export function getRnd(min, max) {
    return Math.random() * (max - min) + min;
}

export function cancelLess13(newMarkets) {
    const L = 11;
    const M = 12;

    newMarkets.forEach((market, keyMarket) => {
        const LOdds = market[L];
        const MOdds = market[M];

        if (LOdds > 0 && MOdds > 0) {
            const LUSOdds = Math.abs(LOdds >= 2 ? (LOdds - 1) * 100 : (-100) / (LOdds - 1));
            const MUSOdds = Math.abs(MOdds >= 2 ? (MOdds - 1) * 100 : (-100) / (MOdds - 1));

            if (Math.abs(LOdds - MOdds) < 0.013 || Math.abs(LUSOdds - MUSOdds) < 1.3) {
                // Cancel odds
                newMarkets[keyMarket][L] = 0;
            }
        }
    });

    return newMarkets;
}

export function cancelOver4(newMarkets, limitL, limitM) {
    const L = 11;
    const M = 12;

    newMarkets.forEach((market, keyMarket) => {
        if (market[L] < limitL) {
            newMarkets[keyMarket][L] = 0;
        }
        if (market[M] >= limitM) {
            newMarkets[keyMarket][M] = 0;
        }
    });

    return newMarkets;
}

export function limitLandM(matchedOrders, newMarkets) {
    const L = 11;
    const M = 12;
    const F = 6;

    matchedOrders.forEach((order) => {
        const boa = order[0];
        const mid = order[1];
        const blockOrders = order[F];

        if (blockOrders === 1) {
            newMarkets.forEach((market, marketKey) => {
                if (mid === market[0]) {
                    if (boa === 0) {
                        // Green
                        newMarkets[marketKey][L] = 0;
                    } else if (boa === 1) {
                        // Red
                        newMarkets[marketKey][M] = 0;
                    }
                    return; // Exit the loop early
                }
            });
        }
    });

    return newMarkets;
}


export function parseMatchedOrders(orders) {
    let matchedOrders = [];
    orders.forEach((order) => {
        let UserOrder = order["UserOrder"];
        let MatchedOrder = order["MatchedOrder"];
        let Side = UserOrder["Side"] || 0;//BidOrAsk
        let MarketID = UserOrder["MarketID"];
        let State = MatchedOrder["State"];
        let Price = MatchedOrder["Price"];
        let Amount = MatchedOrder["Amount"];

        matchedOrders.push([Side, MarketID, Price, Amount, State]);
        // matchedOrders.push([BidOrAsk, MarketID, RunnerID, OrderID, MatchedSubUser, Price, Amount, Red, DecResult, R, ID, State, MakerCancelTime]);
    });

    return matchedOrders;
}


export function filterMatchedOrders(arr) {

    // Filter array
    let result = arr.filter(function (e) {
        return e[4] === 0;
    });

    // Sort array
    result.sort(sortByMid);

    return result;
}

export function sortByMid(a, b) {
    let cra1 = a[0];
    let cra2 = a[1];
    let crb1 = b[0];
    let crb2 = b[1];

    let cra = cra1 + cra2;
    let crb = crb1 + crb2;

    if (cra === crb) {
        return 0;
    }
    return cra > crb ? -1 : 1;
}

export function combineMatchedOrders(matchedOrders) {
    if (matchedOrders.length === 0)
        return [];

    let combinedMatchedOrders = [];
    let newMatchedOrders = [...matchedOrders];
    let ct = 0;
    let n = 1;

    combinedMatchedOrders.push(matchedOrders[0]);

    newMatchedOrders.splice(0, 1);

    newMatchedOrders.forEach((row, i) => {
        if (
            combinedMatchedOrders[ct][0] === row[0] &&
            combinedMatchedOrders[ct][1] === row[1]
        ) {
            combinedMatchedOrders[ct][2] += row[2];
            combinedMatchedOrders[ct][3] += row[3];
            n = n + 1;
        } else {
            combinedMatchedOrders[ct][2] = combinedMatchedOrders[ct][2] / n;
            combinedMatchedOrders.push(row);
            ct = ct + 1;
            n = 1;
        }
    });

    if (n > 1) {
        combinedMatchedOrders[ct][2] = combinedMatchedOrders[ct][2] / n;
    }

    return combinedMatchedOrders;
}


export function editMatchedOrders(matchedOrders, Limit) {
    matchedOrders.forEach((order, orderKey) => {
        let BidAsk = order[0];
        let Price = order[2];
        let Amount = order[3];

        Amount = realAmount(BidAsk, Price, Amount); // Calculate the real amount
        matchedOrders[orderKey][3] = Amount;

        let Status = statusFormula(Price, Limit, Amount); // Calculate the status
        matchedOrders[orderKey].push(Limit); // Add Limit
        matchedOrders[orderKey].push(Status); // Add Status
    });
    return matchedOrders;
}

export function realAmount(bidAsk, price, amount) {
    return (bidAsk === 0 && price > 2) ? (price - 1) * amount : amount;
}

export function statusFormula(Price, Limit, Amount) {
    return Limit > Amount ? 0 : 1;
}


// Function to promisify WebSocket connection and message
export function sendMessageAndAwaitResponse(url, messageToSend) {
    return new Promise((resolve, reject) => {

        const ws = new WebSocket(url);

        ws.on('open', () => {
            // console.log('WebSocket connection opened');
            // console.log('send message:', messageToSend);
            ws.send(messageToSend); // Send the message
        });

        ws.on('message', (messageb) => {
            const message = messageb.toString();
            const dataObject = JSON.parse(message);
            // console.log('Received message:', dataObject);
            if (
                dataObject.Type === "SubscribeMarketsByFilter" ||
                dataObject.Type === "SubscribeMatches" ||
                dataObject.Type === "OrderAlteration" ||
                dataObject.Type === "SubscribeUOrders" ||
                dataObject.State === "Error"

            ) {

                resolve(dataObject);
                ws.close(); // Close the connection

            }
            // console.log('Received message:', message);
            // Resolve with the message received

        });

        ws.on('error', (err) => {
            console.error('erx', dataObject);
            reject(err); // Reject the promise if there's an error
        });

        ws.on('close', () => {
            // console.log('WebSocket connection closed');
        });
    });
};


export function manageOrders(oldMarkets, newMarkets, amount) {
    let chunks = 0;
    const createArrays = {};
    const midsToCancel = [];
    newMarkets.forEach((newMarket, keyNewMarket) => {
        let newMarketid = newMarket[0];
        let newGreen00 = newMarket[11];
        let newRed01 = newMarket[12];
        let newName = newMarket[15];
        let newOrderid00 = newMarket[18];
        let newOrderid01 = newMarket[19];
        let newAmount = amount;
        let exist = false;

        oldMarkets.forEach((oldMarket, keyOldMarket) => {
            let oldMarketid = oldMarket[0];
            let oldGreen00 = oldMarket[11];
            let oldRed01 = oldMarket[12];
            let oldName = oldMarket[15];
            let oldAmount = oldMarket[16];
            let oldOrderid00 = oldMarket[18];
            let oldOrderid01 = oldMarket[19];

            if (newMarketid === oldMarketid && oldName === newName) {
                oldMarkets[keyOldMarket][21] = 1;
                exist = true;
                return;
            }
        });

        if (exist) {
            if (
                parseFloat(newGreen00.toFixed(4)) !== parseFloat(oldMarkets[11].toFixed(4)) ||
                parseFloat(newRed01.toFixed(4)) !== parseFloat(oldMarkets[12].toFixed(4))
            ) {
                newMarkets[keyNewMarket][17] = "ec";
                midsToCancel.push(newMarket);

                if (newGreen00 > 0) {
                    let USOdds = newGreen00 >= 2 ? newGreen00 - 1 : newGreen00 - 1;
                    let newAm = newGreen00 === 2 ? amount : amount / USOdds;

                    createArrays[Math.floor(chunks / 50)] = createArrays[Math.floor(chunks / 50)] || [];
                    createArrays[Math.floor(chunks / 50)].push({
                        Mid: newMarketid,
                        Rid: 0,
                        Oid: -1,
                        Type: 1,
                        Am: newAm,
                        Pri: newGreen00,
                        Boa: 0,
                        Mct: 0
                    });
                    chunks++;
                    newMarkets[keyNewMarket][16] = amount;
                }
                if (newRed01 > 0) {
                    createArrays[Math.floor(chunks / 50)] = createArrays[Math.floor(chunks / 50)] || [];
                    createArrays[Math.floor(chunks / 50)].push({
                        Mid: newMarketid,
                        Rid: 0,
                        Oid: -1,
                        Type: 1,
                        Am: amount,
                        Pri: newRed01,
                        Boa: 1,
                        Mct: 0
                    });
                    chunks++;
                    newMarkets[keyNewMarket][16] = amount;
                }
            } else {
                newMarkets[keyNewMarket][17] = "enc";
                newMarkets[keyNewMarket][16] = oldMarkets[16];
                newMarkets[keyNewMarket][18] = oldMarkets[18];
                newMarkets[keyNewMarket][19] = oldMarkets[19];
            }
        } else {
            newMarkets[keyNewMarket][17] = "n";

            if (newGreen00 > 0) {
                let USOdds = newGreen00 >= 2 ? newGreen00 - 1 : newGreen00 - 1;
                let newAm = newGreen00 === 2 ? amount : amount / USOdds;

                createArrays[Math.floor(chunks / 50)] = createArrays[Math.floor(chunks / 50)] || [];
                createArrays[Math.floor(chunks / 50)].push({
                    Mid: newMarketid,
                    Rid: 0,
                    Oid: -1,
                    Type: 1,
                    Am: newAm,
                    Pri: newGreen00,
                    Boa: 0,
                    Mct: 0
                });
                chunks++;
                newMarkets[keyNewMarket][16] = amount;
            }

            if (newRed01 > 0) {
                createArrays[Math.floor(chunks / 50)] = createArrays[Math.floor(chunks / 50)] || [];
                createArrays[Math.floor(chunks / 50)].push({
                    Mid: newMarketid,
                    Rid: 0,
                    Oid: -1,
                    Type: 1,
                    Am: amount,
                    Pri: newRed01,
                    Boa: 1,
                    Mct: 0
                });
                chunks++;
                newMarkets[keyNewMarket][16] = amount;
            }
        }
    });

    return {
        midsToCancel, createArrays
    }
}

export function cancelOldMarkets(oldMarkets, midsToCancel) {
    oldMarkets.forEach(oldMarket => {
        if (oldMarket[21] !== 1) {
            let oldMarketid = oldMarket[0];
            midsToCancel.push(oldMarket);
        }
    });
}


export async function handleCancelMarkets(midsToCancel) {

    console.log("handle cancel orders");
    for (let midToCancelKey in midsToCancel) {
        const midToCancel = midsToCancel[midToCancelKey];
        const mid = midToCancel[0];
        const oid1 = midToCancel[18];
        const oid2 = midToCancel[19];
        console.log({ oid1, oid2 })
        console.log("cancelling orders on market...");
        console.log("market", mid);
        if (oid1) {
            console.log("cancelling order side 1 ...");
            const canceledOrder = await cancelOrder(mid, oid1);
            console.log(canceledOrder);
        }
        if (oid2) {
            console.log("cancelling order side 2 ...");
            const canceledOrder = await cancelOrder(mid, oid2);
            console.log(canceledOrder);

        }

    }


}

export async function handleCreateOrders(newMarkets, createArrays) {
    for (let chKey in createArrays) {
        if (createArrays.hasOwnProperty(chKey)) {
            let createOrders = createArrays[chKey];
            let error = true;
            console.log(`${chKey}: ${createOrders.length}`);

            for (let createOrderKey in createOrders) {
                const createOrder = createOrders[createOrderKey];
                console.log("Creating order...");
                console.log(createOrder);
                const response = await createUnmatchedOrder(createOrder);
                if (response.State === "Success") {
                    console.log("Order created...")
                    console.log(response.Data)
                    error = false;
                    const orderId = response.Data.UserOrder.OrderID;
                    const marketId = createOrder.Mid;
                    const boa = createOrder.Boa;
                    setOrdersId(newMarkets, orderId, marketId, boa);

                } else {
                    console.error("Creating order failed");
                    console.log(response);
                }


                await sleep(1000);
            }
            await sleep(1000);
        }
    }

}

export function setOrdersId(newMarkets, orderId, marketId, boa) {
    console.log("Saving new order id");
    let exist = false;
    let createdMarketId = marketId;
    let keyMarketIndex = 0;

    newMarkets.forEach((market, keyMarket) => {
        let marketId = market[0];
        if (createdMarketId === marketId) {
            keyMarketIndex = keyMarket;
            exist = true;
            return;
        }
    });

    if (exist) {

        if (boa === 0)
            newMarkets[keyMarketIndex][18] = orderId;
        else
            newMarkets[keyMarketIndex][19] = orderId;

    }

}

export function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }


export async function createUnmatchedOrder(uorder) {

    // Wallet Config
    const account = privateKeyToAccount(PRIVATE_KEY)

    const client = createWalletClient({
        chain: mainnet,
        transport: http(RPC_ENDPOINT),
        account
    })

    const makerOrderId = uuidv4();

    const orderData = {
        CreatedByUser: unixToTicks(Date.now()),
        MinerFeeStr: "0.00001",
        NodeID: NODE_ID,
        UnmatchedOrder: {
            //Amount: 1.0,
            Amount: Math.min(uorder.Am, 0.02),
            Cur: currencyId,
            // mCT: uorder.Mct,
            ID: makerOrderId,
            //Price: 1.825,
            Price: parseFloat(uorder.Pri.toFixed(3)),
            //RemAmount: 1.0,
            RemAmount: Math.min(uorder.Am, 0.02),
            // Side: uorder.Boa
            ...(uorder.Boa === 1 ? { Side: uorder.Boa } : {})
            // Type: uorder.Type,
        },
        UserID: USER_ID,
        UserOrder: {
            MarketID: uorder.Mid
        }
    }
    // console.log({ orderData })
    const signature = await client.signMessage({ message: JSON.stringify(orderData) })
    const message = JSON.stringify({
        Type: "OrderAlteration",
        SignatureUser: hexToBase64(signature.slice(2)),
        Data: orderData
    });

    const newUnmatchedOrder = await sendMessageAndAwaitResponse(NODE_URL, message);

    return newUnmatchedOrder;
}

export async function cancelOrder(mid, oid) {

    // Wallet Config
    const account = privateKeyToAccount(PRIVATE_KEY)

    const client = createWalletClient({
        chain: mainnet,
        transport: http(RPC_ENDPOINT),
        account
    })

    const orderData = {
        CreatedByUser: unixToTicks(Date.now()),
        MinerFeeStr: "0.00001",
        NodeID: NODE_ID,
        OldOrderID: oid,
        UserID: USER_ID,
        UserOrder: {
            MarketID: mid
        }
    }
    const signature = await client.signMessage({ message: JSON.stringify(orderData) })
    const message = JSON.stringify({
        Type: "OrderAlteration",
        SignatureUser: hexToBase64(signature.slice(2)),
        Data: orderData
    });

    const canceledUnmatchedOrder = await sendMessageAndAwaitResponse(NODE_URL, message);

    return canceledUnmatchedOrder;
}