/**
 * DanizTori Bio Link - Interactive Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');
    const shareProfileBtn = document.getElementById('shareProfileBtn');
    const qrCodeBtn = document.getElementById('qrCodeBtn');
    const qrModal = document.getElementById('qrModal');
    const closeQrModal = document.getElementById('closeQrModal');
    const copyModalLinkBtn = document.getElementById('copyModalLinkBtn');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const clicksCounter = document.getElementById('clicksCounter');
    const viewsCounter = document.getElementById('viewsCounter');
    const shopLink = document.getElementById('shopLink');

    // 1. Theme Switcher Logic
    const savedTheme = localStorage.getItem('daniztori-theme') || 'dark';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('daniztori-theme', theme);
        
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-moon';
            themeLabel.textContent = 'تم تاریک';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
            themeLabel.textContent = 'تم روشن';
        }
    }

    // 2. Toast Notification Function
    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 3. Share / Copy Link Logic
    const pageUrl = window.location.href;

    shareProfileBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'DanizTori | لینک‌های رسمی',
                text: 'مشاهده صفحه رسمی لینک‌های بیو اینستاگرام DanizTori',
                url: pageUrl
            }).catch(() => {
                copyUrlToClipboard();
            });
        } else {
            copyUrlToClipboard();
        }
    });

    copyModalLinkBtn.addEventListener('click', () => {
        copyUrlToClipboard();
        qrModal.classList.remove('active');
    });

    function copyUrlToClipboard() {
        navigator.clipboard.writeText(pageUrl).then(() => {
            showToast('لینک صفحه با موفقیت کپی شد! 📋');
        }).catch(() => {
            showToast('لینک: ' + pageUrl);
        });
    }

    // 4. QR Code Modal Logic
    qrCodeBtn.addEventListener('click', () => {
        qrModal.classList.add('active');
    });

    closeQrModal.addEventListener('click', () => {
        qrModal.classList.remove('active');
    });

    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.classList.remove('active');
        }
    });

    // 5. Interactive Click Counter Simulation
    let totalClicks = 9410;
    let totalViews = 14280;

    // Increment view counter slightly on load
    totalViews += Math.floor(Math.random() * 5) + 1;
    viewsCounter.textContent = totalViews.toLocaleString('fa-IR');

    const linkCards = document.querySelectorAll('.link-card');
    linkCards.forEach(card => {
        card.addEventListener('click', (e) => {
            totalClicks++;
            clicksCounter.textContent = totalClicks.toLocaleString('fa-IR');
        });
    });

    // Custom Shop Link Alert
    if (shopLink) {
        shopLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('فروشگاه اختصاصی به‌زودی فعال می‌شود! 🛍️');
        });
    }
});
