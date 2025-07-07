// 简化版测试 - 确保基本功能正常工作
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // 测试按钮点击
    const startBtn = document.getElementById('startLearningBtn');
    if (startBtn) {
        console.log('Found start button');
        startBtn.addEventListener('click', function() {
            console.log('Start button clicked!');
            alert('开始学习功能正常！');
        });
    } else {
        console.error('Start button not found!');
    }

    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) {
        console.log('Found review button');
        reviewBtn.addEventListener('click', function() {
            console.log('Review button clicked!');
            alert('复习功能正常！');
        });
    } else {
        console.error('Review button not found!');
    }

    // 测试模式切换按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
        console.log('Found nav button:', btn.textContent);
        btn.addEventListener('click', function(e) {
            console.log('Nav button clicked:', e.target.dataset.mode);
            
            // 移除所有active类
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            // 添加active类到当前按钮
            e.target.classList.add('active');
            
            alert(`切换到${e.target.textContent}模式`);
        });
    });
    
    console.log('All event listeners attached');
});

// 测试所有按钮是否可以点击
function testAllButtons() {
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons`);
    
    buttons.forEach((btn, index) => {
        console.log(`Button ${index + 1}:`, btn.id || btn.className, btn.textContent);
        
        // 检查按钮是否有阻止点击的样式
        const styles = window.getComputedStyle(btn);
        console.log(`  - pointer-events: ${styles.pointerEvents}`);
        console.log(`  - display: ${styles.display}`);
        console.log(`  - visibility: ${styles.visibility}`);
    });
}

// 页面加载后测试
window.addEventListener('load', () => {
    console.log('Page fully loaded');
    setTimeout(testAllButtons, 1000);
});