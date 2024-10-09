import WebSocket from 'ws';
import { checkEnvironentVariables } from './utilities.js';
import 'dotenv/config'

checkEnvironentVariables();

const currencyIds = ['mBTC', 'mETH', 'WBTC']

const ws = new WebSocket(process.env.NODE_URL);

ws.on('error', console.error);

ws.on('open', function open() {
    ws.send(JSON.stringify(
        {
            "Type": "SubscribeMarketsByFilter",
            "MaxResults": 2
            ,
            // "Nonce":63804569790630801,
            "Data": {
                "MarketFilter": {
                    "Cat": 14,
                    "OnlyActive": true,
                    "Status": 0,    //INPLAY
                    // "PageSize": 100
                },
                "SubscribeOrderbooks": true
            }
        }

    ));
});

ws.on('message', function message(data) {
    const dataObject = JSON.parse(data)
    if (dataObject.Type === "SubscribeMarketsByFilter") {
        for (const [idx, curr] of currencyIds.entries()) {
            const currData = dataObject.Data[idx.toString()];
            if (!currData) continue;
            const decoded = {
                id: idx.toString(),
                symbol: curr,
                ...currData
            }
            console.log(JSON.stringify(decoded, null, 2));
        }
        process.exit(0);
    }
});