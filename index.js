const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const abi = require("./abi.json");
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const CONTRACT_ADDRESS = '0x2a88444D7A5626e52928D9799ae15F0Bb273bFbd';
const RPC = 'https://mainnet.era.zksync.io';
const ADDRESS_EXPLORER_URL = 'https://explorer.zksync.io/address/';
const TX_EXPLORER_URL = 'https://explorer.zksync.io/tx/';
const REF_LINK = 'https://node.oxoa.games?ref=0x3E657D3CF4cb2104E6A5a6eD6f19aE23d8869999';

const provider = new ethers.providers.JsonRpcProvider(RPC);

const ALERT_THRESHOLD = 5; // alert when someone buys 5 keys

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

const CHAT_IDS = [-1002025621317, -1002076861425, -1002114899869];

const NUM_KEYS_PER_TIER = {
    '1': 2500,
    '2': 2365,
    '3': 2239,
    '4': 2247,
    '5': 2013,
    '6': 1912,
    '7': 1818,
    '8': 1729,
    '9': 1646,
    '10': 1569,
    '11': 1497,
    '12': 1430,
    '13': 1368,
    '14': 1309,
    '15': 1254,
    '16': 1203,
    '17': 1155,
    '18': 1109,
    '19': 1067,
    '20': 1026,
    '21': 987,
    '22': 951,
    '23': 916,
    '24': 884,
    '25': 854,
}

const TIER_PRICE_MAP = {
    '1': [0.04, 0.032, 0.0004],
    '2': [0.047, 0.0376, 0.00047],
    '3': [0.054, 0.0432, 0.00054],
    '4': [0.062, 0.0496, 0.00062],
    '5': [0.073, 0.0584, 0.00073],
    '6': [0.085, 0.068, 0.00085],
    '7': [0.099, 0.0792, 0.00099],
    '8': [0.115, 0.092, 0.00115],
    '9': [0.134, 0.1072, 0.00134],
    '10': [0.155, 0.124, 0.00155],
    '11': [0.18, 0.1, 0.1],
    '12': [0.2, 0.1, 0.1],
    '13': [0.24, 0.1, 0.1],
    '14': [0.277, 0.1, 0.1],
    '15': [0.318, 0.1, 0.1],
    '16': [0.365, 0.1, 0.1],
    '17': [0.418, 0.1, 0.1],
    '18': [0.478, 0.1, 0.1],
    '19': [0.546, 0.1, 0.1],
    '20': [0.623, 0.1, 0.1],
    '21': [0.712, 0.1, 0.1],
    '22': [0.814, 0.1, 0.1],
    '23': [0.929, 0.1, 0.1],
    '24': [1.06, 0.1, 0.1],
    '25': [1.21, 0.1, 0.1],
}

function formatAddress(address) {
    return address.slice(0, 4) + '...' + address.slice(-3);
}

function getTierFromNodePrice(price) {
    let prices = [-1.0];
    for (const [_, value] of Object.entries(TIER_PRICE_MAP)) {
        prices.push(value[0]);
    }
    let tier = prices.indexOf(parseFloat(price.toFixed(4)));
    return tier;
}

function getTierKeysLeft(totalKeySale, currentTier) {
    let sum = 0;
    for (let tier = 1; tier <= currentTier; tier++) {
        const sTier = tier.toString();
        sum += NUM_KEYS_PER_TIER[sTier];
        if (sum >= totalKeySale) {
            console.log(sum - totalKeySale)
            return sum - totalKeySale;
        }
    }
}

// Function to send an alert message
async function sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, txHash, currentTier, totalKeySale) {
    const userUrl = `${ADDRESS_EXPLORER_URL}${_owner}`;
    const price = ethers.utils.formatUnits(_nodePrice);

    const totalPrice = price * _numberOfNodes;
    const displayTotalPrice = parseFloat(totalPrice.toFixed(6));
    const keysLeft = getTierKeysLeft(totalKeySale, currentTier);
    const tierTarget = NUM_KEYS_PER_TIER[currentTier.toString()];

    const message =
        `<b>👨‍🦳 Ví <a href="${userUrl}">${formatAddress(_owner)}</a> vừa mua ${_numberOfNodes} 🔑 x ${price} $ETH = ${displayTotalPrice} $ETH </b>\n\n` +
        `<b>Tổng số 🔑 Tier ${currentTier}: ${tierTarget} 🔑</b>\n\n` +
        `<b>Đã bán: ${tierTarget - keysLeft} 🔑</b>\n\n` +
        `<b>Còn lại: ${keysLeft} 🔑</b>\n\n` +
        `<b>🔗 TXID: <a href="${TX_EXPLORER_URL}${txHash}">check tại đây</a>\n\n</b>` +
        `<b>🤑 Mua key 👉 <a href="${REF_LINK}">tại đây</a></b>\n\n` +
        `<b>💻 Hướng dẫn 👉 <a href="https://t.me/oxoavn/2941">tại đây</a></b>\n\n`
    const opts = {
        parse_mode: 'HTML',
    }
    for (const chatId of CHAT_IDS) {
        await bot.sendMessage(chatId, message, opts);
    }
}

/*
Monitor for buy keys

NewNode(uint256 _numberOfNodes, address _owner, uint256 _nodeId, uint256 _nodePrice, uint256 _refAmount, address _refAddress)
*/
contract.on('NewNode', async (_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, event) => {
    try {
        const state = await contract._state();
        const nodePrice = state['_nodePrice'];
        const price = parseFloat(ethers.utils.formatUnits(nodePrice).toString());
        const currentTier = getTierFromNodePrice(price);

        const filter = {
            address: CONTRACT_ADDRESS,
            topics: [
                "0x448511bdc0685b88ba7db67a898512cd63b1a760d8beef3e3d10974907845333",
                null, // _owner
                null, // _nodePrice
                null, // _refAddress
            ]
        }

        let totalKeySale = 0;
        const events = await contract.queryFilter(filter);
        for (const event of events) {
            const args = event.args;
            const numberOfNodes = args['_numberOfNodes'].toNumber();
            totalKeySale += numberOfNodes;
        }

        const numKeys = _numberOfNodes.toNumber();

        console.log(`tx: ${event.transactionHash}`);

        if (numKeys >= ALERT_THRESHOLD) {
            await sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, event.transactionHash, currentTier, totalKeySale);
        }
    } catch (err) {
        console.log('err: ', err);
    }
});