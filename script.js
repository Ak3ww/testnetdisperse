const contractAddress = "0x59b990c626853DC951A38EFC1dF50abb4d48Ca75";
const abi = [
  "function disperseBNB(address[] calldata recipients, uint256[] calldata amounts) external payable",
  "function disperseToken(address token, address[] calldata recipients, uint256[] calldata amounts) external",
];

async function connect() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return null;
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

function parseInputs(addressId, amountId, unit = "ether") {
  const addresses = document.getElementById(addressId).value.trim().split("\n");
  const amountsRaw = document.getElementById(amountId).value.trim().split("\n");
  const amounts = amountsRaw.map(a => ethers.utils.parseUnits(a.trim(), unit));
  if (addresses.length !== amounts.length) throw new Error("Address and amount count mismatch");
  return { addresses, amounts };
}

async function disperseBNB() {
  try {
    const signer = await connect();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const { addresses, amounts } = parseInputs("bnbRecipients", "bnbAmounts");
    const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));
    const tx = await contract.disperseBNB(addresses, amounts, { value: total });
    await tx.wait();
    alert("BNB sent successfully!");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}

async function approveToken() {
  try {
    const signer = await connect();
    const tokenAddr = document.getElementById("tokenAddress").value.trim();
    const { amounts } = parseInputs("tokenRecipients", "tokenAmounts", "18");
    const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));

    const token = new ethers.Contract(tokenAddr, [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ], signer);

    const tx = await token.approve(contractAddress, total);
    await tx.wait();
    alert("Token approved!");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}

async function disperseToken() {
  try {
    const signer = await connect();
    const tokenAddr = document.getElementById("tokenAddress").value.trim();
    const { addresses, amounts } = parseInputs("tokenRecipients", "tokenAmounts", "18");

    const contract = new ethers.Contract(contractAddress, abi, signer);
    const tx = await contract.disperseToken(tokenAddr, addresses, amounts);
    await tx.wait();
    alert("Tokens sent successfully!");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}
