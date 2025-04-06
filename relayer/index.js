
const { ethers } = require('ethers');
require('dotenv').config();

const providerSepolia = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC);
const providerMumbai = new ethers.JsonRpcProvider(process.env.MUMBAI_RPC);

const walletSepolia = new ethers.Wallet(process.env.PRIVATE_KEY, providerSepolia);
const walletMumbai = new ethers.Wallet(process.env.PRIVATE_KEY, providerMumbai);

const bridgeSepoliaAbi = require('./abis/BridgeSepolia.json').abi;
const bridgeMumbaiAbi = require('./abis/BridgeMumbai.json').abi;
const bridgeSepolia = new ethers.Contract(process.env.BRIDGE_SEPOLIA, bridgeSepoliaAbi, walletSepolia);
const bridgeMumbai = new ethers.Contract(process.env.BRIDGE_MUMBAI, bridgeMumbaiAbi, walletMumbai);

bridgeSepolia.on('BridgeInitiated', async (user, amount, targetChain, txHash) => {
  console.log(`Sepolia event: ${user}, ${amount}, ${targetChain}, ${txHash}`);
  const tx = await bridgeMumbai.mintTokens(user, amount, txHash);
  await tx.wait();
  console.log('Minted tokens on Mumbai:', tx.hash);
});

bridgeMumbai.on('BridgeInitiated', async (user, amount, targetChain, txHash) => {
  console.log(`Mumbai event: ${user}, ${amount}, ${targetChain}, ${txHash}`);
  const tx = await bridgeSepolia.releaseTokens(user, amount, txHash);
  await tx.wait();
  console.log('Released tokens on Sepolia:', tx.hash);
});
