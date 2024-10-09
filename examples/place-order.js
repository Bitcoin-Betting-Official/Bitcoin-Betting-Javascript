import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { hexToBase64, unixToTicks, checkEnvironentVariables } from '../utilities.js';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';


// Operation Config

const currencyId = 1; // Currency ID: 'mBTC' = 0, 'mETH' = 1, 'WBTC' = 2


// checkEnvironentVariables();

// Operation Config
const makerOrderId = uuidv4();
console.log("makerOrderId", makerOrderId)
// "9099a901-9180-4869-afb7-e1cc88c2c169"
const marketID = "aa4a98ea-812c-4ca6-b74b-6ade7f6e444e"
const amount = 1.1;   // 0.01 mWBTC
const price = 1;    // Decimal odds
const side = 1;         // 1 = Buy, 2 = Sell

// Wallet Config
const account = privateKeyToAccount("0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2")

const client = createWalletClient({
    chain: mainnet,
    transport: http("https://eth.llamarpc.com"),
    account
})

const placeOrder = async (depositHash) => {
    console.log('Will place an order on Bitcoin betting.')
    // ATTENTION: Make sure that all parameters are in alphabetical order.
    const orderData = {
        CreatedByUser: unixToTicks(Date.now()),          // User that created maker order
        MinerFeeStr: "0.00001",
        NodeID: 12,
        // UnmatchedOrder: {
        //     Amount: amount,
        //     Cur: currencyId,
        //     ID: makerOrderId,
        //     Price: price,
        //     RemAmount: amount,
        //     Side: side,
        //     Type: 2,
        // },
        UserID: 95,
        UserOrder: {
            MarketID: marketID
        }
    }

    const signature = await client.signMessage({ message: JSON.stringify(orderData) })
    const message = {
        Type: "OrderAlteration",
        SignatureUser: hexToBase64(signature.slice(2)),
        Data: orderData
    }

    console.log(JSON.stringify(message));

    const ws = new WebSocket("wss://bitcoin-betting.org:82");
    ws.on('open', function open() {
        ws.send(JSON.stringify(message));
    });
    ws.on('message', function message(data) {
        const dataObject = JSON.parse(data)
        if (dataObject.Type === "OrderAlteration") {
            console.log('Order Placement Status:', dataObject)
            process.exit(0);
        }
    });
}

placeOrder()