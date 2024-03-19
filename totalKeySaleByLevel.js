const { ethers } = require('ethers');
const abi = require("./abi.json");

const CONTRACT_ADDRESS = '0x2a88444D7A5626e52928D9799ae15F0Bb273bFbd';
const RPC = 'https://mainnet.era.zksync.io';

const provider = new ethers.providers.JsonRpcProvider(RPC);

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

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

async function getTotalKeySaleByLevel(level) {
    const nodePrice = ethers.utils.parseEther(TIER_PRICE_MAP[level.toString()][0].toString()).toString();

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
        if (args['_nodePrice'].toString() == nodePrice) {
            totalKeySale += numberOfNodes;
        }
    }

    console.log(`totalKeySale of level ${level}: ${totalKeySale}`)
}

async function main() {
    for (let i = 1; i <= 25; i++) {
        await getTotalKeySaleByLevel(i);
    }
}

main();