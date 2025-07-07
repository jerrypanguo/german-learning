// 德语背单词 - 学习引擎核心模块
class LearningEngine {
    constructor() {
        this.currentGroup = [];
        this.currentWordIndex = 0;
        this.currentMode = 'de-en';
        this.learningPhase = 'multiple_choice'; // multiple_choice, recognition, dictation
        this.groupSize = 5;
        this.allWords = [];
        this.wrongAnswers = [];
        this.sessionStats = {
            totalAnswers: 0,
            correctAnswers: 0,
            startTime: Date.now()
        };
        
        this.initializeEngine();
    }

    // 初始化学习引擎
    initializeEngine() {
        this.loadWords();
    }

    // 加载单词数据
    loadWords() {
        if (typeof germanWords !== 'undefined') {
            this.allWords = germanWords.map((word, index) => ({
                ...word,
                id: index,
                proficiency: 0,
                lastReviewed: null,
                reviewCount: 0,
                mistakes: 0
            }));
            
            // 数据完整性验证
            console.log('单词数据加载完成，总数:', this.allWords.length);
            
            // 验证sein单词的数据
            const seinWord = this.allWords.find(w => w.german === 'sein');
            if (seinWord) {
                console.log('sein单词数据:', seinWord);
            } else {
                console.error('未找到sein单词数据！');
            }
            
            // 验证所有单词都有必要字段
            const invalidWords = this.allWords.filter(word => 
                !word.german || !word.english || !word.chinese || !word.type
            );
            
            if (invalidWords.length > 0) {
                console.error('发现无效单词数据:', invalidWords);
            }
        } else {
            console.error('germanWords数据未定义！');
        }
    }

    // 开始新的学习组
    startNewGroup() {
        this.currentGroup = this.selectWordsForGroup();
        this.currentWordIndex = 0;
        this.wrongAnswers = [];
        this.learningPhase = 'multiple_choice';
        
        // 重置统计数据
        this.sessionStats = {
            totalAnswers: 0,
            correctAnswers: 0,
            startTime: Date.now()
        };
        
        this.shuffleCurrentGroup();
        
        return this.getCurrentWord();
    }

    // 选择学习组的单词
    selectWordsForGroup() {
        const needReview = this.allWords.filter(word => 
            this.needsReview(word)
        );
        
        const newWords = this.allWords.filter(word => 
            word.proficiency === 0 && !this.needsReview(word)
        );
        
        let selectedWords = [];
        
        // 优先选择需要复习的单词
        selectedWords = [...needReview.slice(0, this.groupSize)];
        
        // 如果不够，补充新单词
        if (selectedWords.length < this.groupSize && newWords.length > 0) {
            const remaining = this.groupSize - selectedWords.length;
            selectedWords = [...selectedWords, ...newWords.slice(0, remaining)];
        }
        
        return selectedWords;
    }

    // 检查单词是否需要复习
    needsReview(word) {
        if (!word.lastReviewed) return false;
        
        const now = Date.now();
        const timeSinceReview = now - word.lastReviewed;
        const reviewInterval = this.getReviewInterval(word.proficiency, word.reviewCount);
        
        return timeSinceReview >= reviewInterval;
    }

    // 获取复习间隔（基于遗忘曲线）
    getReviewInterval(proficiency, reviewCount) {
        const baseInterval = 24 * 60 * 60 * 1000; // 24小时
        const intervals = [
            1,     // 第1次复习：1天
            2,     // 第2次复习：2天
            4,     // 第3次复习：4天
            7,     // 第4次复习：7天
            15,    // 第5次复习：15天
            30     // 第6次复习：30天
        ];
        
        const multiplier = intervals[Math.min(reviewCount, intervals.length - 1)];
        return baseInterval * multiplier;
    }

    // 打乱当前组单词顺序
    shuffleCurrentGroup() {
        for (let i = this.currentGroup.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentGroup[i], this.currentGroup[j]] = [this.currentGroup[j], this.currentGroup[i]];
        }
    }

    // 获取当前单词
    getCurrentWord() {
        if (this.currentWordIndex >= this.currentGroup.length) {
            return null;
        }
        return this.currentGroup[this.currentWordIndex];
    }

    // 获取当前学习阶段
    getCurrentLearningPhase() {
        const currentWord = this.getCurrentWord();
        if (!currentWord) return null;
        
        // 根据学习阶段和单词熟练度决定学习模式
        if (this.learningPhase === 'dictation') {
            return 'dictation';
        }
        
        if (currentWord.proficiency === 0) {
            return 'multiple_choice';
        } else if (currentWord.proficiency === 1) {
            return 'recognition';
        } else if (currentWord.proficiency >= 2) {
            return 'recognition'; // 先让用户再次确认认识
        }
        
        return 'multiple_choice';
    }

    // 生成选择题选项
    generateMultipleChoiceOptions() {
        const currentWord = this.getCurrentWord();
        if (!currentWord) return [];
        
        console.log('生成选择题选项 - 当前单词:', currentWord);
        
        const correctAnswer = this.currentMode === 'de-en' ? 
            currentWord.english : currentWord.chinese;
        
        console.log('正确答案:', correctAnswer);
        
        const options = [correctAnswer];
        
        // 获取同类型的其他单词作为干扰项
        const otherWords = this.allWords.filter(word => 
            word.id !== currentWord.id && word.type === currentWord.type
        );
        
        // 如果同类型单词不够，从所有单词中选择
        const fallbackWords = this.allWords.filter(word => 
            word.id !== currentWord.id
        );
        
        const distractors = otherWords.length >= 3 ? otherWords : fallbackWords;
        
        console.log('可用干扰项数量:', distractors.length);
        
        // 随机选择3个干扰项
        while (options.length < 4 && distractors.length > 0) {
            const randomIndex = Math.floor(Math.random() * distractors.length);
            const distractor = distractors[randomIndex];
            const distractorAnswer = this.currentMode === 'de-en' ? 
                distractor.english : distractor.chinese;
            
            if (!options.includes(distractorAnswer)) {
                console.log('添加干扰项:', distractorAnswer, '来自单词:', distractor.german);
                options.push(distractorAnswer);
            }
            
            distractors.splice(randomIndex, 1);
        }
        
        // 如果还不够4个选项，添加一些通用干扰项
        if (options.length < 4) {
            const genericDistractors = ['other', 'unknown', 'different', 'various'];
            for (const distractor of genericDistractors) {
                if (options.length >= 4) break;
                if (!options.includes(distractor)) {
                    console.log('添加通用干扰项:', distractor);
                    options.push(distractor);
                }
            }
        }
        
        // 打乱选项顺序
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        console.log('最终选项:', options);
        
        return options;
    }

    // 处理用户答案
    handleAnswer(userAnswer, answerType = 'multiple_choice') {
        const currentWord = this.getCurrentWord();
        if (!currentWord) return false;
        
        let isCorrect = false;
        this.sessionStats.totalAnswers++;
        
        switch (answerType) {
            case 'multiple_choice':
                const correctAnswer = this.currentMode === 'de-en' ? 
                    currentWord.english : currentWord.chinese;
                isCorrect = userAnswer === correctAnswer;
                break;
                
            case 'recognition':
                // 认识模式：用户说"认识"就算正确，说"不认识"算错误
                isCorrect = userAnswer === 'know';
                break;
                
            case 'dictation':
                isCorrect = this.checkDictationAnswer(userAnswer, currentWord.german);
                break;
        }
        
        if (isCorrect) {
            this.sessionStats.correctAnswers++;
            this.handleCorrectAnswer(currentWord);
        } else {
            this.handleWrongAnswer(currentWord, userAnswer);
        }
        
        return isCorrect;
    }

    // 处理正确答案
    handleCorrectAnswer(word) {
        word.proficiency = Math.min(word.proficiency + 1, 4); // 最高熟练度提升到4
        word.lastReviewed = Date.now();
        word.reviewCount++;
        word.consecutiveCorrect = (word.consecutiveCorrect || 0) + 1;
        
        // 不在这里调用moveToNextWord，让调用者决定
    }

    // 处理错误答案
    handleWrongAnswer(word, userAnswer) {
        word.consecutiveCorrect = 0; // 重置连续正确数
        
        if (this.learningPhase === 'dictation') {
            // 默写模式错误，减少熟练度但不清零
            word.proficiency = Math.max(0, word.proficiency - 1);
            word.mistakes = (word.mistakes || 0) + 1;
            this.wrongAnswers.push({
                word: word,
                userAnswer: userAnswer,
                correctAnswer: word.german
            });
        } else if (this.learningPhase === 'recognition') {
            // 认识模式错误，适度降低熟练度
            word.proficiency = Math.max(0, word.proficiency - 1);
            word.mistakes = (word.mistakes || 0) + 1;
        } else {
            // 选择题模式错误，重置熟练度
            word.proficiency = 0;
            word.mistakes = (word.mistakes || 0) + 1;
        }
        
        // 不在这里调用moveToNextWord，让调用者决定
    }

    // 检查默写答案
    checkDictationAnswer(userInput, correctAnswer) {
        const normalize = (str) => {
            return str.toLowerCase()
                .trim()
                .replace(/\s+/g, ' ') // 标准化空格
                .replace(/['']/g, "'") // 标准化撇号
                .replace(/[""]/g, '"') // 标准化引号
                .replace(/[‐‑‒–—]/g, '-') // 标准化连字符
                // 德语字符标准化
                .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss'); // 将ß转换为ss进行比较
        };
        
        const normalizedInput = normalize(userInput);
        const normalizedCorrect = normalize(correctAnswer);
        
        // 直接比较
        if (normalizedInput === normalizedCorrect) {
            return true;
        }
        
        // 特殊处理：允许ss和ß互换
        // 用户输入ss，正确答案是ß
        const inputWithSS = userInput.toLowerCase().trim();
        const correctWithSS = correctAnswer.toLowerCase().replace(/ß/g, 'ss').trim();
        if (inputWithSS === correctWithSS) {
            return true;
        }
        
        // 用户输入ß，正确答案是ss
        const inputWithBeta = userInput.toLowerCase().replace(/ss/g, 'ß').trim();
        const correctWithBeta = correctAnswer.toLowerCase().trim();
        if (inputWithBeta === correctWithBeta) {
            return true;
        }
        
        return false;
    }

    // 移动到下一个单词
    moveToNextWord() {
        this.currentWordIndex++;
        
        // 如果当前组完成，检查是否需要开始默写阶段
        if (this.currentWordIndex >= this.currentGroup.length) {
            return this.handleGroupCompletion();
        }
        
        return this.getCurrentWord();
    }

    // 处理组完成
    handleGroupCompletion() {
        // 如果还没有进入默写阶段，检查是否可以开始默写
        if (this.learningPhase !== 'dictation') {
            // 检查是否有单词达到熟练度2或以上
            const canStartDictation = this.currentGroup.some(word => word.proficiency >= 2);
            
            if (canStartDictation) {
                // 开始默写阶段，只选择熟练度>=2的单词
                this.learningPhase = 'dictation';
                this.currentGroup = this.currentGroup.filter(word => word.proficiency >= 2);
                this.currentWordIndex = 0;
                this.shuffleCurrentGroup();
                return this.getCurrentWord();
            } else {
                // 重新开始当前组，选择熟练度<2的单词
                this.currentGroup = this.currentGroup.filter(word => word.proficiency < 2);
                if (this.currentGroup.length > 0) {
                    this.currentWordIndex = 0;
                    this.shuffleCurrentGroup();
                    return this.getCurrentWord();
                }
            }
        } else if (this.learningPhase === 'dictation') {
            // 默写阶段完成
            if (this.wrongAnswers.length > 0) {
                // 重新默写错误的单词
                this.currentGroup = this.wrongAnswers.map(item => item.word);
                this.wrongAnswers = [];
                this.currentWordIndex = 0;
                this.shuffleCurrentGroup();
                return this.getCurrentWord();
            }
        }
        
        // 组学习完成
        return null;
    }

    // 获取学习统计
    getSessionStats() {
        const accuracy = this.sessionStats.totalAnswers > 0 ? 
            Math.round((this.sessionStats.correctAnswers / this.sessionStats.totalAnswers) * 100) : 0;
        
        return {
            ...this.sessionStats,
            accuracy: accuracy,
            duration: Date.now() - this.sessionStats.startTime
        };
    }

    // 切换学习模式
    switchMode(mode) {
        this.currentMode = mode;
    }

    // 重置学习引擎
    reset() {
        this.currentGroup = [];
        this.currentWordIndex = 0;
        this.wrongAnswers = [];
        this.sessionStats = {
            totalAnswers: 0,
            correctAnswers: 0,
            startTime: Date.now()
        };
    }

    // 获取当前进度
    getCurrentProgress() {
        return {
            currentWordIndex: this.currentWordIndex,
            totalWords: this.currentGroup.length,
            currentWord: this.getCurrentWord(),
            learningPhase: this.getCurrentLearningPhase(),
            sessionStats: this.getSessionStats()
        };
    }
}

// 导出学习引擎
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningEngine;
}