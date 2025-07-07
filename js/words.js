// 德语单词数据库
const germanWords = [
    // 基础词汇
    { german: "das Haus", english: "house", chinese: "房子", type: "名词" },
    { german: "der Mann", english: "man", chinese: "男人", type: "名词" },
    { german: "die Frau", english: "woman", chinese: "女人", type: "名词" },
    { german: "das Kind", english: "child", chinese: "孩子", type: "名词" },
    { german: "der Hund", english: "dog", chinese: "狗", type: "名词" },
    { german: "die Katze", english: "cat", chinese: "猫", type: "名词" },
    { german: "das Auto", english: "car", chinese: "汽车", type: "名词" },
    { german: "der Baum", english: "tree", chinese: "树", type: "名词" },
    { german: "das Wasser", english: "water", chinese: "水", type: "名词" },
    { german: "die Schule", english: "school", chinese: "学校", type: "名词" },
    { german: "die Straße", english: "street", chinese: "街道", type: "名词" },
    { german: "weiß", english: "white", chinese: "白色的", type: "形容词" },
    { german: "müssen", english: "must", chinese: "必须", type: "动词" },
    { german: "lassen", english: "to let", chinese: "让", type: "动词" },
    
    // 动词
    { german: "sein", english: "to be", chinese: "是", type: "动词" },
    { german: "haben", english: "to have", chinese: "有", type: "动词" },
    { german: "gehen", english: "to go", chinese: "去", type: "动词" },
    { german: "kommen", english: "to come", chinese: "来", type: "动词" },
    { german: "sehen", english: "to see", chinese: "看", type: "动词" },
    { german: "sprechen", english: "to speak", chinese: "说", type: "动词" },
    { german: "essen", english: "to eat", chinese: "吃", type: "动词" },
    { german: "trinken", english: "to drink", chinese: "喝", type: "动词" },
    { german: "lernen", english: "to learn", chinese: "学习", type: "动词" },
    { german: "arbeiten", english: "to work", chinese: "工作", type: "动词" },
    
    // 形容词
    { german: "gut", english: "good", chinese: "好的", type: "形容词" },
    { german: "schlecht", english: "bad", chinese: "坏的", type: "形容词" },
    { german: "groß", english: "big", chinese: "大的", type: "形容词" },
    { german: "klein", english: "small", chinese: "小的", type: "形容词" },
    { german: "schön", english: "beautiful", chinese: "美丽的", type: "形容词" },
    { german: "alt", english: "old", chinese: "老的", type: "形容词" },
    { german: "jung", english: "young", chinese: "年轻的", type: "形容词" },
    { german: "neu", english: "new", chinese: "新的", type: "形容词" },
    { german: "warm", english: "warm", chinese: "温暖的", type: "形容词" },
    { german: "kalt", english: "cold", chinese: "冷的", type: "形容词" },
    
    // 日常用语
    { german: "hallo", english: "hello", chinese: "你好", type: "问候语" },
    { german: "auf Wiedersehen", english: "goodbye", chinese: "再见", type: "问候语" },
    { german: "danke", english: "thank you", chinese: "谢谢", type: "礼貌用语" },
    { german: "bitte", english: "please", chinese: "请", type: "礼貌用语" },
    { german: "ja", english: "yes", chinese: "是的", type: "基础词汇" },
    { german: "nein", english: "no", chinese: "不", type: "基础词汇" },
    { german: "entschuldigung", english: "excuse me", chinese: "对不起", type: "礼貌用语" },
    { german: "wie", english: "how", chinese: "如何", type: "疑问词" },
    { german: "was", english: "what", chinese: "什么", type: "疑问词" },
    { german: "wo", english: "where", chinese: "哪里", type: "疑问词" },
    
    // 数字
    { german: "eins", english: "one", chinese: "一", type: "数字" },
    { german: "zwei", english: "two", chinese: "二", type: "数字" },
    { german: "drei", english: "three", chinese: "三", type: "数字" },
    { german: "vier", english: "four", chinese: "四", type: "数字" },
    { german: "fünf", english: "five", chinese: "五", type: "数字" },
    { german: "sechs", english: "six", chinese: "六", type: "数字" },
    { german: "sieben", english: "seven", chinese: "七", type: "数字" },
    { german: "acht", english: "eight", chinese: "八", type: "数字" },
    { german: "neun", english: "nine", chinese: "九", type: "数字" },
    { german: "zehn", english: "ten", chinese: "十", type: "数字" }
];

// 导出单词数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = germanWords;
}