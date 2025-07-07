// 德语背单词 - 输入控制器（德语键盘控制）
class InputController {
    constructor() {
        this.germanKeyMap = {
            // 德语特殊字符映射
            'AE': 'ä',
            'OE': 'ö',
            'UE': 'ü',
            'SS': 'ß'
        };
        
        this.currentInputElement = null;
        this.isDictationMode = false;
        this.originalInputMode = null;
        this.inputHistory = [];
        this.autoCorrectEnabled = true;
        
        this.initializeController();
    }

    // 初始化控制器
    initializeController() {
        this.createGermanKeyboard();
        this.setupEventListeners();
    }

    // 创建虚拟德语键盘
    createGermanKeyboard() {
        const keyboard = document.createElement('div');
        keyboard.className = 'german-keyboard';
        keyboard.innerHTML = `
            <div class="keyboard-row">
                <button class="key-btn" data-char="ä">ä</button>
                <button class="key-btn" data-char="ö">ö</button>
                <button class="key-btn" data-char="ü">ü</button>
                <button class="key-btn" data-char="ß">ß</button>
            </div>
            <div class="keyboard-hint">
                <span>提示：可以输入 AE→ä, OE→ö, UE→ü，SS→ß</span>
            </div>
        `;
        
        // 设置键盘样式
        keyboard.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border: 1px solid #000;
            padding: 10px;
            display: none;
            z-index: 1000;
            font-family: 'SF Mono', monospace;
        `;
        
        document.body.appendChild(keyboard);
        this.germanKeyboard = keyboard;
        
        // 绑定键盘按钮事件
        keyboard.querySelectorAll('.key-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertCharacter(e.target.dataset.char);
            });
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 监听输入框获得焦点
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('.dictation-input')) {
                this.enableDictationMode(e.target);
            }
        });

        // 监听输入框失去焦点
        document.addEventListener('focusout', (e) => {
            if (e.target.matches('.dictation-input')) {
                this.disableDictationMode(e.target);
            }
        });

        // 监听键盘输入
        document.addEventListener('input', (e) => {
            if (e.target.matches('.dictation-input')) {
                this.handleDictationInput(e);
            }
        });

        // 监听键盘按键
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('.dictation-input')) {
                this.handleKeyDown(e);
            }
        });
    }

    // 启用默写模式
    enableDictationMode(inputElement) {
        this.currentInputElement = inputElement;
        this.isDictationMode = true;
        
        // 设置输入属性
        inputElement.setAttribute('spellcheck', 'false');
        inputElement.setAttribute('autocomplete', 'off');
        inputElement.setAttribute('autocorrect', 'off');
        inputElement.setAttribute('autocapitalize', 'off');
        
        // 设置输入法
        this.setInputMethod(inputElement);
        
        // 显示德语键盘
        this.showGermanKeyboard();
        
        // 清空输入历史
        this.inputHistory = [];
        
        // 添加输入提示
        this.showInputHint(inputElement);
    }

    // 禁用默写模式
    disableDictationMode(inputElement) {
        this.isDictationMode = false;
        this.currentInputElement = null;
        
        // 隐藏德语键盘
        this.hideGermanKeyboard();
        
        // 隐藏输入提示
        this.hideInputHint();
        
        // 恢复原始输入法设置
        this.restoreInputMethod(inputElement);
    }

    // 设置输入法
    setInputMethod(inputElement) {
        // 尝试设置德语输入法
        inputElement.style.imeMode = 'disabled';
        inputElement.lang = 'de';
        
        // 保存原始设置
        this.originalInputMode = {
            spellcheck: inputElement.getAttribute('spellcheck'),
            autocomplete: inputElement.getAttribute('autocomplete'),
            autocorrect: inputElement.getAttribute('autocorrect'),
            autocapitalize: inputElement.getAttribute('autocapitalize')
        };
    }

    // 恢复输入法设置
    restoreInputMethod(inputElement) {
        if (this.originalInputMode) {
            Object.keys(this.originalInputMode).forEach(attr => {
                if (this.originalInputMode[attr]) {
                    inputElement.setAttribute(attr, this.originalInputMode[attr]);
                } else {
                    inputElement.removeAttribute(attr);
                }
            });
        }
        
        inputElement.style.imeMode = '';
        inputElement.lang = '';
    }

    // 显示德语键盘
    showGermanKeyboard() {
        if (this.germanKeyboard) {
            this.germanKeyboard.style.display = 'block';
        }
    }

    // 隐藏德语键盘
    hideGermanKeyboard() {
        if (this.germanKeyboard) {
            this.germanKeyboard.style.display = 'none';
        }
    }

    // 显示输入提示
    showInputHint(inputElement) {
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = '输入德语单词（支持空格，ae→ä, oe→ö, ue→ü，点击ß按钮）';
        hint.style.cssText = `
            position: absolute;
            top: -25px;
            left: 0;
            font-size: 12px;
            color: #666;
            background: white;
            padding: 2px 5px;
            border: 1px solid #ccc;
            font-family: 'SF Mono', monospace;
        `;
        
        inputElement.parentNode.style.position = 'relative';
        inputElement.parentNode.appendChild(hint);
        this.inputHint = hint;
    }

    // 隐藏输入提示
    hideInputHint() {
        if (this.inputHint) {
            this.inputHint.remove();
            this.inputHint = null;
        }
    }

    // 处理默写输入
    handleDictationInput(event) {
        const inputElement = event.target;
        const currentValue = inputElement.value;
        
        // 记录输入历史
        this.inputHistory.push(currentValue);
        
        // 自动转换德语字符
        if (this.autoCorrectEnabled) {
            const convertedValue = this.convertGermanCharacters(currentValue);
            if (convertedValue !== currentValue) {
                inputElement.value = convertedValue;
                // 保持光标位置
                const cursorPosition = inputElement.selectionStart;
                inputElement.setSelectionRange(cursorPosition, cursorPosition);
            }
        }
        
        // 实时验证
        this.validateInput(inputElement);
    }

    // 处理键盘按键
    handleKeyDown(event) {
        const inputElement = event.target;
        
        // 处理特殊按键
        switch (event.key) {
            case 'Tab':
                event.preventDefault();
                this.insertCharacter('    '); // 插入4个空格
                break;
                
            case 'Enter':
                event.preventDefault();
                this.submitDictation();
                break;
                
            case 'Escape':
                this.clearInput();
                break;
        }
        
        // 禁用某些快捷键
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'a': // 全选
                case 'c': // 复制
                case 'v': // 粘贴
                case 'x': // 剪切
                case 'z': // 撤销
                    // 允许这些操作
                    break;
                default:
                    // 其他快捷键可能干扰输入
                    event.preventDefault();
            }
        }
    }

    // 转换德语字符
    convertGermanCharacters(text) {
        let converted = text;
        
        // 更智能的替换逻辑，只在单词边界或完整匹配时转换
        // 避免误转换已经包含德语字符的文本
        
        // 只有在以下情况才转换：
        // 1. 整个输入就是ae/oe/ue
        // 2. 在单词开头或空格后
        // 3. 用户刚输入完ae/oe/ue序列
        
        // 更安全的转换策略：只转换最后输入的序列
        const lastTwoChars = text.slice(-2).toLowerCase();
        const lastThreeChars = text.slice(-3).toLowerCase();
        
        // 检查是否需要转换最后输入的字符
        if (lastTwoChars === 'ae' && !text.slice(-3, -2).match(/[äöüß]/)) {
            converted = text.slice(0, -2) + 'ä';
        } else if (lastTwoChars === 'oe' && !text.slice(-3, -2).match(/[äöüß]/)) {
            converted = text.slice(0, -2) + 'ö';
        } else if (lastTwoChars === 'ue' && !text.slice(-3, -2).match(/[äöüß]/)) {
            converted = text.slice(0, -2) + 'ü';
        }
        
        // 对于ss->ß，让用户手动选择，因为有些词确实需要ss
        // 不自动转换，避免混乱
        
        return converted;
    }

    // 插入字符
    insertCharacter(char) {
        if (!this.currentInputElement) return;
        
        const inputElement = this.currentInputElement;
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const currentValue = inputElement.value;
        
        // 插入字符
        const newValue = currentValue.substring(0, start) + char + currentValue.substring(end);
        inputElement.value = newValue;
        
        // 设置光标位置
        const newPosition = start + char.length;
        inputElement.setSelectionRange(newPosition, newPosition);
        
        // 触发输入事件
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        // 重新获得焦点
        inputElement.focus();
    }

    // 验证输入
    validateInput(inputElement) {
        const value = inputElement.value.trim();
        
        // 移除之前的验证状态
        inputElement.classList.remove('input-valid', 'input-invalid');
        
        if (value.length === 0) {
            return;
        }
        
        // 检查是否包含非德语字符（允许空格、连字符、撇号）
        const germanPattern = /^[a-zA-ZäöüßÄÖÜ\s\-''""‐‑‒–—]+$/;
        if (!germanPattern.test(value)) {
            inputElement.classList.add('input-invalid');
            this.showValidationMessage('请输入有效的德语字符');
        } else {
            inputElement.classList.add('input-valid');
            this.hideValidationMessage();
        }
    }

    // 显示验证消息
    showValidationMessage(message) {
        this.hideValidationMessage();
        
        const messageElement = document.createElement('div');
        messageElement.className = 'validation-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 2000;
            font-family: 'SF Mono', monospace;
        `;
        
        document.body.appendChild(messageElement);
        this.validationMessage = messageElement;
        
        // 3秒后自动消失
        setTimeout(() => {
            this.hideValidationMessage();
        }, 3000);
    }

    // 隐藏验证消息
    hideValidationMessage() {
        if (this.validationMessage) {
            this.validationMessage.remove();
            this.validationMessage = null;
        }
    }

    // 清空输入
    clearInput() {
        if (this.currentInputElement) {
            this.currentInputElement.value = '';
            this.currentInputElement.classList.remove('input-valid', 'input-invalid');
            this.hideValidationMessage();
        }
    }

    // 提交默写
    submitDictation() {
        if (!this.currentInputElement) return;
        
        const value = this.currentInputElement.value.trim();
        if (value.length === 0) return;
        
        // 触发提交事件
        const submitEvent = new CustomEvent('dictationSubmit', {
            detail: { value: value },
            bubbles: true
        });
        
        this.currentInputElement.dispatchEvent(submitEvent);
    }

    // 检查默写答案
    checkDictationAnswer(userInput, correctAnswer) {
        const normalize = (str) => {
            return str.toLowerCase()
                .trim()
                .replace(/\s+/g, ' ') // 标准化空格
                .replace(/['']/g, "'") // 标准化撇号
                .replace(/[""]/g, '"') // 标准化引号
                .replace(/[‐‑‒–—]/g, '-'); // 标准化连字符
        };
        
        const normalizedInput = normalize(userInput);
        const normalizedCorrect = normalize(correctAnswer);
        
        return normalizedInput === normalizedCorrect;
    }

    // 计算相似度（用于部分匹配）
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.calculateEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    // 计算编辑距离
    calculateEditDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // 获取输入统计
    getInputStats() {
        return {
            totalInputs: this.inputHistory.length,
            averageLength: this.inputHistory.length > 0 ? 
                Math.round(this.inputHistory.reduce((sum, input) => sum + input.length, 0) / this.inputHistory.length) : 0,
            germanCharsUsed: this.inputHistory.some(input => 
                /[äöüßÄÖÜ]/.test(input)
            )
        };
    }

    // 重置控制器
    reset() {
        this.currentInputElement = null;
        this.isDictationMode = false;
        this.inputHistory = [];
        this.hideGermanKeyboard();
        this.hideInputHint();
        this.hideValidationMessage();
    }

    // 销毁控制器
    destroy() {
        this.reset();
        if (this.germanKeyboard) {
            this.germanKeyboard.remove();
        }
    }
}

// 导出输入控制器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputController;
}