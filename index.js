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

const CHAT_ID = -1002025621317;
const CHAT_ID_2 = -1002076861425;

// Function to send an alert message
async function sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, txHash) {
    const userUrl = `${ADDRESS_EXPLORER_URL}${_owner}`;
    const refUrl = `${ADDRESS_EXPLORER_URL}${_refAddress}`;
    const price = ethers.utils.formatUnits(_nodePrice);

    const message =
        `<b>👨‍🦳 Ví <a href="${userUrl}">${_owner}</a> vừa mua thêm ${_numberOfNodes} 🔑 (Giá 1 🔑: ${price} $ETH) </b>\n\n` +
        `<b>🔗 Transaction mua: ${TX_EXPLORER_URL}${txHash}\n\n</b>` +
        `<b>🤑 Mua key tại đây 👉 ${REF_LINK}</b>\n\n`
    const opts = {
        parse_mode: 'HTML',
    }
    await bot.sendMessage(CHAT_ID, message, opts);
    await bot.sendMessage(CHAT_ID_2, message, opts);
}

/*
Monitor for buy keys

NewNode(uint256 _numberOfNodes, address _owner, uint256 _nodeId, uint256 _nodePrice, uint256 _refAmount, address _refAddress)
*/
contract.on('NewNode', async (_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, event) => {
    const numKeys = _numberOfNodes.toNumber();
    if (numKeys >= ALERT_THRESHOLD) {
        await sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, event.transactionHash);
    }
});