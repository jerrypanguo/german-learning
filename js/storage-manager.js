// 德语背单词 - 数据存储管理系统
class StorageManager {
    constructor() {
        this.storagePrefix = 'germanVocab_';
        this.dataVersion = '1.0';
        this.maxCacheAge = 10 * 24 * 60 * 60 * 1000; // 10天
        
        this.initializeStorage();
    }

    // 初始化存储系统
    initializeStorage() {
        if (!this.isLocalStorageAvailable()) {
            console.warn('LocalStorage not available, using memory storage');
            this.memoryStorage = {};
        }
        
        this.performMaintenance();
    }

    // 检查LocalStorage是否可用
    isLocalStorageAvailable() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 存储数据
    setItem(key, value) {
        const fullKey = this.storagePrefix + key;
        const data = {
            value: value,
            timestamp: Date.now(),
            version: this.dataVersion
        };
        
        try {
            if (this.isLocalStorageAvailable()) {
                localStorage.setItem(fullKey, JSON.stringify(data));
            } else {
                this.memoryStorage[fullKey] = data;
            }
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    // 获取数据
    getItem(key, defaultValue = null) {
        const fullKey = this.storagePrefix + key;
        
        try {
            let data;
            if (this.isLocalStorageAvailable()) {
                const item = localStorage.getItem(fullKey);
                if (!item) return defaultValue;
                data = JSON.parse(item);
            } else {
                data = this.memoryStorage[fullKey];
                if (!data) return defaultValue;
            }
            
            // 检查数据版本
            if (data.version !== this.dataVersion) {
                console.warn('Data version mismatch, removing old data');
                this.removeItem(key);
                return defaultValue;
            }
            
            return data.value;
        } catch (e) {
            console.error('Error loading from storage:', e);
            return defaultValue;
        }
    }

    // 删除数据
    removeItem(key) {
        const fullKey = this.storagePrefix + key;
        
        try {
            if (this.isLocalStorageAvailable()) {
                localStorage.removeItem(fullKey);
            } else {
                delete this.memoryStorage[fullKey];
            }
        } catch (e) {
            console.error('Error removing from storage:', e);
        }
    }

    // 保存单词学习进度
    saveWordProgress(words) {
        const progressData = words.map(word => ({
            id: word.id,
            german: word.german,
            proficiency: word.proficiency,
            lastReviewed: word.lastReviewed,
            reviewCount: word.reviewCount,
            mistakes: word.mistakes,
            firstLearned: word.firstLearned || Date.now()
        }));
        
        this.setItem('wordProgress', progressData);
    }

    // 加载单词学习进度
    loadWordProgress() {
        return this.getItem('wordProgress', []);
    }

    // 保存学习统计
    saveSessionStats(stats) {
        const existingStats = this.getItem('sessionStats', []);
        const newStats = {
            ...stats,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        
        // 保留最近30天的统计数据
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filteredStats = existingStats.filter(stat => 
            stat.timestamp > thirtyDaysAgo
        );
        
        filteredStats.push(newStats);
        this.setItem('sessionStats', filteredStats);
    }

    // 获取学习统计
    getSessionStats() {
        return this.getItem('sessionStats', []);
    }

    // 保存复习调度
    saveReviewSchedule(schedule) {
        this.setItem('reviewSchedule', schedule);
    }

    // 加载复习调度
    loadReviewSchedule() {
        return this.getItem('reviewSchedule', {});
    }

    // 保存用户设置
    saveUserSettings(settings) {
        this.setItem('userSettings', settings);
    }

    // 加载用户设置
    loadUserSettings() {
        return this.getItem('userSettings', {
            learningMode: 'de-en',
            soundEnabled: true,
            autoPlaySound: false,
            studyReminders: true,
            darkMode: false
        });
    }

    // 保存学习会话
    saveCurrentSession(sessionData) {
        this.setItem('currentSession', sessionData);
    }

    // 加载学习会话
    loadCurrentSession() {
        return this.getItem('currentSession', null);
    }

    // 清除当前会话
    clearCurrentSession() {
        this.removeItem('currentSession');
    }

    // 获取需要复习的单词
    getWordsForReview() {
        const wordProgress = this.loadWordProgress();
        const now = Date.now();
        
        return wordProgress.filter(word => {
            if (!word.lastReviewed || word.proficiency === 0) {
                return false;
            }
            
            const timeSinceReview = now - word.lastReviewed;
            const reviewInterval = this.calculateReviewInterval(word.proficiency, word.reviewCount);
            
            return timeSinceReview >= reviewInterval;
        });
    }

    // 计算复习间隔
    calculateReviewInterval(proficiency, reviewCount) {
        const baseInterval = 24 * 60 * 60 * 1000; // 24小时
        const multipliers = [1, 2, 4, 7, 15, 30]; // 遗忘曲线间隔
        
        const multiplier = multipliers[Math.min(reviewCount, multipliers.length - 1)];
        return baseInterval * multiplier;
    }

    // 获取学习统计摘要
    getLearningSummary() {
        const wordProgress = this.loadWordProgress();
        const sessionStats = this.getSessionStats();
        
        const summary = {
            totalWords: wordProgress.length,
            masteredWords: wordProgress.filter(w => w.proficiency >= 3).length,
            learningWords: wordProgress.filter(w => w.proficiency > 0 && w.proficiency < 3).length,
            newWords: wordProgress.filter(w => w.proficiency === 0).length,
            reviewDue: this.getWordsForReview().length,
            totalStudyTime: sessionStats.reduce((total, stat) => total + (stat.duration || 0), 0),
            averageAccuracy: this.calculateAverageAccuracy(sessionStats),
            studyDays: this.getStudyDays(sessionStats),
            lastStudyDate: sessionStats.length > 0 ? sessionStats[sessionStats.length - 1].date : null
        };
        
        return summary;
    }

    // 计算平均正确率
    calculateAverageAccuracy(sessionStats) {
        if (sessionStats.length === 0) return 0;
        
        const totalAccuracy = sessionStats.reduce((sum, stat) => sum + (stat.accuracy || 0), 0);
        return Math.round(totalAccuracy / sessionStats.length);
    }

    // 获取学习天数
    getStudyDays(sessionStats) {
        const uniqueDates = new Set(sessionStats.map(stat => stat.date));
        return uniqueDates.size;
    }

    // 导出学习数据
    exportData() {
        const data = {
            wordProgress: this.loadWordProgress(),
            sessionStats: this.getSessionStats(),
            userSettings: this.loadUserSettings(),
            reviewSchedule: this.loadReviewSchedule(),
            exportDate: new Date().toISOString(),
            version: this.dataVersion
        };
        
        return JSON.stringify(data, null, 2);
    }

    // 导入学习数据
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!data.wordProgress || !Array.isArray(data.wordProgress)) {
                throw new Error('Invalid data format');
            }
            
            // 备份现有数据
            this.backupCurrentData();
            
            // 导入数据
            this.setItem('wordProgress', data.wordProgress);
            if (data.sessionStats) this.setItem('sessionStats', data.sessionStats);
            if (data.userSettings) this.setItem('userSettings', data.userSettings);
            if (data.reviewSchedule) this.setItem('reviewSchedule', data.reviewSchedule);
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    // 备份当前数据
    backupCurrentData() {
        const backupData = {
            wordProgress: this.loadWordProgress(),
            sessionStats: this.getSessionStats(),
            userSettings: this.loadUserSettings(),
            reviewSchedule: this.loadReviewSchedule(),
            backupDate: new Date().toISOString()
        };
        
        this.setItem('dataBackup', backupData);
    }

    // 恢复备份数据
    restoreBackupData() {
        const backup = this.getItem('dataBackup');
        if (backup) {
            this.setItem('wordProgress', backup.wordProgress);
            this.setItem('sessionStats', backup.sessionStats);
            this.setItem('userSettings', backup.userSettings);
            this.setItem('reviewSchedule', backup.reviewSchedule);
            return true;
        }
        return false;
    }

    // 清理过期数据
    performMaintenance() {
        try {
            if (!this.isLocalStorageAvailable()) return;
            
            const now = Date.now();
            const keysToRemove = [];
            
            // 遍历所有localStorage键
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.timestamp && (now - data.timestamp) > this.maxCacheAge) {
                            // 保留重要数据，删除过期的会话数据
                            if (key.includes('currentSession') || key.includes('tempData')) {
                                keysToRemove.push(key);
                            }
                        }
                    } catch (e) {
                        // 删除无效数据
                        keysToRemove.push(key);
                    }
                }
            }
            
            // 删除过期数据
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`Storage maintenance completed. Removed ${keysToRemove.length} expired items.`);
        } catch (e) {
            console.error('Error during storage maintenance:', e);
        }
    }

    // 清除所有数据
    clearAllData() {
        try {
            if (this.isLocalStorageAvailable()) {
                // 只删除应用相关的数据
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.storagePrefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                this.memoryStorage = {};
            }
        } catch (e) {
            console.error('Error clearing data:', e);
        }
    }

    // 获取存储使用情况
    getStorageUsage() {
        if (!this.isLocalStorageAvailable()) {
            return { used: 0, total: 0, percentage: 0 };
        }
        
        let used = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                used += key.length + localStorage.getItem(key).length;
            }
        }
        
        // LocalStorage通常限制为5MB
        const total = 5 * 1024 * 1024;
        const percentage = Math.round((used / total) * 100);
        
        return { used, total, percentage };
    }
}

// 导出存储管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}