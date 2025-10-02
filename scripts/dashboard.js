// dashboard.js - Complete implementation for GenetAi Presale Dashboard
// Place this in ./scripts/dashboard.js
// IMPORTANT: Update your HTML to use WalletConnect v2:
// Replace <script src="https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>
// With: <script src="https://unpkg.com/@walletconnect/ethereum-provider@2.14.0/dist/umd/index.min.js"></script>
// Also, get a free Project ID from https://cloud.walletconnect.com and replace 'YOUR_PROJECT_ID' below.

// Configuration
const CONTRACT_ADDRESS = '0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E';
const CHAIN_ID = 97; // BSC Testnet
const BSC_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const TOKEN_PRICE_BNB = 0.15; // Hardcoded for now; update via contract if available
const HARD_CAP_BNB = 6666.67; // Approx $1M at $150/BNB; adjust as needed
const TOTAL_SUPPLY = 100000000;
const PRESALE_ALLOCATION = 0.4;

// Placeholder ABI for a standard presale contract (since yours isn't verified on BscScan)
// Customize this with your actual ABI once verified/deployed properly
const CONTRACT_ABI = [
  // View functions
  {
    "inputs": [],
    "name": "totalRaised",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "userContribution",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "userTokens",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalContributors",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokensSold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "presaleEnded",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Transaction functions
  {
    "inputs": [],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "Contribution",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "address", "name": "claimer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "TokensClaimed",
    "type": "event"
  }
];

let web3;
let contract;
let userAccount;
let isConnected = false;

// Initialize Web3 on load
async function init() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
  } else {
    web3 = new Web3(BSC_RPC);
  }
  contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
  await updateLiveData();
  setInterval(updateLiveData, 10000); // Poll every 10s
  updateDaysLeft(); // Static for now
  updateTokenCalculation(); // Initial calc
  document.getElementById('connectWalletBtn').addEventListener('click', toggleWalletDropdown);
  document.getElementById('contributionAmount').addEventListener('input', updateTokenCalculation);
}

// Wallet Functions
async function connectMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask not detected. Install it from https://metamask.io');
    return;
  }

  try {
    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAccount = accounts[0];

    // Switch to BSC Testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }] // 97 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902) { // Chain not added
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x61',
            chainName: 'BSC Testnet',
            rpcUrls: [BSC_RPC],
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            blockExplorerUrls: ['https://testnet.bscscan.com']
          }]
        });
      } else {
        throw switchError;
      }
    }

    // Verify chain ID
    const chainId = await web3.eth.getChainId();
    if (chainId !== CHAIN_ID) {
      alert('Please switch to BSC Testnet.');
      return;
    }

    await handleConnection();
  } catch (error) {
    console.error('MetaMask connection failed:', error);
    if (error.code === 4001) {
      alert('Connection rejected by user.');
    } else {
      alert('Connection failed. Ensure MetaMask is unlocked.');
    }
  }
}

async function connectWalletConnect() {
  // WalletConnect v2
  if (typeof WalletConnectEthereumProvider === 'undefined') {
    alert('WalletConnect not loaded. Check script tags.');
    return;
  }

  const provider = await WalletConnectEthereumProvider.init({
    projectId: 'e50f0a4298c581eadf73071430522379', // Replace with your WalletConnect Cloud project ID
    chains: [CHAIN_ID],
    showQrModal: true,
    metadata: {
      name: 'GenetAi Presale',
      description: 'Connect to contribute to the presale',
      url: window.location.href,
      icons: [] // Add logo URLs if available
    }
  });

  try {
    await provider.connect();
    web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    userAccount = accounts[0];
    await handleConnection();
  } catch (error) {
    console.error('WalletConnect failed:', error);
    alert('WalletConnect connection failed. Check console.');
  }
}

async function handleConnection() {
  isConnected = true;
  updateWalletUI();
  await updateUserStats();
  document.getElementById('contributeBtn').disabled = false;
  document.getElementById('contributeBtn').textContent = 'Contribute Now';
  const statusDot = document.getElementById('connectionStatus');
  statusDot.textContent = 'Connected';
  statusDot.className = 'status-dot connected';
}

function disconnectWallet() {
  isConnected = false;
  userAccount = null;
  updateWalletUI();
  document.getElementById('contributeBtn').disabled = true;
  document.getElementById('contributeBtn').textContent = 'Connect Wallet to Contribute';
  const statusDot = document.getElementById('connectionStatus');
  statusDot.textContent = 'Disconnected';
  statusDot.className = 'status-dot disconnected';
  document.getElementById('walletInfoCompact').style.display = 'none';
  document.getElementById('userStats').style.display = 'none';
  document.getElementById('claimSection').style.display = 'none';
}

function toggleWalletDropdown() {
  const dropdown = document.getElementById('walletDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function closeModal() {
  document.getElementById('walletConnectModal').style.display = 'none';
}

// Contribution Functions
function setAmount(amount) {
  document.getElementById('contributionAmount').value = amount;
  updateTokenCalculation();
}

function updateTokenCalculation() {
  const amount = parseFloat(document.getElementById('contributionAmount').value) || 0;
  const tokens = (amount / TOKEN_PRICE_BNB).toFixed(0);
  document.getElementById('tokenAmount').textContent = tokens;
  document.getElementById('tokenPriceDisplay').textContent = `${TOKEN_PRICE_BNB} BNB`;
}

async function contribute() {
  if (!isConnected || !userAccount) {
    alert('Wallet not connected.');
    return;
  }

  const amountInput = parseFloat(document.getElementById('contributionAmount').value);
  if (amountInput < 0.01 || amountInput > 10) {
    alert('Contribution must be between 0.01 and 10 BNB.');
    return;
  }

  const amount = web3.utils.toWei(amountInput.toString(), 'ether');

  try {
    const gasEstimate = await contract.methods.contribute().estimateGas({ from: userAccount, value: amount });
    await contract.methods.contribute().send({
      from: userAccount,
      value: amount,
      gas: gasEstimate + 50000 // Buffer
    });
    alert('Contribution successful!');
    updateUserStats();
    updateLiveData();
    document.getElementById('contributionAmount').value = '';
    updateTokenCalculation();
  } catch (error) {
    console.error('Contribution failed:', error);
    if (error.code === 4001) {
      alert('Transaction rejected.');
    } else if (error.message.includes('insufficient funds')) {
      alert('Insufficient BNB balance.');
    } else {
      alert('Transaction failed. Check console.');
    }
  }
}

async function claimTokens() {
  if (!isConnected || !userAccount) {
    alert('Wallet not connected.');
    return;
  }

  try {
    const gasEstimate = await contract.methods.claimTokens().estimateGas({ from: userAccount });
    await contract.methods.claimTokens().send({
      from: userAccount,
      gas: gasEstimate
    });
    alert('Tokens claimed successfully!');
    updateUserStats();
  } catch (error) {
    console.error('Claim failed:', error);
    alert('Claim failed. Presale may not have ended yet.');
  }
}

// Live Data Updates
async function updateLiveData() {
  try {
    const totalRaised = web3.utils.fromWei(await contract.methods.totalRaised().call(), 'ether');
    const totalContributors = await contract.methods.totalContributors().call();
    const tokensSold = await contract.methods.tokensSold().call();
    const averageContribution = totalRaised > 0 ? (parseFloat(totalRaised) / totalContributors).toFixed(4) : 0;

    // Update UI
    document.getElementById('totalRaisedUSD').textContent = `$${(parseFloat(totalRaised) * 150).toLocaleString()}`; // Assume $150/BNB
    document.getElementById('raisedBNB').textContent = totalRaised;
    document.getElementById('targetBNB').textContent = HARD_CAP_BNB.toFixed(2);
    document.getElementById('remainingBNB').textContent = (HARD_CAP_BNB - parseFloat(totalRaised)).toFixed(2);
    document.getElementById('totalContributors').textContent = totalContributors;
    document.getElementById('averageContribution').textContent = `${averageContribution} BNB`;
    document.getElementById('tokensSold').textContent = web3.utils.fromWei(tokensSold, 'ether');
    document.getElementById('liveTokensSold').textContent = web3.utils.fromWei(tokensSold, 'ether');
    document.getElementById('liveTokenPrice').textContent = `${TOKEN_PRICE_BNB} BNB`;

    const progress = Math.min((parseFloat(totalRaised) / HARD_CAP_BNB * 100), 100).toFixed(1);
    document.getElementById('presaleProgress').textContent = `${progress}%`;
    document.getElementById('progressPercent').textContent = `${progress}%`;
    document.getElementById('progressBarFill').style.width = `${progress}%`;

    document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    refreshTransactions();
  } catch (error) {
    console.error('Failed to update live data:', error);
  }
}

async function updateUserStats() {
  if (!userAccount) return;

  try {
    const userContrib = web3.utils.fromWei(await contract.methods.userContribution(userAccount).call(), 'ether');
    const userTokens = web3.utils.fromWei(await contract.methods.userTokens(userAccount).call(), 'ether');
    const presaleEnded = await contract.methods.presaleEnded().call();

    document.getElementById('userContribution').textContent = `${parseFloat(userContrib).toFixed(4)} BNB`;
    document.getElementById('userTokens').textContent = `${parseInt(userTokens).toLocaleString()} $GENE`;

    // Show compact wallet info
    const shortAddress = `${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`;
    const balance = web3.utils.fromWei(await web3.eth.getBalance(userAccount), 'ether');
    document.getElementById('walletAddressCompact').textContent = shortAddress;
    document.getElementById('walletBalanceCompact').textContent = `${parseFloat(balance).toFixed(4)} BNB`;

    document.getElementById('walletInfoCompact').style.display = 'block';
    document.getElementById('userStats').style.display = 'block';

    // Show claim if ended and tokens > 0
    if (presaleEnded && parseInt(userTokens) > 0) {
      document.getElementById('claimSection').style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to update user stats:', error);
  }
}

function updateWalletUI() {
  const status = document.getElementById('walletStatus');
  const addressEl = document.getElementById('walletAddress');
  const balanceEl = document.getElementById('walletBalance');

  if (isConnected && userAccount) {
    status.textContent = 'Connected';
    status.className = 'wallet-status connected';
    const shortAddress = `${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`;
    addressEl.textContent = shortAddress;
    addressEl.style.display = 'block';

    // Update balance
    web3.eth.getBalance(userAccount).then(balance => {
      const bnb = web3.utils.fromWei(balance, 'ether');
      balanceEl.textContent = `${parseFloat(bnb).toFixed(4)} BNB`;
      balanceEl.style.display = 'block';
    });
  } else {
    status.textContent = 'Not Connected';
    status.className = 'wallet-status disconnected';
    addressEl.style.display = 'none';
    balanceEl.style.display = 'none';
  }
}

function updateDaysLeft() {
  // Static for demo; replace with contract end time
  document.getElementById('daysLeft').textContent = '30';
}

// Transactions
async function refreshTransactions() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 100, 0); // Last 100 blocks
    const events = await contract.getPastEvents('Contribution', { fromBlock, toBlock: 'latest' });

    const transactionsList = document.getElementById('transactionsList');
    if (events.length === 0) {
      transactionsList.innerHTML = '<div class="no-transactions">No contributions yet.</div>';
      return;
    }

    let html = '';
    events.slice(-10).reverse().forEach(event => { // Last 10
      const contrib = web3.utils.fromWei(event.returnValues.amount, 'ether');
      const shortAddr = event.returnValues.contributor.slice(0, 10) + '...';
      html += `
        <div class="transaction-item">
          <span class="tx-address">${shortAddr}</span>
          <span class="tx-amount">${parseFloat(contrib).toFixed(4)} BNB</span>
          <span class="tx-time">${new Date().toLocaleString()}</span> <!-- Approx timestamp -->
        </div>
      `;
    });
    transactionsList.innerHTML = html;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    document.getElementById('transactionsList').innerHTML = '<div class="error">Failed to load transactions.</div>';
  }
}

// Static updates
document.getElementById('liveTokenPrice').textContent = `${TOKEN_PRICE_BNB} BNB`;

// Init on load
window.addEventListener('load', init);

// Handle chain changed/account changed
if (window.ethereum) {
  window.ethereum.on('chainChanged', () => window.location.reload());
  window.ethereum.on('accountsChanged', () => {
    if (window.ethereum.selectedAddress === null) {
      disconnectWallet();
    } else {
      window.location.reload();
    }
  });
}