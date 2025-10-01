// scripts/crypto.js - Fixed Web3 Integration for BSC Testnet

class GenetAiCrypto {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.walletConnectProvider = null;
        
        // BSC Testnet Configuration
        this.chainId = 97;
        this.chainName = "Binance Smart Chain Testnet";
        this.rpcUrl = "https://data-seed-prebsc-1-s1.binance.org:8545/";
        this.blockExplorer = "https://testnet.bscscan.com";
        
        // Your BSC Testnet Contract Address
        this.presaleContractAddress = "0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E";
        
        // Contract ABIs
        this.presaleABI = [
            "function totalRaised() view returns (uint256)",
            "function hardCap() view returns (uint256)",
            "function totalContributors() view returns (uint256)",
            "function tokenPrice() view returns (uint256)",
            "function maxContribution() view returns (uint256)",
            "function minContribution() view returns (uint256)",
            "function presaleEndTime() view returns (uint256)",
            "function presaleStartTime() view returns (uint256)",
            "function userContributions(address) view returns (uint256)",
            "function presaleActive() view returns (bool)",
            "function contribute() payable",
            "function claimTokens()"
        ];
        
        this.walletConnectProjectId = "e50f0a4298c581eadf73071430522379";
        this.contracts = {};
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.initializeProviders();
            this.setupEventListeners();
            this.updateConnectionStatus();
            await this.tryReconnect();
            
            this.isInitialized = true;
            console.log('GenetAiCrypto initialized successfully');
        } catch (error) {
            console.error('Failed to initialize GenetAiCrypto:', error);
        }
    }

    async initializeProviders() {
        try {
            this.infuraProvider = new ethers.JsonRpcProvider(this.rpcUrl);
            this.contracts.presale = new ethers.Contract(
                this.presaleContractAddress,
                this.presaleABI,
                this.infuraProvider
            );
            console.log('Providers initialized');
        } catch (error) {
            console.error('Error initializing providers:', error);
        }
    }

    async switchToBSCNetwork() {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x61',
                            chainName: 'Binance Smart Chain Testnet',
                            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                            blockExplorerUrls: ['https://testnet.bscscan.com/'],
                        }],
                    });
                } catch (addError) {
                    console.error('Failed to add BSC Testnet:', addError);
                }
            }
        }
    }

    async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            await this.switchToBSCNetwork();
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.account = accounts[0];
            this.isConnected = true;
            this.connectionType = 'metamask';

            this.contracts.presaleWithSigner = new ethers.Contract(
                this.presaleContractAddress,
                this.presaleABI,
                this.signer
            );

            this.updateConnectionStatus();
            this.showSuccess('Connected to BSC Testnet!');
            this.updateAllPages();
            
            return this.account;
        } catch (error) {
            console.error('Failed to connect MetaMask:', error);
            this.showError('Failed to connect: ' + error.message);
            return null;
        }
    }

    async getPresaleData() {
        try {
            if (!this.contracts.presale) {
                console.log('Contract not initialized yet');
                return this.getDefaultPresaleData();
            }

            const [totalRaised, hardCap, totalContributors, tokenPrice, presaleActive] = await Promise.all([
                this.contracts.presale.totalRaised().catch(() => ethers.parseEther("0")),
                this.contracts.presale.hardCap().catch(() => ethers.parseEther("100")),
                this.contracts.presale.totalContributors().catch(() => 0),
                this.contracts.presale.tokenPrice().catch(() => ethers.parseEther("0.0004")),
                this.contracts.presale.presaleActive().catch(() => true)
            ]);

            const totalRaisedBNB = parseFloat(ethers.formatEther(totalRaised));
            const hardCapBNB = parseFloat(ethers.formatEther(hardCap));
            const progress = hardCapBNB > 0 ? (totalRaisedBNB / hardCapBNB) * 100 : 0;

            return {
                totalRaised: totalRaisedBNB,
                hardCap: hardCapBNB,
                totalContributors: parseInt(totalContributors),
                tokenPrice: parseFloat(ethers.formatEther(tokenPrice)),
                presaleActive: presaleActive,
                progress: progress
            };
        } catch (error) {
            console.error('Error fetching presale data:', error);
            return this.getDefaultPresaleData();
        }
    }

    getDefaultPresaleData() {
        return {
            totalRaised: 0,
            hardCap: 100,
            totalContributors: 0,
            tokenPrice: 0.0004,
            presaleActive: true,
            progress: 0
        };
    }

    async updateAllPages() {
        await this.updateLiveData();
        
        // Update main page stats if we're on the main page
        if (document.getElementById('mainPageStats')) {
            this.updateMainPageStats();
        }
        
        // Update dashboard if we're on the dashboard
        if (document.getElementById('dashboardStats')) {
            this.updateDashboardStats();
        }
    }

    async updateLiveData() {
        try {
            const presaleData = await this.getPresaleData();
            this.updateMainPageStats(presaleData);
            this.updateDashboardStats(presaleData);
        } catch (error) {
            console.error('Error updating live data:', error);
        }
    }

    updateMainPageStats(presaleData) {
        if (!presaleData) return;

        // Update hero section presale stats
        this.updateElementValue('totalRaised', `$${(presaleData.totalRaised * 3000).toLocaleString()}`);
        this.updateElementValue('presaleProgress', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('totalContributors', presaleData.totalContributors.toLocaleString());
        
        // Update token metrics on main page
        this.updateElementValue('tokenPriceDisplay', `${presaleData.tokenPrice.toFixed(6)} BNB`);
        
        // Update progress in hero section
        const progressElements = document.querySelectorAll('.presale-card');
        if (progressElements[2]) { // Progress card
            progressElements[2].querySelector('.presale-value').textContent = `${presaleData.progress.toFixed(1)}%`;
        }
    }

    updateDashboardStats(presaleData) {
        if (!presaleData) return;

        // Update dashboard metrics
        this.updateElementValue('totalRaised', `${presaleData.totalRaised.toFixed(2)} BNB`);
        this.updateElementValue('hardCap', `${presaleData.hardCap.toFixed(2)} BNB`);
        this.updateElementValue('presaleProgress', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('progressPercent', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('totalContributors', presaleData.totalContributors.toLocaleString());
        this.updateElementValue('tokenPriceDisplay', `${presaleData.tokenPrice.toFixed(6)} BNB`);
        this.updateElementValue('liveTokenPrice', `${presaleData.tokenPrice.toFixed(6)} BNB`);
        
        // Update progress bar
        const progressBar = document.getElementById('progressBarFill');
        if (progressBar) {
            progressBar.style.width = `${presaleData.progress}%`;
        }

        // Update BNB amounts
        this.updateElementValue('raisedETH', presaleData.totalRaised.toFixed(2));
        this.updateElementValue('targetETH', presaleData.hardCap.toFixed(2));
        this.updateElementValue('remainingETH', (presaleData.hardCap - presaleData.totalRaised).toFixed(2));

        // Update presale status
        const statusElement = document.getElementById('presaleStatus');
        if (statusElement) {
            statusElement.textContent = presaleData.presaleActive ? 'Active' : 'Ended';
            statusElement.style.color = presaleData.presaleActive ? 'var(--success)' : 'var(--accent)';
        }
    }

    updateElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
        
        // Also try to update elements with similar names on different pages
        const allElements = document.querySelectorAll(`[id*="${elementId}"]`);
        allElements.forEach(el => {
            if (el.id !== elementId) {
                el.textContent = value;
            }
        });
    }

    updateConnectionStatus() {
        const updateUI = (statusElement, connectBtn, accountElement, walletTypeElement) => {
            if (!statusElement || !connectBtn) return;

            if (this.isConnected) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'wallet-status connected';
                connectBtn.textContent = 'Disconnect';
                connectBtn.onclick = () => this.disconnectWallet();
                
                if (accountElement) {
                    const shortAddress = `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
                    accountElement.textContent = shortAddress;
                    accountElement.style.display = 'block';
                }
                if (walletTypeElement) {
                    walletTypeElement.textContent = this.connectionType === 'metamask' ? 'MetaMask' : 'WalletConnect';
                    walletTypeElement.style.display = 'block';
                }
            } else {
                statusElement.textContent = 'Not Connected';
                statusElement.className = 'wallet-status disconnected';
                connectBtn.textContent = 'Connect Wallet';
                connectBtn.onclick = () => this.showWalletModal();
                
                if (accountElement) accountElement.style.display = 'none';
                if (walletTypeElement) walletTypeElement.style.display = 'none';
            }
        };

        // Update header
        updateUI(
            document.getElementById('walletStatus'),
            document.getElementById('connectWallet'),
            document.getElementById('walletAddress'),
            document.getElementById('walletType')
        );

        // Update dashboard
        updateUI(
            document.getElementById('walletStatusDashboard'),
            document.getElementById('connectWalletDashboard'),
            document.getElementById('walletAddressDashboard'),
            document.getElementById('walletTypeDashboard')
        );
    }

    showWalletModal() {
        let modal = document.getElementById('walletModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'walletModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Connect to BSC Testnet</h3>
                        <button class="close-modal">×</button>
                    </div>
                    <div class="wallet-options">
                        <div class="wallet-option" id="metamaskOption">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask">
                            <span>MetaMask</span>
                        </div>
                    </div>
                    <div class="network-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Connecting to BSC Testnet (Chain ID: 97)</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
            modal.querySelector('#metamaskOption').onclick = () => {
                this.connectMetaMask();
                modal.style.display = 'none';
            };
            
            // Close modal when clicking outside
            modal.onclick = (e) => {
                if (e.target === modal) modal.style.display = 'none';
            };
        }
        modal.style.display = 'flex';
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.connectionType = null;
        this.updateConnectionStatus();
        this.showInfo('Wallet disconnected');
    }

    // UI Helpers
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${message}</span><button>×</button>`;
        notification.querySelector('button').onclick = () => notification.remove();

        container.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    async tryReconnect() {
        if (window.ethereum?.selectedAddress) {
            await this.connectMetaMask();
        }
    }

    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) this.disconnectWallet();
                else {
                    this.account = accounts[0];
                    this.updateConnectionStatus();
                }
            });
        }
    }

    // Start live updates
    startLiveUpdates() {
        this.updateLiveData();
        setInterval(() => this.updateLiveData(), 15000);
    }
}

// Safe initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check if ethers is available
    if (typeof ethers === 'undefined') {
        console.error('ethers.js not loaded');
        return;
    }
    
    window.genetaiCrypto = new GenetAiCrypto();
    
    // Initialize after a short delay to ensure DOM is ready
    setTimeout(() => {
        window.genetaiCrypto.init().then(() => {
            window.genetaiCrypto.startLiveUpdates();
        });
    }, 1000);
});