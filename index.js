const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const abi = require("./abi.json");
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const CONTRACT_ADDRESS = '0x2a88444D7A5626e52928D9799ae15F0Bb273bFbd';
const RPC = 'https://mainnet.era.zksync.io';
const ADDRESS_EXPLORER_URL = 'https://explorer.zksync.io/address/';
const TX_EXPLORER_URL = 'https://explorer.zksync.io/tx/';

// const ADDRESS_EXPLORER_URL = 'https://testnet.bscscan.com/address/';
// const TX_EXPLORER_URL = 'https://testnet.bscscan.com/tx/';
// const CONTRACT_ADDRESS = '0x75Cda98fb911DF8e38071A1d1Ef0cd53e86DC361';
// const RPC = 'https://data-seed-prebsc-2-s1.bnbchain.org:8545';

const provider = new ethers.providers.JsonRpcProvider(RPC);

const ALERT_THRESHOLD = 10; // alert when someone buys 10 keys

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

const CHAT_ID = -1002025621317;

// Function to send an alert message
async function sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress, txHash) {
    const userUrl = `${ADDRESS_EXPLORER_URL}${_owner}`;
    const refUrl = `${ADDRESS_EXPLORER_URL}${_refAddress}`;
    const message =
        `🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\n` +
        `<b>🐳 🐳 🐳 New OXOA Whale detected!</b>\n\n\n` +
        `<b>👨‍🦳 <a href="${userUrl}">${_owner}</a> just bought ${_numberOfNodes} 🔑</b>\n\n` +
        // `👨‍🦳 Referer: <a href="${refUrl}">${_refAddress}</a>\n\n` +
        `🔗 Transaction: ${TX_EXPLORER_URL}${txHash}\n\n` +
        `🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\n`;
    const opts = {
        parse_mode: 'HTML',
    }
    await bot.sendMessage(CHAT_ID, message, opts);
    // console.log(`message: ${message}`);
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