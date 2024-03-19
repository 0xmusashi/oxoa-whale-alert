const { ethers } = require('ethers');
const abi = require("./abi.json");

const CONTRACT_ADDRESS = '0x2a88444D7A5626e52928D9799ae15F0Bb273bFbd';
const RPC = 'https://mainnet.era.zksync.io';
const TX = '0x595a9f1d65360c8d28842948d2eec6c85f6dd15ed4f4ee844f9779a2342bf7e6';

const provider = new ethers.providers.JsonRpcProvider(RPC);

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

async function getTotalKeySale() {
    const state = await contract._state();
    const nodePrice = state['_nodePrice'];
    const price = parseFloat(ethers.utils.formatUnits(nodePrice).toString());

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
        if (event.transactionHash.toLowerCase() == TX) {
            break;
        }
    }

    console.log(`totalKeySale: ${totalKeySale}`)
}

getTotalKeySale();