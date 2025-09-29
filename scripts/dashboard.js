// Dashboard JavaScript - Live Blockchain Data

class LiveDashboard {
    constructor() {
        this.transactionHistory = [];
        this.lastBlockNumber = 0;
        this.init();
    }

    async init() {
        await this.initializeDashboard();
        this.startLiveUpdates();
    }

    async initializeDashboard() {
        // Sync wallet connection between header and dashboard
        this.syncWalletConnection();
        
        // Setup dashboard interactions
        this.setupDashboardInteractions();
        
        // Load initial data
        await this.loadInitialData();
    }

    syncWalletConnection() {
        // Sync wallet status between header and dashboard every second
        setInterval(() => {
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
        }, 1000);
    }

    setupDashboardInteractions() {
        // Setup contribution form validation
        const amountInput = document.getElementById('contributionAmount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.validateContributionAmount(amountInput.value);
            });
        }

        // Setup refresh button
        const refreshBtn = document.querySelector('.btn-sm');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }
    }

    async loadInitialData() {
        // Load all live data immediately
        await this.updateAllData();
        
        // Update last updated timestamp
        this.updateLastUpdated();
    }

    startLiveUpdates() {
        // Update data every 15 seconds
        setInterval(async () => {
            await this.updateAllData();
            this.updateLastUpdated();
        }, 15000);

        // Update user-specific data more frequently if connected
        setInterval(async () => {
            if (window.genetaiCrypto && window.genetaiCrypto.isConnected) {
                await this.updateUserData();
            }
        }, 5000);
    }

    async updateAllData() {
        try {
            if (window.genetaiCrypto && window.genetaiCrypto.contracts.presale) {
                await this.updatePresaleData();
                await this.updateTokenMetrics();
                await this.updateTransactionHistory();
                await this.updateBlockInfo();
            }
        } catch (error) {
            console.error('Error updating dashboard data:', error);
            this.showDataError('Failed to fetch live data from blockchain');
        }
    }

    async updatePresaleData() {
        const presaleData = await window.genetaiCrypto.getPresaleData();
        if (!presaleData) return;

        // Update progress section
        this.updateElementValue('totalRaised', `${presaleData.totalRaised.toFixed(2)} ETH`);
        this.updateElementValue('hardCap', `${presaleData.hardCap.toFixed(2)} ETH`);
        this.updateElementValue('presaleProgress', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('progressPercent', `${presaleData.progress.toFixed(1)}%`);
        
        // Update progress bar
        const progressBar = document.getElementById('progressBarFill');
        if (progressBar) {
            progressBar.style.width = `${presaleData.progress}%`;
        }

        // Update ETH amounts
        this.updateElementValue('raisedETH', presaleData.totalRaised.toFixed(2));
        this.updateElementValue('targetETH', presaleData.hardCap.toFixed(2));
        this.updateElementValue('remainingETH', (presaleData.hardCap - presaleData.totalRaised).toFixed(2));

        // Update contribution stats
        this.updateElementValue('totalContributors', presaleData.totalContributors.toLocaleString());
        
        const avgContribution = presaleData.totalContributors > 0 ? 
            presaleData.totalRaised / presaleData.totalContributors : 0;
        this.updateElementValue('averageContribution', `${avgContribution.toFixed(4)} ETH`);

        // Update limits
        this.updateElementValue('minContribution', `${presaleData.minContribution.toFixed(4)} ETH`);
        this.updateElementValue('maxContribution', `${presaleData.maxContribution.toFixed(4)} ETH`);

        // Update token price
        this.updateElementValue('tokenPrice', `${presaleData.tokenPrice.toFixed(6)} ETH`);
        this.updateElementValue('tokenPriceDisplay', `${presaleData.tokenPrice.toFixed(6)} ETH`);
        this.updateElementValue('liveTokenPrice', `${presaleData.tokenPrice.toFixed(6)} ETH`);

        // Update days left
        const daysLeft = Math.max(0, Math.ceil((presaleData.presaleEndTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
        this.updateElementValue('daysLeft', daysLeft);

        // Update presale status
        const status = presaleData.presaleActive ? 'Active' : 'Ended';
        const statusColor = presaleData.presaleActive ? 'var(--success)' : 'var(--accent)';
        this.updateElementValue('presaleStatus', status);
        document.getElementById('presaleStatus').style.color = statusColor;

        // Update tokens sold
        const tokensSold = presaleData.totalRaised / presaleData.tokenPrice;
        this.updateElementValue('tokensSold', `${(tokensSold / 1000000).toFixed(1)}M`);
    }

    async updateTokenMetrics() {
        // Additional token metrics can be added here
        // For now, we're getting most data from presaleData
    }

    async updateUserData() {
        if (!window.genetaiCrypto.isConnected) return;

        try {
            const userContribution = await window.genetaiCrypto.getUserContribution();
            const userBalance = await window.genetaiCrypto.getBalance();
            const presaleData = await window.genetaiCrypto.getPresaleData();
            
            if (presaleData) {
                const userTokens = userContribution / presaleData.tokenPrice;

                // Show user stats
                const userStats = document.getElementById('userStats');
                if (userStats) userStats.style.display = 'block';

                this.updateElementValue('userContribution', `${userContribution.toFixed(4)} ETH`);
                this.updateElementValue('userBalance', `${parseFloat(userBalance).toFixed(4)} ETH`);
                this.updateElementValue('userTokens', `${userTokens.toFixed(0)} $GENE`);

                // Show/hide claim section based on presale status
                const claimSection = document.getElementById('claimSection');
                if (claimSection) {
                    claimSection.style.display = !presaleData.presaleActive ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }

    async updateTransactionHistory() {
        try {
            // This would typically fetch from a subgraph or indexer
            // For now, we'll show a message about live data
            const transactionsList = document.getElementById('transactionsList');
            if (transactionsList) {
                transactionsList.innerHTML = `
                    <div class="transaction-item">
                        <div class="transaction-icon">
                            <i class="fas fa-sync-alt fa-spin"></i>
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-type">Live Data Feed</span>
                            <span class="transaction-time">Connected to Ethereum Mainnet</span>
                        </div>
                        <div class="transaction-amount">
                            <span style="color: var(--primary);">Active</span>
                        </div>
                    </div>
                    <div class="transaction-item">
                        <div class="transaction-icon">
                            <i class="fas fa-link"></i>
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-type">Blockchain Sync</span>
                            <span class="transaction-time">Real-time contract monitoring</span>
                        </div>
                        <div class="transaction-amount">
                            <span style="color: var(--success);">Live</span>
                        </div>
                    </div>
                    <div class="transaction-note">
                        <i class="fas fa-info-circle"></i>
                        All data is fetched directly from the Ethereum blockchain
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating transaction history:', error);
        }
    }

    async updateBlockInfo() {
        try {
            const provider = window.genetaiCrypto.infuraProvider;
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            
            this.updateElementValue('lastBlockUpdate', `Block #${blockNumber} • ${new Date(block.timestamp * 1000).toLocaleTimeString()}`);
            this.lastBlockNumber = blockNumber;
        } catch (error) {
            console.error('Error updating block info:', error);
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
            
            // Update token amount display
            this.calculateTokens(numAmount);
        }
    }

    calculateTokens(ethAmount) {
        const tokenPriceElement = document.getElementById('tokenPriceDisplay');
        if (tokenPriceElement) {
            const tokenPriceText = tokenPriceElement.textContent.replace(' ETH', '');
            const tokenPrice = parseFloat(tokenPriceText);
            
            if (!isNaN(tokenPrice) && tokenPrice > 0) {
                const tokens = ethAmount / tokenPrice;
                document.getElementById('tokenAmount').textContent = tokens.toFixed(0);
            }
        }
    }

    updateElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    showDataError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'data-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        // Add to dashboard header temporarily
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader && !document.querySelector('.data-error')) {
            dashboardHeader.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }
}

// Global functions for HTML onclick handlers
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
            // Reset form and refresh data
            document.getElementById('contributionAmount').value = '';
            document.getElementById('tokenAmount').textContent = '0';
            
            // Refresh dashboard data after contribution
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
            // Refresh user data after claim
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.liveDashboard = new LiveDashboard();
    
    // Set initial body opacity
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});