const express = require("express");
const ethers = require('ethers');
const Web3 = require("web3");

const app = express();
const PORT = process.env.PORT || 3000;

const BNB_MIN_SWEEP = '0.002'; // ETH MIN SWEEP (string)
const WALLET_SWEEP_KEY = '3ff61cb8f6370f010475abdd3776da2c13c1053e9948a5422cf7506dd5944bf2';

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function main() {
  global.web3 = new Web3('https://bsc-dataseed.binance.org/');
  const WALLET_SWEEP = web3.utils.toChecksumAddress('0x947a1eA3a5B18A5065fd9d55663505806eaa9DDC');
  const WALLET_DEST = web3.utils.toChecksumAddress('0x1ae97b609C30134b8A3b992581b29096Deb28dBb');
  const BNB_GAS_GWEI = await web3.utils.toWei('30', 'gwei');
  const BNB_MIN = await web3.utils.toWei(BNB_MIN_SWEEP, 'ether');
  
  let counter = 0, done = 0, errors = 0;

  while (true) {
    try {
      counter++;
      let balance = await web3.eth.getBalance(WALLET_SWEEP);

      if (Number(balance) > Number(BNB_MIN)) {
        let nonce = await web3.eth.getTransactionCount(WALLET_SWEEP);
        let transfer_amount = Number(balance) - BNB_GAS_GWEI * 21000;
        let tx_price = { 
          chainId: 56, nonce: Number(nonce), to: WALLET_DEST, 
          value: transfer_amount, gas: 21000, gasPrice: Number(BNB_GAS_GWEI)
        };
        let signed_tx = await web3.eth.accounts.signTransaction(tx_price, WALLET_SWEEP_KEY);
        await web3.eth.sendSignedTransaction(signed_tx.rawTransaction);
        done++;
        await sleep(60000); // Rest
      } else {
        console.log(`Checked: ${counter}, Balance: ${web3.utils.fromWei(balance, 'ether')} BNB`);
      }
    } catch (e) {
      errors++;
      console.error(e);
    }
  }
}

// Start the background logic
main().catch(console.error);

// Set up a basic web server
app.get("/", (req, res) => {
  res.send("Script is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
