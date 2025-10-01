// scripts/main.js - Fixed Main Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMainPage();
});

function initializeMainPage() {
    // Safe initialization with error handling
    try {
        setupEventListeners();
        setupSmoothScrolling();
        initializeAnimations();
        
        // Check if crypto is initialized and update stats
        setTimeout(() => {
            if (window.genetaiCrypto && typeof window.genetaiCrypto.updateLiveData === 'function') {
                window.genetaiCrypto.updateLiveData();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error initializing main page:', error);
    }
}

function setupEventListeners() {
    // Safe button event handlers
    const loginBtn = document.getElementById('loginBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const learnMoreBtn = document.getElementById('learnMoreBtn');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (getStartedBtn) getStartedBtn.addEventListener('click', handleGetStarted);
    if (uploadBtn) uploadBtn.addEventListener('click', handleUpload);
    if (learnMoreBtn) learnMoreBtn.addEventListener('click', handleLearnMore);
}

function setupSmoothScrolling() {
    // Safe smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initializeAnimations() {
    // Safe animation initialization
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('user-stats-section')) {
                    animateUserStats();
                }
                if (entry.target.classList.contains('presale-stats-hero')) {
                    animatePresaleStats();
                }
            }
        });
    }, { threshold: 0.3 });

    const userStatsSection = document.querySelector('.user-stats-section');
    const presaleStats = document.querySelector('.presale-stats-hero');
    
    if (userStatsSection) observer.observe(userStatsSection);
    if (presaleStats) observer.observe(presaleStats);
}

// Animation functions
function animateUserStats() {
    const stats = document.querySelectorAll('.user-stat-value');
    if (stats.length === 0) return;

    animateValue(stats[0], 0, 15842, 2000);
    animateValue(stats[1], 0, 8927, 2000);
    animateValue(stats[2], 0, 127, 2000);
    animateValue(stats[3], 0, 96.4, 2000);
}

function animatePresaleStats() {
    const presaleCards = document.querySelectorAll('.presale-card');
    presaleCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function animateValue(element, start, end, duration) {
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        if (element === document.querySelectorAll('.user-stat-value')[3]) {
            element.textContent = (progress * (end - start) + start).toFixed(1) + '%';
        } else {
            element.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Button handlers
function handleLogin() {
    alert('Login functionality would be implemented here');
}

function handleGetStarted() {
    alert('Redirecting to registration...');
}

function handleUpload() {
    alert('DNA upload modal would open here');
}

function handleLearnMore() {
    const howItWorks = document.getElementById('how-it-works');
    if (howItWorks) {
        howItWorks.scrollIntoView({ behavior: 'smooth' });
    }
}

function selectPlan(plan) {
    alert(`Selected ${plan} plan. This would redirect to payment.`);
}

// Global functions for crypto interactions
function selectPayment(method) {
    const options = document.querySelectorAll('.payment-option');
    options.forEach(opt => opt.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function setAmount(amount) {
    const amountInput = document.getElementById('contributionAmount');
    if (amountInput) {
        amountInput.value = amount;
        calculateTokens(amount);
    }
}

function calculateTokens(ethAmount) {
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

async function contribute() {
    const amountInput = document.getElementById('contributionAmount');
    if (!amountInput) return;

    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (window.genetaiCrypto && window.genetaiCrypto.isConnected) {
        const success = await window.genetaiCrypto.contributeETH(amount);
        if (success) {
            amountInput.value = '';
            document.getElementById('tokenAmount').textContent = '0';
        }
    } else {
        alert('Please connect your wallet first');
    }
}

// Initialize page with fade-in effect
setTimeout(() => {
    document.body.style.opacity = '1';
}, 100);

document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';