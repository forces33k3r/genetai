// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    function initializeDashboard() {
        // Animate progress bars on load
        animateProgressBars();
        
        // Start live data updates
        startLiveUpdates();
        
        // Add contribution tracking
        setupContributionTracking();
        
        // Add hover effects
        setupHoverEffects();
    }
    
    function animateProgressBars() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            // Reset width for animation
            progressFill.style.width = '0%';
            setTimeout(() => {
                progressFill.style.width = '24.5%';
            }, 500);
        }
    }
    
    function startLiveUpdates() {
        // Update metrics every 30 seconds
        setInterval(updateLiveMetrics, 30000);
        
        // Simulate new contributions
        setInterval(simulateNewContribution, 45000);
        
        // Initial update
        updateLiveMetrics();
    }
    
    function updateLiveMetrics() {
        // In a real app, this would fetch from your API
        const metrics = document.querySelectorAll('.key-metric .metric-value');
        const contributions = document.querySelector('.contribution-metric .metric-value');
        
        // Simulate small increases
        metrics.forEach(metric => {
            const currentText = metric.textContent;
            if (currentText.includes('$') && !currentText.includes('M')) {
                // Skip the $10M goal
                return;
            }
            
            if (currentText.includes('$') && currentText.includes('M')) {
                const current = parseFloat(currentText.replace('$', '').replace('M', ''));
                const increase = Math.random() * 0.01;
                const newValue = current + increase;
                metric.textContent = `$${newValue.toFixed(2)}M`;
            } else if (currentText.includes('%')) {
                // Small progress increase
                const current = parseFloat(currentText.replace('%', ''));
                const increase = Math.random() * 0.1;
                const newValue = Math.min(100, current + increase);
                metric.textContent = `${newValue.toFixed(1)}%`;
                
                // Update progress bar
                const progressFill = document.querySelector('.progress-fill');
                const progressPercent = document.querySelector('.progress-percent');
                if (progressFill && progressPercent) {
                    progressFill.style.width = `${newValue}%`;
                    progressPercent.textContent = `${newValue.toFixed(1)}%`;
                }
            } else if (!isNaN(parseInt(currentText))) {
                // Days left - decrease by 1 occasionally
                if (Math.random() > 0.8) {
                    const current = parseInt(currentText);
                    if (current > 0) {
                        metric.textContent = (current - 1).toString();
                    }
                }
            }
        });
        
        // Update contributor count
        if (contributions) {
            const current = parseInt(contributions.textContent.replace(/,/g, ''));
            contributions.textContent = (current + Math.floor(Math.random() * 3)).toLocaleString();
        }
    }
    
    function simulateNewContribution() {
        const contributionsList = document.querySelector('.contributions-list');
        if (!contributionsList) return;
        
        const contributions = [
            { amount: 12500, address: '0x8f7d...4c2a' },
            { amount: 5200, address: '0x3b2a...9e1f' },
            { amount: 23100, address: '0x6d91...7b34' },
            { amount: 8700, address: '0x2a4b...8d91' },
            { amount: 15600, address: '0x9c3e...2a7f' },
            { amount: 3200, address: '0x1b5c...9e3d' },
            { amount: 18900, address: '0x7a2d...4f1a' }
        ];
        
        const randomContribution = contributions[Math.floor(Math.random() * contributions.length)];
        const newContribution = createContributionElement(randomContribution);
        
        // Add to top of list with animation
        newContribution.style.opacity = '0';
        newContribution.style.transform = 'translateY(-20px)';
        contributionsList.insertBefore(newContribution, contributionsList.firstChild);
        
        // Animate in
        setTimeout(() => {
            newContribution.style.opacity = '1';
            newContribution.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove oldest if more than 5 items
        if (contributionsList.children.length > 5) {
            const lastChild = contributionsList.lastChild;
            lastChild.style.opacity = '0';
            lastChild.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (contributionsList.contains(lastChild)) {
                    contributionsList.removeChild(lastChild);
                }
            }, 300);
        }
        
        // Update total raised
        updateTotalRaised(randomContribution.amount);
    }
    
    function createContributionElement(contribution) {
        const div = document.createElement('div');
        div.className = 'contribution-item';
        
        const shortAddress = contribution.address;
        const randomHex = Math.random().toString(16).substr(2, 4);
        
        div.innerHTML = `
            <div class="contributor-info">
                <div class="contributor-avatar">0x${randomHex}</div>
                <div class="contribution-details">
                    <span class="contributor-address">${shortAddress}</span>
                    <span class="contribution-time">Just now</span>
                </div>
            </div>
            <div class="contribution-amount">+$${contribution.amount.toLocaleString()}</div>
        `;
        
        return div;
    }
    
    function updateTotalRaised(amount) {
        const totalRaised = document.querySelector('.key-metric .metric-value');
        if (totalRaised && totalRaised.textContent.includes('$')) {
            const current = parseFloat(totalRaised.textContent.replace('$', '').replace('M', ''));
            const additional = amount / 1000000; // Convert to millions
            const newAmount = current + additional;
            totalRaised.textContent = `$${newAmount.toFixed(2)}M`;
        }
    }
    
    function setupContributionTracking() {
        // This would connect to your blockchain listener
        console.log('Setting up contribution tracking...');
    }
    
    function setupHoverEffects() {
        // Add click handler for view all button
        const viewAllBtn = document.querySelector('.btn-sm');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', function() {
                alert('This would show all contributions in a separate view or modal.');
            });
        }
        
        // Add user menu interaction
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', function() {
                alert('User menu would open with profile options, logout, etc.');
            });
        }
    }
    
    // Add loading animation
    setTimeout(() => {
        document.querySelector('.dashboard-container').style.opacity = '1';
    }, 100);
});

// Set initial opacity for fade-in effect
document.querySelector('.dashboard-container').style.opacity = '0';
document.querySelector('.dashboard-container').style.transition = 'opacity 0.5s ease';