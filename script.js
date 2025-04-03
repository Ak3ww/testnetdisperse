const disperseAddress = "0x59b990c626853DC951A38EFC1dF50abb4d48Ca75";
const avgTokenAddress = "0xa41F142b6eb2b164f8164CAE0716892Ce02f311f";

let provider, signer, contract;
let mode = "";
let connected = false;

const abi = [
  "function disperseBNB(address[] calldata recipients, uint256[] calldata amounts) external payable",
  "function disperseToken(address token, address[] calldata recipients, uint256[] calldata amounts) external",
];

async function connectWallet() {
  if (!window.ethereum) return alert("Install MetaMask");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  const address = await signer.getAddress();
  document.getElementById("walletAddress").innerText = `Connected: ${address}`;
  connected = true;
  document.getElementById("mode").disabled = false;
}

function toggleMode() {
  mode = document.getElementById("mode").value;
  document.getElementById("inputSection").style.display = mode ? "block" : "none";
  document.getElementById("approveBtn").style.display = mode === "avg" ? "block" : "none";
  document.getElementById("sendBtn").style.display = mode === "bnb" ? "block" : "none";
}

function parseInput() {
  const lines = document.getElementById("inputData").value.trim().split("\n");
  const addresses = [];
  const amounts = [];
  for (const line of lines) {
    const [addr, amt] = line.split(/[, ]+/); // comma or space
    if (ethers.utils.isAddress(addr) && !isNaN(parseFloat(amt))) {
      addresses.push(addr);
      amounts.push(ethers.utils.parseUnits(amt, 18));
    }
  }
  return { addresses, amounts };
}

async function approveAVG() {
  try {
    const { amounts } = parseInput();
    const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));

    const token = new ethers.Contract(avgTokenAddress, [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ], signer);

    const tx = await token.approve(disperseAddress, total);
    await tx.wait();

    document.getElementById("approveBtn").style.display = "none";
    document.getElementById("sendBtn").style.display = "block";
    alert("Approval successful. You can now send.");
  } catch (err) {
    console.error(err);
    alert("Approval failed: " + err.message);
  }
}

async function sendDisperse() {
  try {
    const { addresses, amounts } = parseInput();
    const disperse = new ethers.Contract(disperseAddress, abi, signer);

    if (mode === "bnb") {
      const total = amounts.reduce((sum, a) => sum.add(a), ethers.BigNumber.from(0));
      const tx = await disperse.disperseBNB(addresses, amounts, { value: total });
      await tx.wait();
      alert("BNB sent successfully!");
    } else if (mode === "avg") {
      const tx = await disperse.disperseToken(avgTokenAddress, addresses, amounts);
      await tx.wait();
      alert("AVG sent successfully!");
    }
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}
