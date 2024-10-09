
import * as api from '../api.js';

const PRIVATE_KEY = "0x8a35b9d771ea0f1380cf68e8173994a7efa3c6b5957f833c54826db135af08e2"
const RPC_ENDPOINT = "https://eth.llamarpc.com"
const NODE_URL = "wss://bitcoin-betting.org:82"
const NODE_ID = 104;
const USER_ID = 95;

const canelAll = async () => {
    console.log("Cancel all orders");
    const message = JSON.stringify({
        Type: "SubscribeUOrders",
        UserID: USER_ID,
        DATA: {
            "SubscribeUpdates": false,
            "AddMarketSummary": false,
        }
    });

    const uOrdersRes = await api.sendMessageAndAwaitResponse(NODE_URL, message);
    const uOrdersData = uOrdersRes.Data;
    const totaluOrders = uOrdersData.length;
    for (let uOrderDataIndex in uOrdersData) {
        console.log("cancel ", uOrderDataIndex, "/", totaluOrders);
        const uOrder = uOrdersData[uOrderDataIndex];
        const mid = uOrder.UserOrder.MarketID;
        const oid = uOrder.UserOrder.OrderID;
        await api.cancelOrder(mid, oid);
        api.sleep(1000);
    }


}

canelAll()