// Dashboard JavaScript - Live Blockchain Data for BSC Testnet

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
            this.showDataError('Failed to fetch)