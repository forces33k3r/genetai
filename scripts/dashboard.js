// scripts/dashboard.js - Fixed Dashboard JavaScript

class LiveDashboard {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.initializeDashboard();
            this.startLiveUpdates();
            this.isInitialized = true;
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    async initializeDashboard() {
        this.syncWalletConnection();
        this.setupDashboardInteractions();
        await this.loadInitialData();
    }

    syncWalletConnection() {
        setInterval(() => {
            this.updateWalletSync();
        }, 1000);
    }

    updateWalletSync() {
        const headerStatus = document.getElementById('walletStatus');
        const dashboardStatus = document.getElementById('walletStatusDashboard');
        const headerAddress = document.getElementById('walletAddress');
        const dashboardAddress = document.getElementById('walletAddressDashboard');
        const headerType = document.getElementById('walletType');
        const dashboardType = document.getElementById('walletTypeDashboard');
        const headerConnect = document.getElementById('connectWallet');
        const dashboardConnect = document.getElementById('connectWalletDashboard');

        if (headerStatus && dashboardStatus) {
            dashboardStatus.textContent = headerStatus.textContent;
            dashboardStatus.className = headerStatus.className;
        }
        
        if (headerAddress && dashboardAddress) {
            dashboardAddress.textContent = headerAddress.textContent;
            dashboardAddress.style.display = headerAddress.style.display;
        }
        
        if (headerType && dashboardType) {
            dashboardType.textContent = headerType.textContent;
            dashboardType.style.display = headerType.style.display;
        }
        
        if (headerConnect && dashboardConnect) {
            dashboardConnect.textContent = headerConnect.textContent;
            dashboardConnect.onclick = headerConnect.onclick;
        }
    }

    setupDashboardInteractions() {
        const amountInput = document.getElementById('contributionAmount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.validateContributionAmount(amountInput.value);
            });
        }

        const refreshBtn = document.querySelector('.btn-sm');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }
    }

    async loadInitialData() {
        await this.updateAllData();
        this.updateLastUpdated();
    }

    startLiveUpdates() {
        setInterval(async () => {
            await this.updateAllData();
            this.updateLastUpdated();
        }, 15000);

        setInterval(async () => {
            if (window.genetaiCrypto && window.genetaiCrypto.isConnected) {
                await this.updateUserData();
            }
        }, 5000);
    }

    async updateAllData() {
        try {
            if (window.genetaiCrypto) {
                await window.genetaiCrypto.updateLiveData();
            }
        } catch (error) {
            console.error('Error updating dashboard data:', error);
        }
    }

    async updateUserData() {
        if (!window.genetaiCrypto.isConnected) return;

        try {
            const userContribution = await window.genetaiCrypto.getUserContribution();
            const userBalance = await window.genetaiCrypto.getBalance();
            
            const userStats = document.getElementById('userStats');
            if (userStats) userStats.style.display = 'block';

            this.updateElementValue('userContribution', `${userContribution.toFixed(4)} BNB`);
            this.updateElementValue('userBalance', `${parseFloat(userBalance).toFixed(4)} BNB`);
            
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }

    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    async refreshAllData() {
        const refreshBtn = document.querySelector('.btn-sm');
        if (refreshBtn) {
            const originalText = refreshBtn.textContent;
            refreshBtn.textContent = 'Refreshing...';
            refreshBtn.disabled = true;

            await this.updateAllData();
            this.updateLastUpdated();

            setTimeout(() => {
                refreshBtn.textContent = originalText;
                refreshBtn.disabled = false;
            }, 2000);
        }
    }

    validateContributionAmount(amount) {
        const contributeBtn = document.getElementById('contributeBtn');
        if (!contributeBtn) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            contributeBtn.disabled = true;
            contributeBtn.style.opacity = '0.6';
            contributeBtn.textContent = 'Enter Amount';
        } else {
            contributeBtn.disabled = false;
            contributeBtn.style.opacity = '1';
            contributeBtn.textContent = 'Contribute to Presale';
            
            this.calculateTokens(numAmount);
        }
    }

    calculateTokens(ethAmount) {
        const tokenPriceElement = document.getElementById('tokenPriceDisplay');
        const tokenAmountElement = document.getElementById('tokenAmount');
        
        if (!tokenPriceElement || !tokenAmountElement) return;

        const tokenPriceText = tokenPriceElement.textContent.replace(' BNB', '');
        const tokenPrice = parseFloat(tokenPriceText);
        
        if (!isNaN(tokenPrice) && tokenPrice > 0) {
            const tokens = ethAmount / tokenPrice;
            tokenAmountElement.textContent = tokens.toFixed(0);
        }
    }

    updateElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}

// Global functions
function selectPayment(method) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function setAmount(amount) {
    document.getElementById('contributionAmount').value = amount;
    if (window.liveDashboard) {
        window.liveDashboard.calculateTokens(amount);
        window.liveDashboard.validateContributionAmount(amount);
    }
}

async function contribute() {
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (window.genetaiCrypto && window.genetaiCrypto.isConnected) {
        const success = await window.genetaiCrypto.contributeETH(amount);
        if (success) {
            document.getElementById('contributionAmount').value = '';
            document.getElementById('tokenAmount').textContent = '0';
            
            setTimeout(() => {
                if (window.liveDashboard) {
                    window.liveDashboard.refreshAllData();
                }
            }, 3000);
        }
    } else {
        alert('Please connect your wallet first');
    }
}

async function claimTokens() {
    if (window.genetaiCrypto && window.genetaiCrypto.isConnected) {
        const success = await window.genetaiCrypto.claimTokens();
        if (success) {
            setTimeout(() => {
                if (window.liveDashboard) {
                    window.liveDashboard.updateUserData();
                }
            }, 3000);
        }
    } else {
        alert('Please connect your wallet first');
    }
}

function refreshTransactions() {
    if (window.liveDashboard) {
        window.liveDashboard.refreshAllData();
    }
}

// Safe initialization
document.addEventListener('DOMContentLoaded', function() {
    window.liveDashboard = new LiveDashboard();
    
    setTimeout(() => {
        window.liveDashboard.init();
    }, 1000);
    
    // Set initial body opacity
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});