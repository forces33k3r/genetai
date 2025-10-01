// scripts/crypto.js - Complete Web3 Integration for BSC Testnet

class GenetAiCrypto {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.walletConnectProvider = null;
        
        // BSC Testnet Configuration
        this.chainId = 97; // BSC Testnet chain ID
        this.chainName = "Binance Smart Chain Testnet";
        this.rpcUrl = "https://data-seed-prebsc-1-s1.binance.org:8545/";
        this.blockExplorer = "https://testnet.bscscan.com";
        
        // Your BSC Testnet Contract Address
        this.presaleContractAddress = "0x783Ab31e81A0FA50F3D6a85bF9F2A7f8DDDdC75E";
        
        // Contract ABIs for your specific contract
        this.presaleABI = [
            // Presale Information Getters
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
            "function whitelistEnabled() view returns (bool)",
            
            // Presale Actions
            "function contribute() payable",
            "function claimTokens()",
            "function withdrawFunds()",
            
            // Admin Functions
            "function setTokenPrice(uint256) external",
            "function setHardCap(uint256) external",
            "function setPresaleTimes(uint256, uint256) external",
            
            // Events
            "event Contribution(address indexed user, uint256 amount)",
            "event TokensClaimed(address indexed user, uint256 amount)"
        ];
        
        // Configuration
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
        // Use BSC Testnet RPC directly
        this.infuraProvider = new ethers.JsonRpcProvider(this.rpcUrl);
        
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
                chains: [97], // BSC Testnet chain ID
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

    async switchToBSCNetwork() {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }], // 97 in hex
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x61',
                                chainName: 'Binance Smart Chain Testnet',
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                                blockExplorerUrls: ['https://testnet.bscscan.com/'],
                            }],
                        });
                    } catch (addError) {
                        console.error('Failed to add BSC Testnet to MetaMask:', addError);
                        this.showError('Please add BSC Testnet to MetaMask manually');
                    }
                }
                console.error('Failed to switch to BSC Testnet:', switchError);
            }
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

            // Switch to BSC Testnet first
            await this.switchToBSCNetwork();

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
            this.showSuccess('Connected to BSC Testnet!');
            
            return this.account;
        } catch (error) {
            console.error('Failed to connect MetaMask:', error);
            this.showError('Failed to connect: ' + error.message);
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
                    this.showSuccess('WalletConnect connected to BSC Testnet!');
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
                presaleStartTime,
                presaleActive,
                whitelistEnabled
            ] = await Promise.all([
                this.contracts.presale.totalRaised(),
                this.contracts.presale.hardCap(),
                this.contracts.presale.totalContributors(),
                this.contracts.presale.tokenPrice(),
                this.contracts.presale.maxContribution(),
                this.contracts.presale.minContribution(),
                this.contracts.presale.presaleEndTime(),
                this.contracts.presale.presaleStartTime(),
                this.contracts.presale.presaleActive(),
                this.contracts.presale.whitelistEnabled ? this.contracts.presale.whitelistEnabled() : Promise.resolve(false)
            ]);

            const totalRaisedBNB = parseFloat(ethers.formatEther(totalRaised));
            const hardCapBNB = parseFloat(ethers.formatEther(hardCap));
            const progress = hardCapBNB > 0 ? (totalRaisedBNB / hardCapBNB) * 100 : 0;

            return {
                totalRaised: totalRaisedBNB,
                hardCap: hardCapBNB,
                totalContributors: parseInt(totalContributors),
                tokenPrice: parseFloat(ethers.formatEther(tokenPrice)),
                maxContribution: parseFloat(ethers.formatEther(maxContribution)),
                minContribution: parseFloat(ethers.formatEther(minContribution)),
                presaleEndTime: parseInt(presaleEndTime),
                presaleStartTime: parseInt(presaleStartTime),
                presaleActive: presaleActive,
                whitelistEnabled: whitelistEnabled,
                progress: progress
            };
        } catch (error) {
            console.error('Error fetching presale data:', error);
            // Return default values if contract call fails
            return {
                totalRaised: 0,
                hardCap: 100, // 100 BNB hard cap
                totalContributors: 0,
                tokenPrice: 0.0004, // 0.0004 BNB per token
                maxContribution: 10, // 10 BNB max
                minContribution: 0.01, // 0.01 BNB min
                presaleEndTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
                presaleStartTime: Math.floor(Date.now() / 1000),
                presaleActive: true,
                whitelistEnabled: false,
                progress: 0
            };
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
            // Check if presale is active
            const presaleData = await this.getPresaleData();
            if (!presaleData.presaleActive) {
                this.showError('Presale is not active');
                return false;
            }

            // Check contribution limits
            if (amount < presaleData.minContribution) {
                this.showError(`Minimum contribution is ${presaleData.minContribution} BNB`);
                return false;
            }

            if (amount > presaleData.maxContribution) {
                this.showError(`Maximum contribution is ${presaleData.maxContribution} BNB`);
                return false;
            }

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
        this.updateElementValue('totalRaised', `${presaleData.totalRaised.toFixed(2)} BNB`);
        this.updateElementValue('hardCap', `${presaleData.hardCap.toFixed(2)} BNB`);
        this.updateElementValue('presaleProgress', `${presaleData.progress.toFixed(1)}%`);
        this.updateElementValue('totalContributors', presaleData.totalContributors.toLocaleString());
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${presaleData.progress}%`;
        }

        // Update token metrics
        this.updateElementValue('tokenPriceDisplay', `${presaleData.tokenPrice.toFixed(6)} BNB`);
        this.updateElementValue('tokensSold', `${(presaleData.totalRaised / presaleData.tokenPrice).toLocaleString()}`);
        
        // Update user contribution if connected
        if (this.isConnected) {
            const userContribution = await this.getUserContribution();
            this.updateElementValue('userContribution', `${userContribution.toFixed(4)} BNB`);
        }

        // Update days left
        const daysLeft = Math.max(0, Math.ceil((presaleData.presaleEndTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
        this.updateElementValue('daysLeft', daysLeft);

        // Update presale status
        const statusElement = document.getElementById('presaleStatus');
        if (statusElement) {
            const status = presaleData.presaleActive ? 'Active' : 'Ended';
            const statusColor = presaleData.presaleActive ? 'var(--success)' : 'var(--accent)';
            statusElement.textContent = status;
            statusElement.style.color = statusColor;
        }
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
                    <h3>Connect to BSC Testnet</h3>
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
                <div class="network-info">
                    <i class="fas fa-info-circle"></i>
                    <span>Connecting to BSC Testnet (Chain ID: 97)</span>
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