import { parseAbi } from 'viem'

import 'dotenv/config'

export const BB_CONTRACT_ADDRESS = '0x5978C6153A06B141cD0935569F600a83Eb44AeAa'

export const BB_ABI = parseAbi([
    "function deposit(uint256 userId)",
    "function depositERC(uint256 amount, address tokenAddress, uint8 currency, uint256 userid)",
    "function withdraw(uint256 amount, uint256 nonce, address receiver, uint8 currency, bytes32 txid, bytes signature)",
    "function withdrawERC(uint256 amount, uint256 nonce, address tokenAddress, uint8 currency, address receiver, bytes32 txid, bytes signature)"
])

export const ERC20_ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
])

export const CurrenciesData = [
    { id: 0, decimals: 18, contract: '' },
    { id: 1, decimals: 18 },
    { id: 2, decimals: 8, contract: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' }
]

export const unixToTicks = (unix) => {
    return unix * 10000 + 621355968000000000
}

export const hexToBase64 = (hexStr) => {
    let base64 = ''
    for (let i = 0; i < hexStr.length; i++) {
        base64 += !((i - 1) & 1)
            ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16))
            : ''
    }
    return Buffer.from(base64, 'binary').toString('base64')
}

export const checkEnvironentVariables = () => {
    // dotenv.config()
    if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY environment variable not found.')
    if (!process.env.RPC_ENDPOINT) throw new Error('RPC_ENDPOINT environment variable not found. You can set a public one like: https://eth.llamarpc.com')
    if (!process.env.USER_ID) throw new Error('No USER_ID environment variable specified.')
    if (!process.env.NODE_ID) throw new Error('No NODE_ID environment variable specified. Check if of the node and set it.')
    if (!process.env.NODE_URL) throw new Error('No NODE_URL environment variable specified.')
}


export const addHoursToISO = (hours) => {
    // Get the current date and time
    const date = new Date();

    // Add the specified number of hours
    date.setHours(date.getHours() + hours);

    // Convert to ISO 8601 format
    const isoString = date.toISOString();

    return isoString;
}

export const addMinutesToISO = (minutes) => {
    // Get the current date and time
    const date = new Date();

    // Add the specified number of hours
    date.setMinutes(date.getMinutes() + minutes);

    // Convert to ISO 8601 format
    const isoString = date.toISOString();

    return isoString;
}


export const ticktoDate = (ticks) => {

    // ticks Use BigInt for large numbers

    // .NET ticks between 0001-01-01 and 1970-01-01
    const ticksBetweenEpochs = 621355968000000000; // .NET ticks for 1970-01-01

    // Subtract ticks for the Unix epoch (1970-01-01)
    const ticksSinceUnixEpoch = ticks - ticksBetweenEpochs;

    // Convert ticks to milliseconds (1 tick = 100 nanoseconds = 0.0001 milliseconds)
    const milliseconds = Number(ticksSinceUnixEpoch) / 10000;

    // Convert to JavaScript Date
    return new Date(milliseconds);

}

export function generateCSharpTicks() {
    // JavaScript epoch is 1970-01-01, C# epoch is 0001-01-01
    const epochDifference = 62135596800000; // Difference in milliseconds between 0001-01-01 and 1970-01-01
    const now = Date.now(); // Current time in milliseconds since 1970-01-01
    const highPrecisionNow = performance.now(); // High-resolution time in milliseconds

    // Calculate ticks based on Date.now() (in milliseconds)
    const ticksFromDateNow = (now + epochDifference) * 10000; // Convert to ticks (100 nanoseconds units)

    // Add the high precision part (microseconds -> ticks)
    const highPrecisionFraction = (highPrecisionNow % 1) * 10000; // microseconds to ticks

    // Return combined result as integer ticks
    return Math.floor(ticksFromDateNow + highPrecisionFraction);
}