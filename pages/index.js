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
  const [preview, setPreview] = useState({ count: 0, total: '0.0' });
  const [txHash, setTxHash] = useState('');
  const [success, setSuccess] = useState(false);

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

  const updatePreview = () => {
    const lines = inputText.trim().split('\n');
    let count = 0;
    let total = ethers.BigNumber.from(0);
    try {
      for (const line of lines) {
        const [address, amount] = line.split(/[, ]+/);
        if (ethers.utils.isAddress(address) && !isNaN(parseFloat(amount))) {
          count++;
          total = total.add(ethers.utils.parseUnits(amount.trim(), 18));
        }
      }
      setPreview({
        count,
        total: ethers.utils.formatUnits(total, 18)
      });
    } catch {
      setPreview({ count: 0, total: '0.0' });
    }
  };

  const approveAVG = async () => {
    const { amounts } = parseInput();
    const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));

    const avgToken = new ethers.Contract(AVG_TOKEN_ADDRESS, [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ], signer);

    const tx = await avgToken.approve(CONTRACT_ADDRESS, total);
    await tx.wait();
    setApproved(true);
  };

  const sendDisperse = async () => {
    const { recipients, amounts } = parseInput();
    if (!recipients.length) return alert("No valid recipients found.");

    setSuccess(false);
    setTxHash('');

    let tx;
    if (mode === 'bnb') {
      const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));
      tx = await contract.disperseBNB(recipients, amounts, { value: total });
    } else {
      tx = await contract.disperseToken(AVG_TOKEN_ADDRESS, recipients, amounts);
    }

    setTxHash(tx.hash);
    await tx.wait();
    setSuccess(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>BNB / $AVG Disperse</h1>

      {!walletAddress ? (
        <Button onClick={connectWallet}>Connect Wallet</Button>
      ) : (
        <>
          <p className={styles.connected}>Connected: {walletAddress}</p>

          <select className={styles.select} onChange={(e) => {
            setMode(e.target.value);
            setApproved(false);
            setSuccess(false);
            setTxHash('');
          }}>
            <option value="">Select Token</option>
            <option value="bnb">BNB</option>
            <option value="avg">AVG Token</option>
          </select>

          {mode && (
            <>
              <textarea
                className={styles.textarea}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  updatePreview();
                }}
                placeholder="0xAddress, 1.23"
                rows={8}
              />

              <div className={styles.preview}>
                👥 Recipients: <strong>{preview.count}</strong> | 💰 Total: <strong>{preview.total} {mode === 'bnb' ? 'BNB' : 'AVG'}</strong>
              </div>

              {mode === 'avg' && !approved && (
                <Button onClick={approveAVG}>Approve $AVG</Button>
              )}

              {(mode === 'bnb' || approved) && (
                <>
                  <Button onClick={sendDisperse}>Send</Button>
                  {success && txHash && (
                    <p className={styles.txinfo}>
                      ✅ Transaction sent!{' '}
                      <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                        View on BscScan
                      </a>
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
