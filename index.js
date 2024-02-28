const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const abi = require("./abi.json");
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const CONTRACT_ADDRESS = '0x2a88444D7A5626e52928D9799ae15F0Bb273bFbd';
const RPC = 'https://mainnet.era.zksync.io';

const provider = new ethers.providers.JsonRpcProvider(RPC);

const ALERT_THRESHOLD = 10; // alert when someone buys 10 keys

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

// Function to send an alert message
async function sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress) {
    const userUrl = `https://explorer.zksync.io/address/${_owner}`;
    const refUrl = `https://explorer.zksync.io/address/${_refAddress}`;
    const message = `🐳 🐳 🐳 New OXOA Whale detected!\n\n\n` +
        `👨‍🦳 <a href="${userUrl}">${_owner}</a> just bought ${_numberOfNodes} 🔑\n\n` +
        `👨‍🦳 Referer: <a href="${refUrl}">${_refAddress}</a>\n`;
    // Replace with your chat ID or logic to determine chat IDs to send alerts to
    await bot.sendMessage(your_chat_id, message);
}

/*
Monitor for buy keys

NewNode(uint256 _numberOfNodes, address _owner, uint256 _nodeId, uint256 _nodePrice, uint256 _refAmount, address _refAddress)
*/
contract.on('NewNode', async (_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress) => {
    const numKeys = _numberOfNodes.toNumber();
    // if (numKeys >= ALERT_THRESHOLD) {
    //     await sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress);
    // }
    await sendAlert(_numberOfNodes, _owner, _nodeId, _nodePrice, _refAmount, _refAddress);
});