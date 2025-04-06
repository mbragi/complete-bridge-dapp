import { useState } from 'react';
import { ethers } from 'ethers';
import MyTokenAbi from './abis/MyToken.json';
import BridgeSepoliaAbi from './abis/BridgeSepolia.json';

const TOKEN_ADDRESS = '0x7e86897eb6641096141A27923f6E00Df3D63F833';
const BRIDGE_ADDRESS = '0x67E9F7E909a2B0e429af46D12c125e7fe8fF37A0';

function Bridge() {
  // Separate state variables for each operation
  const [mintAmount, setMintAmount] = useState('');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  // Get signer and ensure the user is connected to Sepolia
  const getSigner = async () => {
    if (!window.ethereum) throw new Error("MetaMask is required");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    // Check if connected network is Sepolia (chainId: 11155111)
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      try {
        // Request to switch to Sepolia (chainId in hex: 0xaa36a7)
        await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
      } catch (error) {
        throw new Error("Please switch to the Sepolia network in MetaMask.");
      }
    }
    return provider.getSigner();
  };

  // Mint tokens to the current user's address
  // Note: The MyToken contract requires the caller to have BRIDGE_ROLE.
  const mintTokens = async () => {
    try {
      if (!mintAmount || isNaN(mintAmount) || Number(mintAmount) <= 0) {
        alert("Please enter a valid amount to mint.");
        return;
      }
      const signer = await getSigner();
      const token = new ethers.Contract(TOKEN_ADDRESS, MyTokenAbi.abi, signer);
      const tx = await token.mint(await signer.getAddress(), ethers.parseEther(mintAmount));
      await tx.wait();
      alert(`Minted ${mintAmount} MTK tokens successfully!`);
      setMintAmount('');
    } catch (err) {
      alert(`Error minting tokens: ${err.message}`);
    }
  };

  // Approve and lock tokens in the BridgeSepolia contract for bridging to Mumbai
  const bridgeTokens = async () => {
    try {
      if (!bridgeAmount || isNaN(bridgeAmount) || Number(bridgeAmount) <= 0) {
        alert("Please enter a valid amount to bridge.");
        return;
      }
      const signer = await getSigner();
      const token = new ethers.Contract(TOKEN_ADDRESS, MyTokenAbi.abi, signer);
      const bridge = new ethers.Contract(BRIDGE_ADDRESS, BridgeSepoliaAbi.abi, signer);
      const parsedAmount = ethers.parseEther(bridgeAmount);

      // Approve tokens for the Bridge contract
      const approval = await token.approve(BRIDGE_ADDRESS, parsedAmount);
      await approval.wait();

      // Call lockTokens on the BridgeSepolia contract.
      // This will transfer tokens from the user to the Bridge contract.
      const tx = await bridge.lockTokens(parsedAmount, "Mumbai");
      await tx.wait();

      alert(`Bridging of ${bridgeAmount} MTK to Mumbai initiated!`);
      setBridgeAmount('');
    } catch (err) {
      alert(`Error bridging tokens: ${err.message}`);
    }
  };

  // Transfer tokens to a specified recipient
  const transferTokens = async () => {
    try {
      if (!transferAmount || isNaN(transferAmount) || Number(transferAmount) <= 0) {
        alert("Please enter a valid amount to transfer.");
        return;
      }
      if (!recipient) {
        alert("Please enter a valid recipient address.");
        return;
      }
      const signer = await getSigner();
      const token = new ethers.Contract(TOKEN_ADDRESS, MyTokenAbi.abi, signer);
      const tx = await token.transfer(recipient, ethers.parseEther(transferAmount));
      await tx.wait();
      alert(`Transferred ${transferAmount} MTK tokens to ${recipient}!`);
      setTransferAmount('');
      setRecipient('');
    } catch (err) {
      alert(`Error transferring tokens: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>MTK Token Bridge (Sepolia ↔ Mumbai)</h2>

      <div style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h3>Mint Tokens</h3>
        <input
          type="number"
          placeholder="Amount to mint (MTK)"
          value={mintAmount}
          onChange={e => setMintAmount(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={mintTokens}>Mint Tokens</button>
      </div>

      <div style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h3>Bridge Tokens to Mumbai</h3>
        <input
          type="number"
          placeholder="Amount to bridge (MTK)"
          value={bridgeAmount}
          onChange={e => setBridgeAmount(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={bridgeTokens}>Bridge Tokens</button>
      </div>

      <div style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h3>Transfer Tokens</h3>
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{ marginRight: "0.5rem", width: "320px" }}
        />
        <input
          type="number"
          placeholder="Amount to transfer (MTK)"
          value={transferAmount}
          onChange={e => setTransferAmount(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={transferTokens}>Transfer Tokens</button>
      </div>
    </div>
  );
}

export default Bridge;
