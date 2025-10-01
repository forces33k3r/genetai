// Dashboard Configuration
const CONTRACT_ADDRESS = '0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E';
const BSC_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const PRESALE_GOAL_USD = 1000000; // $1,000,000
const TOKEN_PRICE_BNB = 0.15;
const BNB_PRICE_USD = 300; // Example price, you might want to fetch this from an API
const WALLETCONNECT_PROJECT_ID = 'e50f0a4298c581eadf73071430522379';

// Contract ABI (Extended for dashboard functionality)
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "totalRaised",
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
        "name": "presaleEndTime",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "minContribution",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxContribution",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "contributions",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
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
    }
];

class DashboardManager {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
        this.walletConnectProvider = null;
        this.updateInterval = null;
        this.walletType = null; // 'metamask' or 'walletconnect'
        this.init();
    }

    async init() {
        try {
            // Initialize contract (will connect Web3 later when wallet connects)
            this.contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check for existing wallet connection
            await this.checkExistingConnection();
            
            // Load initial data (even without wallet connection)
            await this.updateDashboard();
            
            // Set up periodic updates
            this.updateInterval = setInterval(() => this.updateDashboard(), 10000);
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showFallbackData();
        }
    }

    setupEventListeners() {
        // Wallet dropdown
        document.getElementById('connectWalletBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWalletDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeWalletDropdown();
        });

        // Contribution amount input
        document.getElementById('contributionAmount').addEventListener('input', (e) => this.calculateTokens(e.target.value));
    }

    toggleWalletDropdown() {
        const dropdown = document.getElementById('walletDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }

    closeWalletDropdown() {
        document.getElementById('walletDropdown').style.display = 'none';
    }

    async checkExistingConnection() {
        // Check MetaMask first
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectMetaMask();
                }
            } catch (error) {
                console.log('No existing MetaMask connection');
            }
        }

        // Check WalletConnect (you might want to implement session persistence)
        // This is a simplified version - in production, you'd want to check localStorage
    }

    async connectMetaMask() {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('MetaMask is not installed. Please install MetaMask to continue.');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.web3 = new Web3(window.ethereum);
            this.userAddress = accounts[0];
            this.isConnected = true;
            this.walletType = 'metamask';
            
            this.updateWalletDisplay();
            await this.updateUserStats();
            await this.updateUserBalance();
            
            // Set up event listeners for MetaMask
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });

            this.closeWalletDropdown();
            
        } catch (error) {
            console.error('Error connecting MetaMask:', error);
            if (error.code === 4001) {
                alert('Please connect your MetaMask wallet to continue.');
            } else {
                alert('Error connecting MetaMask. Please try again.');
            }
        }
    }

    async connectWalletConnect() {
        try {
            // Initialize WalletConnect Provider
            this.walletConnectProvider = new WalletConnectProvider.default({
                rpc: {
                    56: "https://bsc-dataseed.binance.org/",
                    97: "https://data-seed-prebsc-1-s1.binance.org:8545/" // BSC Testnet
                },
                chainId: 97, // BSC Testnet
                projectId: WALLETCONNECT_PROJECT_ID
            });

            // Enable session (triggers QR Code modal)
            await this.walletConnectProvider.enable();
            
            this.web3 = new Web3(this.walletConnectProvider);
            const accounts = await this.web3.eth.getAccounts();
            
            this.userAddress = accounts[0];
            this.isConnected = true;
            this.walletType = 'walletconnect';
            
            this.updateWalletDisplay();
            await this.updateUserStats();
            await this.updateUserBalance();
            
            this.closeWalletDropdown();
            this.closeModal();
            
            // Set up WalletConnect event listeners
            this.walletConnectProvider.on("accountsChanged", (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            this.walletConnectProvider.on("chainChanged", (chainId) => {
                window.location.reload();
            });

            this.walletConnectProvider.on("disconnect", (code, reason) => {
                this.disconnectWallet();
            });

        } catch (error) {
            console.error('Error connecting WalletConnect:', error);
            if (error.message !== 'User closed modal') {
                alert('Error connecting via WalletConnect. Please try again.');
            }
        }
    }

    async showWalletConnectQR() {
        this.openModal();
        const modalContent = document.getElementById('walletConnectQR');
        modalContent.innerHTML = '<div class="loading">Loading QR code...</div>';

        try {
            // WalletConnect will handle the QR code display automatically
            // This is just a fallback in case we need custom QR display
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <p>WalletConnect will open a QR code automatically.</p>
                    <p>If no QR code appears, please check your wallet app.</p>
                </div>
            `;
        } catch (error) {
            console.error('Error showing QR code:', error);
            modalContent.innerHTML = '<div class="error">Error loading QR code. Please try again.</div>';
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnectWallet();
        } else {
            this.userAddress = accounts[0];
            this.updateWalletDisplay();
            this.updateUserStats();
            this.updateUserBalance();
        }
    }

    async disconnectWallet() {
        // Disconnect WalletConnect if active
        if (this.walletConnectProvider) {
            try {
                await this.walletConnectProvider.disconnect();
            } catch (error) {
                console.error('Error disconnecting WalletConnect:', error);
            }
            this.walletConnectProvider = null;
        }

        // Reset all connection states
        this.web3 = null;
        this.userAddress = null;
        this.isConnected = false;
        this.walletType = null;
        
        this.updateWalletDisplay();
        
        // Re-initialize contract with basic Web3 for data reading
        this.contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    }

    updateWalletDisplay() {
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const contributeBtn = document.getElementById('contributeBtn');
        const walletInfoCompact = document.getElementById('walletInfoCompact');

        if (this.isConnected && this.userAddress) {
            const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            
            walletStatus.textContent = `Connected (${this.walletType})`;
            walletStatus.className = 'wallet-status connected';
            walletAddress.textContent = shortAddress;
            walletAddress.style.display = 'block';
            
            connectWalletBtn.textContent = `Connected (${this.walletType})`;
            connectWalletBtn.disabled = true;
            contributeBtn.disabled = false;
            contributeBtn.textContent = 'Contribute to Presale';
            
            // Update compact wallet info
            walletInfoCompact.style.display = 'block';
            document.getElementById('walletAddressCompact').textContent = shortAddress;
            document.getElementById('walletBalanceCompact').textContent = 'Loading balance...';
            
        } else {
            walletStatus.textContent = 'Not Connected';
            walletStatus.className = 'wallet-status disconnected';
            walletAddress.style.display = 'none';
            walletBalance.style.display = 'none';
            
            connectWalletBtn.textContent = 'Connect Wallet';
            connectWalletBtn.disabled = false;
            contributeBtn.disabled = true;
            contributeBtn.textContent = 'Connect Wallet to Contribute';
            
            walletInfoCompact.style.display = 'none';
            document.getElementById('userStats').style.display = 'none';
        }
    }

    async updateUserBalance() {
        if (!this.isConnected || !this.userAddress || !this.web3) return;

        try {
            const balance = await this.web3.eth.getBalance(this.userAddress);
            const balanceBNB = this.web3.utils.fromWei(balance, 'ether');
            
            document.getElementById('walletBalance').textContent = `${parseFloat(balanceBNB).toFixed(4)} BNB`;
            document.getElementById('walletBalance').style.display = 'block';
            document.getElementById('walletBalanceCompact').textContent = `${parseFloat(balanceBNB).toFixed(4)} BNB`;
            
        } catch (error) {
            console.error('Error updating user balance:', error);
        }
    }

    async updateUserStats() {
        if (!this.isConnected || !this.userAddress) return;

        try {
            const userContribution = await this.contract.methods.contributions(this.userAddress).call();
            const userContributionBNB = this.web3.utils.fromWei(userContribution, 'ether');
            const userTokens = (userContributionBNB / TOKEN_PRICE_BNB).toFixed(2);

            document.getElementById('userContribution').textContent = `${parseFloat(userContributionBNB).toFixed(4)} BNB`;
            document.getElementById('userTokens').textContent = `${parseInt(userTokens).toLocaleString()} $GENE`;
            document.getElementById('userStats').style.display = 'block';

            // Show claim section if user has contributed
            if (parseFloat(userContributionBNB) > 0) {
                document.getElementById('claimSection').style.display = 'block';
            }

        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    async updateDashboard() {
        try {
            // Use basic Web3 provider for reading contract data (no wallet needed)
            const readWeb3 = new Web3(BSC_RPC_URL);
            const contract = new readWeb3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            const [totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution] = await Promise.all([
                contract.methods.totalRaised().call(),
                contract.methods.totalContributors().call(),
                contract.methods.tokensSold().call(),
                contract.methods.presaleEndTime().call(),
                contract.methods.minContribution().call(),
                contract.methods.maxContribution().call()
            ]);

            this.updateDashboardUI(totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution);
            this.updateLastUpdated();

        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateDashboardUI(totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution) {
        // Convert from wei to BNB
        const raisedBNB = web3.utils.fromWei(totalRaised, 'ether');
        const raisedUSD = (raisedBNB * BNB_PRICE_USD).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        const progress = ((raisedBNB * BNB_PRICE_USD) / PRESALE_GOAL_USD) * 100;
        const daysLeft = this.calculateDaysLeft(presaleEndTime);
        const targetBNB = (PRESALE_GOAL_USD / BNB_PRICE_USD).toFixed(2);
        const remainingBNB = (targetBNB - raisedBNB).toFixed(2);
        const averageContribution = totalContributors > 0 ? (raisedBNB / totalContributors).toFixed(4) : 0;

        // Update key metrics
        document.getElementById('totalRaisedUSD').textContent = raisedUSD;
        document.getElementById('presaleProgress').textContent = `${progress.toFixed(1)}%`;
        document.getElementById('daysLeft').textContent = daysLeft;

        // Update progress section
        document.getElementById('progressPercent').textContent = `${progress.toFixed(1)}%`;
        document.getElementById('progressBarFill').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('raisedBNB').textContent = `${parseFloat(raisedBNB).toFixed(2)} BNB`;
        document.getElementById('targetBNB').textContent = `${targetBNB} BNB`;
        document.getElementById('remainingBNB').textContent = `${Math.max(0, remainingBNB)} BNB`;

        // Update contribution stats
        document.getElementById('totalContributors').textContent = parseInt(totalContributors).toLocaleString();
        document.getElementById('averageContribution').textContent = `${averageContribution} BNB`;
        document.getElementById('tokensSold').textContent = parseInt(tokensSold).toLocaleString();

        // Update token metrics
        document.getElementById('liveTokensSold').textContent = parseInt(tokensSold).toLocaleString();

        // Update contribution limits
        document.getElementById('minContribution').textContent = `${web3.utils.fromWei(minContribution, 'ether')} BNB`;
        document.getElementById('maxContribution').textContent = `${web3.utils.fromWei(maxContribution, 'ether')} BNB`;

        // Update progress bar color
        const progressFill = document.getElementById('progressBarFill');
        if (progress >= 100) {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (progress >= 50) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        }
    }

    calculateTokens(amount) {
        if (!amount || amount <= 0) {
            document.getElementById('tokenAmount').textContent = '0';
            return;
        }

        const tokens = amount / TOKEN_PRICE_BNB;
        document.getElementById('tokenAmount').textContent = tokens.toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    }

    calculateDaysLeft(endTime) {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = endTime - now;
        return Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60)));
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }

    async contribute() {
        if (!this.isConnected || !this.userAddress || !this.web3) {
            alert('Please connect your wallet first.');
            return;
        }

        const amount = document.getElementById('contributionAmount').value;
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const amountWei = this.web3.utils.toWei(amount, 'ether');

        try {
            document.getElementById('contributeBtn').disabled = true;
            document.getElementById('contributeBtn').textContent = 'Processing...';

            const contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            const result = await contract.methods.contribute().send({
                from: this.userAddress,
                value: amountWei,
                gas: 300000
            });

            alert('Contribution successful! Thank you for participating in the presale.');
            
            // Refresh data
            await this.updateDashboard();
            await this.updateUserStats();
            await this.updateUserBalance();

        } catch (error) {
            console.error('Error contributing:', error);
            if (error.code === 4001) {
                alert('Transaction was rejected by your wallet.');
            } else {
                alert('Contribution failed. Please try again.');
            }
        } finally {
            document.getElementById('contributeBtn').disabled = false;
            document.getElementById('contributeBtn').textContent = 'Contribute to Presale';
        }
    }

    async claimTokens() {
        if (!this.isConnected || !this.userAddress || !this.web3) {
            alert('Please connect your wallet first.');
            return;
        }

        try {
            document.getElementById('claimSection').querySelector('button').disabled = true;
            document.getElementById('claimSection').querySelector('button').textContent = 'Claiming...';

            const contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            const result = await contract.methods.claimTokens().send({
                from: this.userAddress,
                gas: 300000
            });

            alert('Tokens claimed successfully!');
            
            // Refresh data
            await this.updateUserStats();

        } catch (error) {
            console.error('Error claiming tokens:', error);
            if (error.code === 4001) {
                alert('Transaction was rejected by your wallet.');
            } else {
                alert('Token claim failed. Please try again.');
            }
        } finally {
            document.getElementById('claimSection').querySelector('button').disabled = false;
            document.getElementById('claimSection').querySelector('button').textContent = 'Claim Your Tokens';
        }
    }

    openModal() {
        document.getElementById('walletConnectModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('walletConnectModal').style.display = 'none';
    }

    showFallbackData() {
        // Show default data if contract connection fails
        document.getElementById('totalRaisedUSD').textContent = '$0';
        document.getElementById('presaleProgress').textContent = '0%';
        document.getElementById('daysLeft').textContent = '30';
        document.getElementById('totalContributors').textContent = '0';
    }
}

// Global functions for HTML onclick events
function setAmount(amount) {
    document.getElementById('contributionAmount').value = amount;
    dashboardManager.calculateTokens(amount);
}

function contribute() {
    dashboardManager.contribute();
}

function claimTokens() {
    dashboardManager.claimTokens();
}

function connectMetaMask() {
    dashboardManager.connectMetaMask();
}

function connectWalletConnect() {
    dashboardManager.connectWalletConnect();
}

function disconnectWallet() {
    dashboardManager.disconnectWallet();
}

function closeModal() {
    dashboardManager.closeModal();
}

function refreshTransactions() {
    // This would typically fetch transaction history from the blockchain
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = `
        <div class="transaction-item">
            <div class="transaction-icon">
                <i class="fas fa-sync fa-spin"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-amount">Refreshing transactions...</div>
                <div class="transaction-time">Please wait</div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        transactionsList.innerHTML = `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-amount">Transaction history coming soon</div>
                    <div class="transaction-time">Live updates from BSC Testnet</div>
                </div>
            </div>
        `;
    }, 2000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('walletConnectModal');
    if (event.target === modal) {
        dashboardManager.closeModal();
    }
}

// Initialize dashboard when page loads
let dashboardManager;
document.addEventListener('DOMContentLoaded', function() {
    dashboardManager = new DashboardManager();
});