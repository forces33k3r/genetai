// Main JavaScript for GenetAi website

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Button event handlers
    document.getElementById('loginBtn').addEventListener('click', function() {
        alert('Login functionality would be implemented here');
    });
    
    document.getElementById('getStartedBtn').addEventListener('click', function() {
        alert('Redirecting to registration...');
    });
    
    document.getElementById('uploadBtn').addEventListener('click', function() {
        alert('DNA upload modal would open here');
    });
    
    document.getElementById('learnMoreBtn').addEventListener('click', function() {
        document.getElementById('how-it-works').scrollIntoView({
            behavior: 'smooth'
        });
    });
    
    // Add scroll effect to header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(13, 17, 23, 0.98)';
        } else {
            header.style.background = 'rgba(13, 17, 23, 0.95)';
        }
    });
    
    // Animate stats when they come into view
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
    
    observer.observe(document.querySelector('.user-stats-section'));
    observer.observe(document.querySelector('.presale-stats-hero'));
    
    // Animation functions
    function animateUserStats() {
        const stats = document.querySelectorAll('.user-stat-value');
        
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
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            if (element === document.querySelectorAll('.user-stat-value')[3]) {
                // For percentage value
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
    
    // Add loading animation
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Set initial body opacity for fade-in effect
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';