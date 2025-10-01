// Contract configuration
const CONTRACT_ADDRESS = '0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E';
const BSC_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const PRESALE_GOAL = 1000000; // $1,000,000
const TOKEN_PRICE_BNB = 0.15;

// Contract ABI (simplified for presale functions)
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
    }
];

class PresaleStats {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize Web3
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider(BSC_RPC_URL));
            }

            // Initialize contract
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            this.isInitialized = true;
            
            // Load initial data
            await this.updateStats();
            
            // Set up periodic updates
            setInterval(() => this.updateStats(), 10000); // Update every 10 seconds
            
        } catch (error) {
            console.error('Error initializing presale stats:', error);
            this.showFallbackData();
        }
    }

    async updateStats() {
        if (!this.isInitialized) return;

        try {
            const [totalRaised, totalContributors, tokensSold, presaleEndTime] = await Promise.all([
                this.contract.methods.totalRaised().call(),
                this.contract.methods.totalContributors().call(),
                this.contract.methods.tokensSold().call(),
                this.contract.methods.presaleEndTime().call()
            ]);

            this.updateUI(totalRaised, totalContributors, tokensSold, presaleEndTime);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateUI(totalRaised, totalContributors, tokensSold, presaleEndTime) {
        // Convert from wei to BNB
        const raisedBNB = this.web3.utils.fromWei(totalRaised, 'ether');
        
        // Convert BNB to USD (you might want to use an API for live prices)
        const bnbPriceUSD = 300; // Example price, replace with live data
        const raisedUSD = (raisedBNB * bnbPriceUSD).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        const progress = ((raisedBNB * bnbPriceUSD) / PRESALE_GOAL) * 100;
        const daysLeft = this.calculateDaysLeft(presaleEndTime);

        // Update DOM elements
        document.getElementById('totalRaised').textContent = raisedUSD;
        document.getElementById('presaleProgress').textContent = `${progress.toFixed(1)}%`;
        document.getElementById('daysLeft').textContent = daysLeft;
        document.getElementById('contributors').textContent = totalContributors;
        document.getElementById('tokensSold').textContent = parseInt(tokensSold).toLocaleString();
        document.getElementById('currentRaised').textContent = raisedUSD;

        // Update progress bar
        document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;

        // Update progress bar color based on progress
        const progressFill = document.getElementById('progressFill');
        if (progress >= 100) {
            progressFill.style.backgroundColor = '#10b981'; // Green when goal reached
        } else if (progress >= 50) {
            progressFill.style.backgroundColor = '#f59e0b'; // Amber when halfway
        } else {
            progressFill.style.backgroundColor = '#3b82f6'; // Blue default
        }
    }

    calculateDaysLeft(endTime) {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = endTime - now;
        return Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60)));
    }

    showFallbackData() {
        // Show some default data if contract connection fails
        document.getElementById('totalRaised').textContent = '$0';
        document.getElementById('presaleProgress').textContent = '0%';
        document.getElementById('daysLeft').textContent = '30';
        document.getElementById('contributors').textContent = '0';
        document.getElementById('tokensSold').textContent = '0';
        document.getElementById('currentRaised').textContent = '$0';
        document.getElementById('progressFill').style.width = '0%';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    const presaleStats = new PresaleStats();

    // Button event listeners
    document.getElementById('buyTokensBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('getStartedBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('loginBtn').addEventListener('click', function() {
        alert('Login functionality coming soon!');
    });

    document.getElementById('learnMoreBtn').addEventListener('click', function() {
        document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
    });
});

// Plan selection function
function selectPlan(plan) {
    const plans = {
        'basic': 'Basic Plan (0.05 BNB)',
        'pro': 'Pro Plan (0.1 BNB)',
        'enterprise': 'Enterprise Plan (Custom)'
    };
    
    alert(`You selected the ${plans[plan]}. Redirecting to purchase...`);
    window.location.href = 'dashboard.html';
}