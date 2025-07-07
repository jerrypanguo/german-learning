// 德语背单词智能学习系统 - 主应用逻辑
class GermanVocabularyApp {
    constructor() {
        // 初始化各个模块
        this.storageManager = new StorageManager();
        this.forgettingCurve = new ForgettingCurve();
        this.inputController = new InputController();
        this.learningEngine = new LearningEngine();
        
        // 应用状态
        this.currentMode = 'de-en';
        this.isLearning = false;
        this.currentScreen = 'start';
        this.currentLearningMode = null;
        this.speech = null;
        
        // 统计数据
        this.sessionStats = {
            correctAnswers: 0,
            wrongAnswers: 0,
            startTime: Date.now()
        };
        
        this.initializeApp();
    }

    // 初始化应用
    async initializeApp() {
        try {
            await this.setupSpeechSynthesis();
            this.loadUserProgress();
            this.bindEvents();
            this.updateStartScreen();
            
            // 延迟显示欢迎消息，确保DOM已准备好
            setTimeout(() => {
                this.showToast('欢迎使用德语背单词学习系统！', 'success');
            }, 500);
        } catch (error) {
            console.error('App initialization error:', error);
        }
    }

    // 设置语音合成
    async setupSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speech = window.speechSynthesis;
            
            // 等待语音列表加载
            const loadVoices = () => {
                return new Promise((resolve) => {
                    const voices = speechSynthesis.getVoices();
                    if (voices.length > 0) {
                        resolve(voices);
                    } else {
                        speechSynthesis.onvoiceschanged = () => {
                            resolve(speechSynthesis.getVoices());
                        };
                    }
                });
            };
            
            await loadVoices();
        }
    }

    // 加载用户进度
    loadUserProgress() {
        const wordProgress = this.storageManager.loadWordProgress();
        const userSettings = this.storageManager.loadUserSettings();
        
        // 更新单词数据
        this.learningEngine.allWords.forEach(word => {
            const savedProgress = wordProgress.find(p => p.id === word.id);
            if (savedProgress) {
                Object.assign(word, savedProgress);
            }
        });
        
        // 应用用户设置
        this.currentMode = userSettings.learningMode || 'de-en';
        this.updateModeButtons();
    }

    // 绑定事件监听
    bindEvents() {
        // 模式切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Mode button clicked:', e.target.dataset.mode);
                this.switchMode(e.target.dataset.mode);
            });
        });

        // 开始界面按钮
        const startBtn = document.getElementById('startLearningBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('Start learning button clicked');
                this.startLearning();
            });
        }

        const reviewBtn = document.getElementById('reviewBtn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                console.log('Review button clicked');
                this.startReview();
            });
        }

        // 学习控制按钮
        const pauseBtn = document.getElementById('pauseLearningBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log('Pause button clicked');
                this.pauseLearning();
            });
        }

        const exitBtn = document.getElementById('exitLearningBtn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                console.log('Exit button clicked');
                this.exitLearning();
            });
        }

        // 发音按钮
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Sound button clicked');
                this.playPronunciation();
            });
        });

        // 选择题选项点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('.option-btn')) {
                console.log('Option button clicked:', e.target.textContent);
                this.handleMultipleChoiceAnswer(e.target);
            }
        });

        // 认识模式按钮
        const knowBtn = document.getElementById('knowBtn');
        if (knowBtn) {
            knowBtn.addEventListener('click', () => {
                console.log('Know button clicked');
                this.handleRecognitionAnswer(true);
            });
        }

        const dontKnowBtn = document.getElementById('dontKnowBtn');
        if (dontKnowBtn) {
            dontKnowBtn.addEventListener('click', () => {
                console.log('Dont know button clicked');
                this.handleRecognitionAnswer(false);
            });
        }

        // 默写模式按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('Clear button clicked');
                this.clearDictationInput();
            });
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                console.log('Submit button clicked');
                this.submitDictation();
            });
        }

        // 默写输入提交事件
        document.addEventListener('dictationSubmit', (e) => {
            this.handleDictationAnswer(e.detail.value);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (!this.isLearning) return;
            
            // 检查是否在输入框中，如果在输入框中就不处理快捷键
            const isInInput = e.target.matches('.dictation-input') || 
                             e.target.tagName === 'INPUT' || 
                             e.target.tagName === 'TEXTAREA';
            
            if (isInInput) {
                // 在输入框中，只处理Enter和Escape
                switch(e.key) {
                    case 'Enter':
                        if (this.currentLearningMode === 'dictation') {
                            e.preventDefault();
                            this.submitDictation();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.exitLearning();
                        break;
                }
                return; // 其他按键让输入框正常处理
            }
            
            // 不在输入框中，处理全局快捷键
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.playPronunciation();
                    break;
                case 'Enter':
                    if (this.currentLearningMode === 'dictation') {
                        this.submitDictation();
                    }
                    break;
                case 'Escape':
                    this.exitLearning();
                    break;
            }
        });
    }

    // 切换学习模式
    switchMode(mode) {
        this.currentMode = mode;
        this.learningEngine.switchMode(mode);
        this.updateModeButtons();
        
        // 保存用户设置
        const settings = this.storageManager.loadUserSettings();
        settings.learningMode = mode;
        this.storageManager.saveUserSettings(settings);
        
        this.showToast(`切换到${mode === 'de-en' ? '德英' : '德中'}模式`, 'success');
    }

    // 更新模式按钮状态
    updateModeButtons() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
            }
        });
    }

    // 更新开始界面
    updateStartScreen() {
        const summary = this.storageManager.getLearningSummary();
        
        document.getElementById('masteredWords').textContent = summary.masteredWords;
        document.getElementById('learningWords').textContent = summary.learningWords;
        document.getElementById('reviewWords').textContent = summary.reviewDue;
    }

    // 开始学习
    startLearning() {
        const currentWord = this.learningEngine.startNewGroup();
        
        if (!currentWord) {
            this.showToast('恭喜！您已完成所有单词的学习', 'success');
            return;
        }
        
        this.isLearning = true;
        
        // 注意：不需要在这里设置sessionStats，因为learning-engine已经重置了
        // 直接显示学习界面和更新显示即可
        
        this.showLearningScreen();
        this.updateLearningDisplay();
    }

    // 开始复习
    startReview() {
        const reviewWords = this.storageManager.getWordsForReview();
        
        if (reviewWords.length === 0) {
            this.showToast('暂无需要复习的单词', 'success');
            return;
        }
        
        // 设置复习模式
        this.learningEngine.currentGroup = reviewWords.slice(0, 5);
        this.learningEngine.currentWordIndex = 0;
        
        this.isLearning = true;
        this.showLearningScreen();
        this.updateLearningDisplay();
    }

    // 显示学习界面
    showLearningScreen() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('learningScreen').style.display = 'flex';
        this.currentScreen = 'learning';
    }

    // 显示开始界面
    showStartScreen() {
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('learningScreen').style.display = 'none';
        this.currentScreen = 'start';
        this.updateStartScreen();
    }

    // 更新学习界面显示
    updateLearningDisplay() {
        const progress = this.learningEngine.getCurrentProgress();
        
        if (!progress.currentWord) {
            this.completeLearningGroup();
            return;
        }
        
        const currentWord = progress.currentWord;
        const learningPhase = progress.learningPhase;
        
        // 隐藏所有学习模式
        document.querySelectorAll('.learning-mode').forEach(mode => {
            mode.style.display = 'none';
        });
        
        // 显示当前学习阶段
        this.currentLearningMode = learningPhase;
        
        switch (learningPhase) {
            case 'multiple_choice':
                this.showMultipleChoiceMode(currentWord);
                break;
            case 'recognition':
                this.showRecognitionMode(currentWord);
                break;
            case 'dictation':
                this.showDictationMode(currentWord);
                break;
        }
        
        // 更新进度条
        this.updateProgressBar(progress);
        
        // 更新统计信息
        this.updateStats();
    }

    // 显示选择题模式
    showMultipleChoiceMode(word) {
        const mode = document.getElementById('multipleChoiceMode');
        mode.style.display = 'block';
        
        document.getElementById('questionWord').textContent = word.german;
        document.getElementById('questionType').textContent = word.type;
        
        // 生成选项
        const options = this.learningEngine.generateMultipleChoiceOptions();
        const optionsContainer = document.getElementById('multipleOptions');
        optionsContainer.innerHTML = '';
        
        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.dataset.answer = option;
            optionsContainer.appendChild(btn);
        });
        
        // 更新计数器
        this.updateWordCount('wordCount');
    }

    // 显示认识模式
    showRecognitionMode(word) {
        const mode = document.getElementById('recognitionMode');
        mode.style.display = 'block';
        
        document.getElementById('recognitionWord').textContent = word.german;
        document.getElementById('recognitionType').textContent = word.type;
        
        // 隐藏答案显示
        document.getElementById('answerReveal').style.display = 'none';
        
        // 更新计数器
        this.updateWordCount('wordCountRecog');
    }

    // 显示默写模式
    showDictationMode(word) {
        const mode = document.getElementById('dictationMode');
        mode.style.display = 'block';
        
        const hint = this.currentMode === 'de-en' ? word.english : word.chinese;
        document.getElementById('dictationHint').textContent = hint;
        document.getElementById('dictationType').textContent = word.type;
        
        // 清空输入框
        const input = document.getElementById('dictationInput');
        input.value = '';
        input.focus();
        
        // 隐藏结果显示
        document.getElementById('dictationResult').style.display = 'none';
        
        // 更新计数器
        this.updateWordCount('wordCountDict');
    }

    // 更新单词计数器
    updateWordCount(elementId) {
        const progress = this.learningEngine.getCurrentProgress();
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${progress.currentWordIndex + 1} / ${progress.totalWords}`;
        }
    }

    // 更新进度条
    updateProgressBar(progress) {
        const percentage = progress.totalWords > 0 ? 
            ((progress.currentWordIndex + 1) / progress.totalWords) * 100 : 0;
        document.getElementById('progressFill').style.width = `${percentage}%`;
        
        const phaseText = progress.learningPhase === 'dictation' ? '默写阶段' : 
                         progress.learningPhase === 'recognition' ? '认识阶段' : '选择阶段';
        document.getElementById('progressText').textContent = 
            `${phaseText} / 共${progress.totalWords}个单词`;
    }

    // 更新统计信息
    updateStats() {
        const engineStats = this.learningEngine.getSessionStats();
        
        document.getElementById('correctCount').textContent = engineStats.correctAnswers;
        document.getElementById('wrongCount').textContent = engineStats.totalAnswers - engineStats.correctAnswers;
        document.getElementById('accuracy').textContent = `${engineStats.accuracy}%`;
    }

    // 处理选择题答案
    handleMultipleChoiceAnswer(selectedBtn) {
        // 获取当前单词和正确答案
        const currentWord = this.learningEngine.getCurrentWord();
        const correctAnswer = this.currentMode === 'de-en' ? 
            currentWord.english : currentWord.chinese;
        
        // 禁用所有选项
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        const userAnswer = selectedBtn.dataset.answer;
        const isCorrect = this.learningEngine.handleAnswer(userAnswer, 'multiple_choice');
        
        // 更新按钮样式
        selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // 如果错误，显示正确答案
        if (!isCorrect) {
            document.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.dataset.answer === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }
        
        // 显示反馈
        this.showToast(isCorrect ? '正确！' : `答案错误，正确答案是：${correctAnswer}`, isCorrect ? 'success' : 'error');
        
        // 延迟进入下一个单词
        setTimeout(() => {
            this.nextWord();
        }, 1500);
    }

    // 处理认识模式答案
    handleRecognitionAnswer(knows) {
        const userAnswer = knows ? 'know' : 'dont_know';
        const isCorrect = this.learningEngine.handleAnswer(userAnswer, 'recognition');
        
        // 显示正确答案
        const currentWord = this.learningEngine.getCurrentWord();
        const correctAnswer = this.currentMode === 'de-en' ? 
            currentWord.english : currentWord.chinese;
        
        document.getElementById('recognitionAnswer').textContent = correctAnswer;
        document.getElementById('answerReveal').style.display = 'block';
        
        // 显示反馈
        this.showToast(isCorrect ? '很好！' : '需要加强记忆', isCorrect ? 'success' : 'error');
        
        // 延迟进入下一个单词
        setTimeout(() => {
            this.nextWord();
        }, 2000);
    }

    // 处理默写答案
    handleDictationAnswer(userInput) {
        const currentWord = this.learningEngine.getCurrentWord();
        const isCorrect = this.learningEngine.handleAnswer(userInput, 'dictation');
        
        // 显示结果
        const resultElement = document.getElementById('dictationResult');
        const statusElement = document.getElementById('resultStatus');
        const correctWordElement = document.getElementById('correctWord');
        
        statusElement.textContent = isCorrect ? '正确！' : '答案错误';
        statusElement.className = `result-status ${isCorrect ? 'correct' : 'incorrect'}`;
        correctWordElement.textContent = `正确答案：${currentWord.german}`;
        
        resultElement.style.display = 'block';
        
        // 显示反馈
        this.showToast(isCorrect ? '默写正确！' : '继续加油！', isCorrect ? 'success' : 'error');
        
        // 延迟进入下一个单词
        setTimeout(() => {
            this.nextWord();
        }, 2000);
    }

    // 进入下一个单词
    nextWord() {
        const nextWord = this.learningEngine.moveToNextWord();
        
        if (nextWord) {
            this.updateLearningDisplay();
        } else {
            this.completeLearningGroup();
        }
    }

    // 完成学习组
    completeLearningGroup() {
        // 保存学习进度
        this.saveProgress();
        
        // 显示完成提示
        this.showToast('恭喜完成本组学习！', 'success');
        
        // 返回开始界面
        setTimeout(() => {
            this.exitLearning();
        }, 2000);
    }

    // 播放德语发音
    playPronunciation() {
        if (!this.speech) {
            this.showToast('浏览器不支持语音功能', 'error');
            return;
        }
        
        const currentWord = this.learningEngine.getCurrentWord();
        if (!currentWord) return;
        
        const utterance = new SpeechSynthesisUtterance(currentWord.german);
        utterance.lang = 'de-DE';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 尝试使用德语语音
        const voices = this.speech.getVoices();
        const germanVoice = voices.find(voice => 
            voice.lang.startsWith('de') || voice.name.includes('German')
        );
        
        if (germanVoice) {
            utterance.voice = germanVoice;
        }
        
        this.speech.speak(utterance);
    }

    // 清空默写输入
    clearDictationInput() {
        document.getElementById('dictationInput').value = '';
        document.getElementById('dictationInput').focus();
    }

    // 提交默写
    submitDictation() {
        const input = document.getElementById('dictationInput');
        const value = input.value.trim();
        
        if (value.length === 0) {
            this.showToast('请输入德语单词', 'error');
            return;
        }
        
        this.handleDictationAnswer(value);
    }

    // 暂停学习
    pauseLearning() {
        // 保存当前会话
        const sessionData = {
            currentGroup: this.learningEngine.currentGroup,
            currentWordIndex: this.learningEngine.currentWordIndex,
            sessionStats: this.learningEngine.getSessionStats(),
            currentMode: this.currentMode
        };
        
        this.storageManager.saveCurrentSession(sessionData);
        this.showToast('学习进度已保存', 'success');
        
        this.exitLearning();
    }

    // 退出学习
    exitLearning() {
        this.isLearning = false;
        this.currentLearningMode = null;
        
        // 保存进度
        this.saveProgress();
        
        // 清理输入控制器
        this.inputController.reset();
        
        // 显示开始界面
        this.showStartScreen();
    }

    // 保存学习进度
    saveProgress() {
        // 保存单词进度
        this.storageManager.saveWordProgress(this.learningEngine.allWords);
        
        // 保存会话统计
        const engineStats = this.learningEngine.getSessionStats();
        if (engineStats.totalAnswers > 0) {
            this.storageManager.saveSessionStats({
                ...engineStats,
                duration: engineStats.duration
            });
        }
        
        // 清除当前会话
        this.storageManager.clearCurrentSession();
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        
        // 如果容器不存在，创建一个
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // 获取学习统计摘要
    getLearningSummary() {
        return this.storageManager.getLearningSummary();
    }

    // 导出学习数据
    exportData() {
        return this.storageManager.exportData();
    }

    // 导入学习数据
    importData(jsonData) {
        const success = this.storageManager.importData(jsonData);
        if (success) {
            this.loadUserProgress();
            this.updateStartScreen();
            this.showToast('数据导入成功', 'success');
        } else {
            this.showToast('数据导入失败', 'error');
        }
        return success;
    }
}

// 等待页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing app...');
    
    // 确保所有必要的类都已定义
    if (typeof StorageManager === 'undefined') {
        console.error('StorageManager not found');
        return;
    }
    if (typeof ForgettingCurve === 'undefined') {
        console.error('ForgettingCurve not found');
        return;
    }
    if (typeof InputController === 'undefined') {
        console.error('InputController not found');
        return;
    }
    if (typeof LearningEngine === 'undefined') {
        console.error('LearningEngine not found');
        return;
    }
    if (typeof germanWords === 'undefined') {
        console.error('germanWords not found');
        return;
    }
    
    console.log('All dependencies found, creating app instance...');
    
    try {
        window.app = new GermanVocabularyApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // 如果主应用初始化失败，至少确保基本按钮能工作
        setTimeout(() => {
            const startBtn = document.getElementById('startLearningBtn');
            if (startBtn && !startBtn.onclick) {
                startBtn.addEventListener('click', () => {
                    alert('应用初始化失败，请刷新页面重试');
                });
            }
        }, 100);
    }
});

// 导出应用类（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GermanVocabularyApp;
}