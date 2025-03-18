import {config} from './config.js';
import {
    createWalletClient,
    createPublicClient,
    getContract,
    http,
    parseEther
} from 'https://unpkg.com/viem@2.19.4/dist/index.js';
import {mainnet} from 'https://unpkg.com/viem@2.19.4/dist/chains.js';
import {privateKeyToAccount} from 'https://unpkg.com/viem@2.19.4/dist/accounts.js';

// Utility functions
function unixToTicks(unix) {
    return unix * 10000 + 621355968000000000;
}

function hexToBase64(hexStr) {
    if (hexStr.startsWith('0x')) hexStr = hexStr.slice(2);
    let binary = '';
    for (let i = 0; i < hexStr.length; i += 2) {
        binary += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
    }
    return btoa(binary);
}

function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

// Contract setup
const BB_ABI = [
    "function withdraw(uint256 amount, uint256 nonce, address receiver, uint8 currency, bytes32 txid, bytes signature)"
];
const BB_CONTRACT_ADDRESS = '0x5978C6153A06B141cD0935569F600a83Eb44AeAa';

const account = privateKeyToAccount(config.PRIVATE_KEY);
const walletClient = createWalletClient({
    chain: mainnet,
    transport: http(config.RPC_ENDPOINT),
    account
});
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(config.RPC_ENDPOINT)
});
const mainContract = getContract({
    abi: BB_ABI,
    address: BB_CONTRACT_ADDRESS,
    client: walletClient
});

// Withdraw RBTC: sends a Transfer request then performs on-chain withdrawal after receiving a burn validation.
export async function withdrawRBTC(amount) {
    const withdrawData = {
        Amount: amount,
        CreatedByUser: unixToTicks(Date.now()),
        Cur: 0,
        From: config.USER_ID,
        ID: generateUUID(),
        MinerFeeStr: '0.00001',
        NodeID: config.NODE_ID,
        Reference: account.address.toLowerCase(),
        TType: 10,
        UserID: config.USER_ID
    };

    const signature = await walletClient.signMessage({message: JSON.stringify(withdrawData)});
    const transferMessage = {
        Type: 'Transfer',
        SignatureUser: hexToBase64(signature.slice(2)),
        Data: withdrawData,
        UserID: config.USER_ID
    };
    console.log('Sending withdraw request:', transferMessage);

    const ws = new WebSocket(config.NODE_URL);
    ws.onopen = () => {
        ws.send(JSON.stringify(transferMessage));
    };

    await new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.Type === 'Transfer') {
                console.log('Withdraw request response:', response.State);
                ws.close();
                resolve();
            }
        };
        ws.onerror = reject;
    });

    // Delay to allow processing
    await new Promise(res => setTimeout(res, 5000));
    const burnValidation = await getBurnValidations();
    if (!burnValidation) throw new Error('No burn validation received');
    const txHash = await performOnChainWithdrawal(burnValidation);
    console.log('Withdrawal transaction hash:', txHash);
    return txHash;
}

// Query burn validations.
export async function getBurnValidations() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(config.NODE_URL);
        const message = {
            Type: 'GetBurnValidations',
            Data: {
                MaxResults: 1,
                NodeID: config.NODE_ID,
                UserID: config.USER_ID
            }
        };
        ws.onopen = () => {
            ws.send(JSON.stringify(message));
        };
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.Type === 'GetBurnValidations' && response.Data && response.Data.length > 0) {
                ws.close();
                resolve(response.Data[0]);
            }
        };
        ws.onerror = (err) => {
            ws.close();
            reject(err);
        };
    });
}

// Simulate and perform on-chain withdrawal.
export async function performOnChainWithdrawal(burnValidation) {
    const amountEth = parseEther((burnValidation.Amount / 1000).toString());
    const request = await mainContract.simulate.withdraw([
        amountEth,
        BigInt(burnValidation.Nonce),
        account.address,
        0,
        `0x${burnValidation.TXID}`,
        burnValidation.SignatureValidator
    ]);
    const txHash = await walletClient.writeContract(request.request);
    await publicClient.waitForTransactionReceipt({hash: txHash, confirmations: 1});
    return txHash;
}

// Burn funds by sending a Transfer request with a specified withdrawal address.
export async function burnFunds(amount, withdrawalAddress) {
    const burnData = {
        Amount: amount,
        CreatedByUser: unixToTicks(Date.now()),
        Cur: 0,
        From: config.USER_ID,
        ID: generateUUID(),
        MinerFeeStr: '0.00001',
        NodeID: config.NODE_ID,
        Reference: withdrawalAddress,
        TType: 10,
        UserID: config.USER_ID
    };
    const signature = await walletClient.signMessage({message: JSON.stringify(burnData)});
    const message = {
        Type: 'Transfer',
        SignatureUser: hexToBase64(signature.slice(2)),
        Data: burnData,
        UserID: config.USER_ID
    };
    console.log('Sending burn funds request:', message);
    const ws = new WebSocket(config.NODE_URL);
    ws.onopen = () => {
        ws.send(JSON.stringify(message));
    };
    return new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.Type === 'Transfer') {
                console.log('Burn funds response:', response);
                ws.close();
                resolve(response);
            }
        };
        ws.onerror = reject;
    });
}

// Call the smart contract's withdrawal function.
export async function callWithdrawalFunction({amount, nonce, receiver, currency, txid, signature}) {
    try {
        const amountUnit = parseEther(amount.toString());
        console.log('Calling smart contract withdraw function...');
        const txHash = await mainContract.write.withdraw([
            amountUnit,
            BigInt(nonce),
            receiver,
            currency,
            txid,
            signature
        ]);
        console.log('Withdrawal transaction hash:', txHash);
        await publicClient.waitForTransactionReceipt({hash: txHash, confirmations: 1});
        return txHash;
    } catch (error) {
        console.error('Error calling withdrawal function:', error);
        throw error;
    }
}

// Query burn validations (alternative function).
export async function queryBurnValidations(maxResults = 10) {
    return new Promise((resolve, reject) => {
        const message = {
            Type: 'GetBurnValidations',
            Data: {
                NodeID: config.NODE_ID,
                UserID: config.USER_ID,
                MaxResults: maxResults
            }
        };
        const ws = new WebSocket(config.NODE_URL);
        ws.onopen = () => {
            ws.send(JSON.stringify(message));
        };
        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                if (response.Type === 'GetBurnValidations' && response.State === 'Success') {
                    ws.close();
                    const validations = response.BurnValidations || response.Data;
                    resolve(validations);
                }
            } catch (error) {
                ws.close();
                reject(error);
            }
        };
        ws.onerror = (err) => {
            ws.close();
            reject(err);
        };
    });
}

// Attach event listeners to UI buttons.
document.getElementById('withdrawBtn').addEventListener('click', async () => {
    try {
        const txHash = await withdrawRBTC(0.1);
        console.log('Withdraw RBTC tx hash:', txHash);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('burnBtn').addEventListener('click', async () => {
    try {
        const response = await burnFunds(0.05, '0xYourWithdrawalAddressHere');
        console.log('Burn funds response:', response);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('queryValidationsBtn').addEventListener('click', async () => {
    try {
        const validations = await queryBurnValidations(5);
        console.log('Burn Validations:', validations);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('callWithdrawBtn').addEventListener('click', async () => {
    try {
        const withdrawalParams = {
            amount: 0.1,
            nonce: Date.now(),
            receiver: account.address,
            currency: 0,
            txid: '0xYOUR_TXID_PLACEHOLDER', // Replace with a valid 32-byte hex txid
            signature: '0xYOUR_SIGNATURE'    // Replace with the corresponding signature hex
        };
        const txHash = await callWithdrawalFunction(withdrawalParams);
        console.log('Successful withdrawal. Tx hash:', txHash);
    } catch (err) {
        console.error(err);
    }
});