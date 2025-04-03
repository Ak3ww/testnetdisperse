import { useEffect, useState } from 'react';
import Button from '../components/ui/button';
import styles from '../styles/DisperseUI.module.css';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x59b990c626853DC951A38EFC1dF50abb4d48Ca75';
const AVG_TOKEN_ADDRESS = '0xa41F142b6eb2b164f8164CAE0716892Ce02f311f';

const CONTRACT_ABI = [
  "function disperseBNB(address[] calldata recipients, uint256[] calldata amounts) external payable",
  "function disperseToken(address token, address[] calldata recipients, uint256[] calldata amounts) external"
];

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [mode, setMode] = useState('');
  const [inputText, setInputText] = useState('');
  const [approved, setApproved] = useState(false);

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    await web3Provider.send("eth_requestAccounts", []);
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();

    setWalletAddress(address);
    setProvider(web3Provider);
    setSigner(signer);
    setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer));
  };

  const parseInput = () => {
    const lines = inputText.trim().split('\n');
    const recipients = [];
    const amounts = [];

    for (const line of lines) {
      const [address, amount] = line.split(/[, ]+/);
      if (ethers.utils.isAddress(address) && !isNaN(parseFloat(amount))) {
        recipients.push(address);
        amounts.push(ethers.utils.parseUnits(amount.trim(), 18));
      }
    }
    return { recipients, amounts };
  };

  const approveAVG = async () => {
    const { amounts } = parseInput();
    const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));

    const avgToken = new ethers.Contract(AVG_TOKEN_ADDRESS, [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ], signer);

    const tx = await avgToken.approve(CONTRACT_ADDRESS, total);
    await tx.wait();
    alert("Approval successful");
    setApproved(true);
  };

  const sendDisperse = async () => {
    const { recipients, amounts } = parseInput();
    if (!recipients.length) return alert("No valid recipients found.");

    if (mode === 'bnb') {
      const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));
      const tx = await contract.disperseBNB(recipients, amounts, { value: total });
      await tx.wait();
      alert("BNB sent!");
    } else if (mode === 'avg') {
      const tx = await contract.disperseToken(AVG_TOKEN_ADDRESS, recipients, amounts);
      await tx.wait();
      alert("AVG tokens sent!");
    }
  };

  return (
    <div className={styles.container}>
      <h1>BNB / $AVG Disperse</h1>
      {!walletAddress ? (
        <Button onClick={connectWallet}>Connect Wallet</Button>
      ) : (
        <>
          <p>Connected: {walletAddress}</p>

          <select onChange={(e) => {
            setMode(e.target.value);
            setApproved(false);
          }}>
            <option value="">Select Token</option>
            <option value="bnb">BNB</option>
            <option value="avg">AVG Token</option>
          </select>

          {mode && (
            <>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="0xAddress, 1.23"
                rows={8}
              />

              {mode === 'avg' && !approved && (
                <Button onClick={approveAVG}>Approve $AVG</Button>
              )}

              {(mode === 'bnb' || approved) && (
                <Button onClick={sendDisperse}>Send</Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
