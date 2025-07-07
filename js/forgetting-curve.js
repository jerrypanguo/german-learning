// 德语背单词 - 艾宾浩斯遗忘曲线算法
class ForgettingCurve {
    constructor() {
        // 标准艾宾浩斯遗忘曲线间隔（小时）
        this.baseIntervals = [
            1,      // 1小时后
            24,     // 1天后
            72,     // 3天后
            168,    // 1周后
            336,    // 2周后
            720,    // 1个月后
            2160,   // 3个月后
            4320    // 6个月后
        ];
        
        // 难度系数（影响复习间隔）
        this.difficultyFactors = {
            'easy': 1.3,      // 简单单词间隔延长
            'normal': 1.0,    // 普通单词标准间隔
            'hard': 0.7       // 困难单词间隔缩短
        };
        
        // 熟练度加成
        this.proficiencyBonus = {
            0: 0.5,   // 新单词
            1: 0.8,   // 初级
            2: 1.0,   // 中级
            3: 1.2    // 高级
        };
        
        // 记忆强度衰减函数参数
        this.memoryDecayRate = 0.9;
        this.minimumRetention = 0.2;
    }

    // 计算下次复习时间
    calculateNextReview(wordData) {
        const {
            proficiency = 0,
            reviewCount = 0,
            lastReviewed = Date.now(),
            consecutiveCorrect = 0,
            mistakes = 0,
            difficulty = 'normal'
        } = wordData;
        
        // 基础间隔（小时）
        const baseInterval = this.getBaseInterval(reviewCount);
        
        // 应用各种修正因子
        let adjustedInterval = baseInterval;
        
        // 难度系数
        adjustedInterval *= this.difficultyFactors[difficulty];
        
        // 熟练度加成
        adjustedInterval *= this.proficiencyBonus[Math.min(proficiency, 3)];
        
        // 表现调整
        adjustedInterval *= this.getPerformanceModifier(consecutiveCorrect, mistakes);
        
        // 记忆衰减调整
        adjustedInterval *= this.getMemoryDecayModifier(lastReviewed);
        
        // 确保间隔在合理范围内
        adjustedInterval = Math.max(1, Math.min(adjustedInterval, 24 * 30 * 6)); // 1小时到6个月
        
        // 转换为毫秒并返回绝对时间
        const intervalMs = adjustedInterval * 60 * 60 * 1000;
        return Date.now() + intervalMs;
    }

    // 获取基础间隔
    getBaseInterval(reviewCount) {
        if (reviewCount < this.baseIntervals.length) {
            return this.baseIntervals[reviewCount];
        }
        
        // 超出预设间隔后，使用指数增长
        const lastInterval = this.baseIntervals[this.baseIntervals.length - 1];
        const extraReviews = reviewCount - this.baseIntervals.length + 1;
        return lastInterval * Math.pow(1.5, extraReviews);
    }

    // 获取表现修正因子
    getPerformanceModifier(consecutiveCorrect, mistakes) {
        const correctBonus = Math.min(consecutiveCorrect * 0.1, 0.5); // 最多50%加成
        const mistakePenalty = Math.min(mistakes * 0.05, 0.3); // 最多30%减成
        
        return Math.max(0.3, 1 + correctBonus - mistakePenalty);
    }

    // 获取记忆衰减修正因子
    getMemoryDecayModifier(lastReviewed) {
        const timeSinceReview = Date.now() - lastReviewed;
        const daysSinceReview = timeSinceReview / (24 * 60 * 60 * 1000);
        
        // 如果距离上次复习时间过长，缩短间隔
        if (daysSinceReview > 7) {
            return Math.max(0.5, 1 - (daysSinceReview - 7) * 0.05);
        }
        
        return 1.0;
    }

    // 计算记忆保持率
    calculateRetentionRate(wordData) {
        const {
            lastReviewed = Date.now(),
            reviewCount = 0,
            proficiency = 0,
            consecutiveCorrect = 0,
            mistakes = 0
        } = wordData;
        
        const timeSinceReview = Date.now() - lastReviewed;
        const daysSinceReview = timeSinceReview / (24 * 60 * 60 * 1000);
        
        // 基础记忆衰减
        const baseDecay = Math.pow(this.memoryDecayRate, daysSinceReview);
        
        // 熟练度影响
        const proficiencyEffect = 1 + proficiency * 0.2;
        
        // 表现影响
        const performanceEffect = 1 + (consecutiveCorrect * 0.1) - (mistakes * 0.05);
        
        // 复习次数影响
        const reviewEffect = 1 + Math.min(reviewCount * 0.05, 0.3);
        
        const retentionRate = Math.max(
            this.minimumRetention,
            baseDecay * proficiencyEffect * performanceEffect * reviewEffect
        );
        
        return Math.min(1.0, retentionRate);
    }

    // 判断是否需要复习
    needsReview(wordData) {
        const nextReviewTime = this.calculateNextReview(wordData);
        return Date.now() >= nextReviewTime;
    }

    // 根据表现更新单词难度
    updateWordDifficulty(wordData, isCorrect) {
        const { mistakes = 0, consecutiveCorrect = 0, difficulty = 'normal' } = wordData;
        
        let newDifficulty = difficulty;
        
        if (isCorrect) {
            // 连续正确较多，降低难度
            if (consecutiveCorrect >= 3 && difficulty === 'hard') {
                newDifficulty = 'normal';
            } else if (consecutiveCorrect >= 5 && difficulty === 'normal') {
                newDifficulty = 'easy';
            }
        } else {
            // 错误较多，提高难度
            if (mistakes >= 3 && difficulty === 'easy') {
                newDifficulty = 'normal';
            } else if (mistakes >= 5 && difficulty === 'normal') {
                newDifficulty = 'hard';
            }
        }
        
        return newDifficulty;
    }

    // 获取最佳复习时间建议
    getOptimalReviewTime(wordData) {
        const retentionRate = this.calculateRetentionRate(wordData);
        const nextReviewTime = this.calculateNextReview(wordData);
        
        // 如果记忆保持率过低，建议立即复习
        if (retentionRate < 0.5) {
            return {
                reviewTime: Date.now(),
                urgency: 'high',
                reason: '记忆保持率过低，建议立即复习'
            };
        }
        
        // 如果已经过了复习时间，建议尽快复习
        if (Date.now() >= nextReviewTime) {
            return {
                reviewTime: nextReviewTime,
                urgency: 'medium',
                reason: '已到复习时间'
            };
        }
        
        // 正常情况下的复习建议
        return {
            reviewTime: nextReviewTime,
            urgency: 'low',
            reason: '按计划复习'
        };
    }

    // 批量计算复习计划
    generateReviewSchedule(wordsData, daysAhead = 7) {
        const schedule = {};
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        wordsData.forEach(word => {
            const reviewTime = this.calculateNextReview(word);
            const daysDiff = Math.ceil((reviewTime - now) / oneDayMs);
            
            if (daysDiff <= daysAhead) {
                const dateKey = new Date(reviewTime).toISOString().split('T')[0];
                
                if (!schedule[dateKey]) {
                    schedule[dateKey] = [];
                }
                
                schedule[dateKey].push({
                    word: word,
                    reviewTime: reviewTime,
                    priority: this.calculateReviewPriority(word)
                });
            }
        });
        
        // 按优先级排序
        Object.keys(schedule).forEach(date => {
            schedule[date].sort((a, b) => b.priority - a.priority);
        });
        
        return schedule;
    }

    // 计算复习优先级
    calculateReviewPriority(wordData) {
        const retentionRate = this.calculateRetentionRate(wordData);
        const { proficiency = 0, mistakes = 0 } = wordData;
        
        // 记忆保持率低的优先级高
        let priority = (1 - retentionRate) * 100;
        
        // 低熟练度的优先级高
        priority += (3 - proficiency) * 10;
        
        // 错误多的优先级高
        priority += mistakes * 5;
        
        return Math.round(priority);
    }

    // 获取学习效果分析
    getEfficiencyAnalysis(sessionData) {
        const {
            correctAnswers = 0,
            totalAnswers = 0,
            studyTime = 0,
            wordsReviewed = []
        } = sessionData;
        
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        const wordsPerMinute = studyTime > 0 ? (wordsReviewed.length / (studyTime / 60000)) : 0;
        
        let efficiency = 'normal';
        if (accuracy >= 90 && wordsPerMinute >= 3) {
            efficiency = 'excellent';
        } else if (accuracy >= 80 && wordsPerMinute >= 2) {
            efficiency = 'good';
        } else if (accuracy < 60 || wordsPerMinute < 1) {
            efficiency = 'poor';
        }
        
        return {
            accuracy: Math.round(accuracy),
            wordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
            efficiency: efficiency,
            recommendations: this.generateRecommendations(accuracy, wordsPerMinute)
        };
    }

    // 生成学习建议
    generateRecommendations(accuracy, wordsPerMinute) {
        const recommendations = [];
        
        if (accuracy < 60) {
            recommendations.push('建议放慢学习速度，专注于理解单词含义');
        } else if (accuracy < 80) {
            recommendations.push('可以适当增加复习频率，巩固记忆');
        }
        
        if (wordsPerMinute < 1) {
            recommendations.push('可以尝试提高学习速度，每分钟学习2-3个单词');
        } else if (wordsPerMinute > 4) {
            recommendations.push('学习速度较快，注意确保理解质量');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('学习效果良好，继续保持');
        }
        
        return recommendations;
    }
}

// 导出遗忘曲线算法
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForgettingCurve;
}