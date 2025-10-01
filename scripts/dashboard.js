// Dashboard Configuration
const CONTRACT_ADDRESS = '0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E';
const BSC_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const PRESALE_GOAL_USD = 1000000; // $1,000,000
const TOKEN_PRICE_BNB = 0.15;
const BNB_PRICE_USD = 300; // Example price, you might want to fetch this from an API

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
        this.updateInterval = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Web3
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                await this.checkConnection();
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider(BSC_RPC_URL));
                this.showMetaMaskAlert();
            }

            // Initialize contract
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.updateDashboard();
            
            // Set up periodic updates
            this.updateInterval = setInterval(() => this.updateDashboard(), 10000);
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showFallbackData();
        }
    }

    async checkConnection() {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.isConnected = true;
                this.updateWalletDisplay();
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    }

    setupEventListeners() {
        // Wallet connection buttons
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('connectWalletBtn').addEventListener('click', () => this.connectWallet());
        
        // Contribution amount input
        document.getElementById('contributionAmount').addEventListener('input', (e) => this.calculateTokens(e.target.value));
        
        // Network changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
        }
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                this.showMetaMaskAlert();
                return;
            }

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAddress = accounts[0];
            this.isConnected = true;
            this.updateWalletDisplay();
            await this.updateUserStats();
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Error connecting wallet. Please make sure MetaMask is installed and try again.');
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // User disconnected wallet
            this.userAddress = null;
            this.isConnected = false;
            this.updateWalletDisplay();
        } else {
            // User switched accounts
            this.userAddress = accounts[0];
            this.updateWalletDisplay();
            this.updateUserStats();
        }
    }

    updateWalletDisplay() {
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const contributeBtn = document.getElementById('contributeBtn');

        if (this.isConnected && this.userAddress) {
            const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            
            walletStatus.textContent = 'Connected';
            walletStatus.className = 'wallet-status connected';
            walletAddress.textContent = shortAddress;
            walletAddress.style.display = 'block';
            
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.disabled = true;
            contributeBtn.disabled = false;
            contributeBtn.textContent = 'Contribute to Presale';
            
            // Update compact wallet info
            document.getElementById('walletInfoCompact').style.display = 'block';
            document.getElementById('walletAddressCompact').textContent = shortAddress;
            
            this.updateUserBalance();
        } else {
            walletStatus.textContent = 'Not Connected';
            walletStatus.className = 'wallet-status disconnected';
            walletAddress.style.display = 'none';
            walletBalance.style.display = 'none';
            
            connectWalletBtn.textContent = 'Connect Wallet';
            connectWalletBtn.disabled = false;
            contributeBtn.disabled = true;
            contributeBtn.textContent = 'Connect Wallet to Contribute';
            
            document.getElementById('walletInfoCompact').style.display = 'none';
            document.getElementById('userStats').style.display = 'none';
        }
    }

    async updateUserBalance() {
        if (!this.isConnected || !this.userAddress) return;

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
            const [totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution] = await Promise.all([
                this.contract.methods.totalRaised().call(),
                this.contract.methods.totalContributors().call(),
                this.contract.methods.tokensSold().call(),
                this.contract.methods.presaleEndTime().call(),
                this.contract.methods.minContribution().call(),
                this.contract.methods.maxContribution().call()
            ]);

            this.updateDashboardUI(totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution);
            this.updateLastUpdated();

        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateDashboardUI(totalRaised, totalContributors, tokensSold, presaleEndTime, minContribution, maxContribution) {
        // Convert from wei to BNB
        const raisedBNB = this.web3.utils.fromWei(totalRaised, 'ether');
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
        document.getElementById('minContribution').textContent = `${this.web3.utils.fromWei(minContribution, 'ether')} BNB`;
        document.getElementById('maxContribution').textContent = `${this.web3.utils.fromWei(maxContribution, 'ether')} BNB`;

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
        if (!this.isConnected || !this.userAddress) {
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

            const result = await this.contract.methods.contribute().send({
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
            alert('Contribution failed. Please try again.');
        } finally {
            document.getElementById('contributeBtn').disabled = false;
            document.getElementById('contributeBtn').textContent = 'Contribute to Presale';
        }
    }

    async claimTokens() {
        if (!this.isConnected || !this.userAddress) {
            alert('Please connect your wallet first.');
            return;
        }

        try {
            document.getElementById('claimSection').querySelector('button').disabled = true;
            document.getElementById('claimSection').querySelector('button').textContent = 'Claiming...';

            const result = await this.contract.methods.claimTokens().send({
                from: this.userAddress,
                gas: 300000
            });

            alert('Tokens claimed successfully!');
            
            // Refresh data
            await this.updateUserStats();

        } catch (error) {
            console.error('Error claiming tokens:', error);
            alert('Token claim failed. Please try again.');
        } finally {
            document.getElementById('claimSection').querySelector('button').disabled = false;
            document.getElementById('claimSection').querySelector('button').textContent = 'Claim Your Tokens';
        }
    }

    showMetaMaskAlert() {
        alert('Please install MetaMask to use all dashboard features and contribute to the presale.');
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

// Initialize dashboard when page loads
let dashboardManager;
document.addEventListener('DOMContentLoaded', function() {
    dashboardManager = new DashboardManager();
});