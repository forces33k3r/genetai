// scripts/crypto.js - Complete Web3 Integration for GenetAi

class GenetAiCrypto {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.walletConnectProvider = null;
        
        // Contract addresses
        this.presaleContractAddress = "0x26BdEe9E66575319D5599569dFB39f543cFA8721";
        
        // Contract ABIs (simplified for presale functionality)
        this.presaleABI = [
            "function totalRaised() view returns (uint256)",
            "function hardCap() view returns (uint256)",
            "function totalContributors() view returns (uint256)",
            "function tokenPrice() view returns (uint256)",
            "function maxContribution() view returns (uint256)",
            "function minContribution() view returns (uint256)",
            "function presaleEndTime() view returns (uint256)",
            "function userContributions(address) view returns (uint256)",
            "function contribute() payable",
            "function claimTokens()",
            "function presaleActive() view returns (bool)"
        ];
        
        // Configuration
        this.infuraKey = "52a3c204a2b046a192310066efa00c4f";
        this.walletConnectProjectId = "e50f0a4298c581eadf73071430522379";
        
        this.contracts = {};
        this.init();
    }

    async init() {
        // Initialize providers
        await this.initializeProviders();
        this.setupEventListeners();
        this.updateConnectionStatus();
        
        // Try to reconnect if previously connected
        await this.tryReconnect();
    }

    async initializeProviders() {
        // Initialize Infura provider for read operations
        this.infuraProvider = new ethers.JsonRpcProvider(
            `https://mainnet.infura.io/v3/${this.infuraKey}`
        );
        
        // Initialize contracts for read operations
        this.contracts.presale = new ethers.Contract(
            this.presaleContractAddress,
            this.presaleABI,
            this.infuraProvider
        );
    }

    async initializeWalletConnect() {
        try {
            const { EthereumProvider } = await import('https://unpkg.com/@walletconnect/ethereum-provider@2.9.1/dist/umd/index.min.js');
            
            this.walletConnectProvider = await EthereumProvider.init({
                projectId: this.walletConnectProjectId,
                chains: [1], // Ethereum Mainnet
                showQrModal: true,
                methods: ["eth_sendTransaction", "personal_sign"],
                events: ["chainChanged", "accountsChanged"]
            });

            this.walletConnectProvider.on("accountsChanged", (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            this.walletConnectProvider.on("chainChanged", (chainId) => {
                window.location.reload();
            });

            this.walletConnectProvider.on("disconnect", () => {
                this.disconnectWallet();
            });

        } catch (error) {
            console.error('Failed to initialize WalletConnect:', error);
        }
    }

    setupEventListeners() {
        // Listen for MetaMask account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
        }
    }

    async tryReconnect() {
        // Check MetaMask connection
        if (window.ethereum && window.ethereum.selectedAddress) {
            await this.connectMetaMask();
        }
        
        // Check WalletConnect connection
        const walletConnectSession = localStorage.getItem('walletconnect');
        if (walletConnectSession) {
            await this.connectWalletConnect(true);
        }
    }

    async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.account = accounts[0];
            this.isConnected = true;
            this.connectionType = 'metamask';

            await this.initializeWriteContracts();
            this.updateConnectionStatus();
            this.showSuccess('MetaMask connected successfully!');
            
            return this.account;
        } catch (error) {
            console.error('Failed to connect MetaMask:', error);
            this.showError('Failed to connect MetaMask: ' + error.message);
            return null;
        }
    }

    async connectWalletConnect(isReconnect = false) {
        try {
            if (!this.walletConnectProvider) {
                await this.initializeWalletConnect();
            }

            if (!isReconnect) {
                await this.walletConnectProvider.connect();
            }

            const accounts = this.walletConnectProvider.accounts;
            if (accounts && accounts.length > 0) {
                this.provider = new ethers.BrowserProvider(this.walletConnectProvider);
                this.signer = await this.provider.getSigner();
                this.account = accounts[0];
                this.isConnected = true;
                this.connectionType = 'walletconnect';

                await this.initializeWriteContracts();
                this.updateConnectionStatus();
                
                if (!isReconnect) {
                    this.showSuccess('WalletConnect connected successfully!');
                }
                
                return this.account;
            }
        } catch (error) {
            console.error('Failed to connect WalletConnect:', error);
            if (!isReconnect) {
                this.showError('Failed to connect WalletConnect: ' + error.message);
            }
            return null;
        }
    }

    async initializeWriteContracts() {
        if (this.signer) {
            this.contracts.presaleWithSigner = new ethers.Contract(
                this.presaleContractAddress,
                this.presaleABI,
                this.signer
            );
        }
    }

    async disconnectWallet() {
        if (this.connectionType === 'walletconnect' && this.walletConnectProvider) {
            await this.walletConnectProvider.disconnect();
        }
        
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.connectionType = null;
        
        localStorage.removeItem('walletconnect');
        
        this.updateConnectionStatus();
        this.showInfo('Wallet disconnected');
    }

    async getPresaleData() {
        try {
            const [
                totalRaised,
                hardCap,
                totalContributors,
                tokenPrice,
                maxContribution,
                minContribution,
                presaleEndTime,
                presaleActive
            ] = await Promise.all([
                this.contracts.presale.totalRaised(),
                this.contracts.presale.hardCap(),
                this.contracts.presale.totalContributors(),
                this.contracts.presale.tokenPrice(),
                this.contracts.presale.maxContribution(),
                this.contracts.presale.minContribution(),
                this.contracts.presale.presaleEndTime(),
                this.contracts.presale.presaleActive()
            ]);

            return {
                totalRaised: parseFloat(ethers.formatEther(totalRaised)),
                hardCap: parseFloat(ethers.formatEther(hardCap)),
                totalContributors: parseInt(totalContributors),
                tokenPrice: parseFloat(ethers.formatEther(tokenPrice)),
                maxContribution: parseFloat(ethers.formatEther(maxContribution)),
                minContribution: parseFloat(ethers.formatEther(minContribution)),
                presaleEndTime: parseInt(presaleEndTime),
                presaleActive: presaleActive,
                progress: (parseFloat(ethers.formatEther(totalRaised)) / parseFloat(ethers.formatEther(hardCap))) * 100
            };
        } catch (error) {
            console.error('Error fetching presale data:', error);
            return null;
        }
    }

    async getUserContribution() {
        if (!this.isConnected || !this.account) return 0;

        try {
            const contribution = await this.contracts.presale.userContributions(this.account);
            return parseFloat(ethers.formatEther(contribution));
        } catch (error) {
            console.error('Error fetching user contribution:', error);
            return 0;
        }
    }

    async contributeETH(amount) {
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return false;
        }

        try {
            const tx = await this.contracts.presaleWithSigner.contribute({
                value: ethers.parseEther(amount.toString())
            });

            this.showSuccess(`Contribution sent! TX: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                this.showSuccess('Contribution confirmed!');
                this.updateDashboardStats();
                return true;
            } else {
                this.showError('Transaction failed');
                return false;
            }
        } catch (error) {
            console.error('Contribution failed:', error);
            this.showError('Contribution failed: ' + (error.reason || error.message));
            return false;
        }
    }

    async claimTokens() {
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return false;
        }

        try {
            const tx = await this.contracts.presaleWithSigner.claimTokens();
            this.showSuccess(`Claim sent! TX: ${tx.hash}`);
            
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                this.showSuccess('Tokens claimed successfully!');
                return true;
            } else {
                this.showError('Claim failed');
                return false;
            }
        } catch (error) {
            console.error('Claim failed:', error);
            this.showError('Claim failed: ' + error.message);
            return false;
        }
    }

    async getBalance() {
        if (!this.isConnected) return '0';

        try {
            const balance = await this.provider.getBalance(this.account);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    async updateLiveData() {
        const presaleData = await this.getPresaleData();
        if (!presaleData) return;

        // Update presale stats
        this.updateElementValue('totalRaised', `$${(presaleData.totalRaised * 3000).toLocaleString()}`);
        this.updateElementValue('presaleProgress', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('totalContributors', presaleData.totalContributors.toLocaleString());
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${presaleData.progress}%`;
        }

        // Update token metrics
        this.updateElementValue('tokenPriceDisplay', `${presaleData.tokenPrice.toFixed(4)} ETH`);
        this.updateElementValue('tokensSold', `${(presaleData.totalRaised / presaleData.tokenPrice).toLocaleString()}`);
        
        // Update user contribution if connected
        if (this.isConnected) {
            const userContribution = await this.getUserContribution();
            this.updateElementValue('userContribution', `${userContribution.toFixed(4)} ETH`);
        }

        // Update days left
        const daysLeft = Math.max(0, Math.ceil((presaleData.presaleEndTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
        this.updateElementValue('daysLeft', daysLeft);
    }

    updateElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnectWallet();
        } else {
            this.account = accounts[0];
            this.updateConnectionStatus();
            this.showInfo('Account changed');
        }
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('walletStatus');
        const connectBtn = document.getElementById('connectWallet');
        const accountElement = document.getElementById('walletAddress');
        const walletTypeElement = document.getElementById('walletType');

        if (this.isConnected && statusElement && connectBtn && accountElement) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'wallet-status connected';
            connectBtn.textContent = 'Disconnect';
            connectBtn.onclick = () => this.disconnectWallet();
            
            // Shorten address for display
            const shortAddress = `${this.account.substring(0, 6)}...${this.account.substring(38)}`;
            accountElement.textContent = shortAddress;
            accountElement.style.display = 'block';

            // Show wallet type
            if (walletTypeElement) {
                walletTypeElement.textContent = this.connectionType === 'metamask' ? 'MetaMask' : 'WalletConnect';
                walletTypeElement.style.display = 'block';
            }
        } else if (statusElement && connectBtn) {
            statusElement.textContent = 'Not Connected';
            statusElement.className = 'wallet-status disconnected';
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.onclick = () => this.showWalletModal();
            
            if (accountElement) {
                accountElement.style.display = 'none';
            }
            if (walletTypeElement) {
                walletTypeElement.style.display = 'none';
            }
        }
    }

    showWalletModal() {
        const modal = document.getElementById('walletModal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            this.createWalletModal();
        }
    }

    createWalletModal() {
        const modal = document.createElement('div');
        modal.id = 'walletModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Connect Wallet</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.style.display='none'">×</button>
                </div>
                <div class="wallet-options">
                    <div class="wallet-option" onclick="window.genetaiCrypto.connectMetaMask()">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask">
                        <span>MetaMask</span>
                    </div>
                    <div class="wallet-option" onclick="window.genetaiCrypto.connectWalletConnect()">
                        <img src="https://avatars.githubusercontent.com/u/37784886" alt="WalletConnect">
                        <span>WalletConnect</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    updateDashboardStats() {
        // Refresh all data after transactions
        setTimeout(() => {
            this.updateLiveData();
        }, 3000);
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
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Start live data updates
    startLiveUpdates() {
        this.updateLiveData();
        setInterval(() => this.updateLiveData(), 30000); // Update every 30 seconds
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.genetaiCrypto = new GenetAiCrypto();
    setTimeout(() => window.genetaiCrypto.startLiveUpdates(), 2000);
});