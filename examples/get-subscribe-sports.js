import WebSocket from 'ws';
import { checkEnvironentVariables } from './utilities.js';
import 'dotenv/config'

checkEnvironentVariables();

const currencyIds = ['mBTC', 'mETH', 'WBTC']

const ws = new WebSocket(process.env.NODE_URL);

ws.on('error', console.error);

ws.on('open', function open() {
    ws.send(JSON.stringify({
        "Type": "SubscribeSports",
    }));
});

ws.on('message', function message(data) {
    const dataObject = JSON.parse(data)
    if (dataObject.Type === "SubscribeSports") {
        console.log(dataObject)
        // for (const [idx, curr] of currencyIds.entries()) {
        //     const currData = dataObject.Data[idx.toString()];
        //     if (!currData) continue;
        //     const decoded = {
        //         id: idx.toString(),
        //         symbol: curr,
        //         ...currData
        //     }
        //     console.log(decoded);
        // }
        process.exit(0);
    }
});