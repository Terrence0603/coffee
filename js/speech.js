/**
 * 專司自然語言處理的解析器 (Future-Proofing 架構)
 * 支援 6 大維度：粉重、水量、研磨度、注水計畫、雷達圖、詳細筆記
 */
class VoiceCommandParser {
    static dictionary = [
        { keys: ['粉重', '豆重', '咖啡粉'], type: 'input_num', targetId: 'dose' },
        { keys: ['總水量', '水量'], type: 'input_num', targetId: 'water' },
        { keys: ['乾香'], type: 'radar', index: 0 },
        { keys: ['濕香', '溼香'], type: 'radar', index: 1 },
        { keys: ['風味'], type: 'radar', index: 2 },
        { keys: ['尾韻', '餘韻'], type: 'radar', index: 3 },
        { keys: ['酸質', '酸值', '酸度'], type: 'radar', index: 4 },
        { keys: ['口感', '醇厚度'], type: 'radar', index: 5 },
        { keys: ['甜感', '甜度', '甜味'], type: 'radar', index: 6 },
        { keys: ['整體', '總分'], type: 'radar', index: 7 }
    ];

    static parse(transcript) {
        let results = [];
        let logMsgs = [];

        // 1. 一般數值 (粉重、水量、雷達圖)
        this.dictionary.forEach(item => {
            const regexStr = `(${item.keys.join('|')})[^\\d]*([\\d]+(\\.\\d+)?)`;
            const regex = new RegExp(regexStr, 'i');
            const match = transcript.match(regex);
            if (match && match[2]) {
                const value = parseFloat(match[2]);
                results.push({ type: item.type, targetId: item.targetId, index: item.index, value: value });
                logMsgs.push(`${match[1]}:${value}`);
            }
        });

        // 2. 研磨度 (數值或文字) - 例如：「研磨度5.5」、「刻度中粗」
        const grindMatch = transcript.match(/(?:研磨度|刻度)(?:是|為|用)?([\d\.]+|中粗|中細|極細|粗|細|[a-zA-Z\d]+)/);
        if (grindMatch && grindMatch[1]) {
             results.push({ type: 'input_str', targetId: 'grind', value: grindMatch[1] });
             logMsgs.push(`研磨度:${grindMatch[1]}`);
        }

        // 3. 注水計畫 (階段解析)
        // 尋找「第一段...第二段...」區塊
        const stagePattern = /(第[一二三四五1-5]段|階段[一二三四五1-5]).*?(?=(第[一二三四五1-5]段|階段[一二三四五1-5]|筆記|詳細筆記|紀錄|乾香|濕香|溼香|風味|尾韻|酸質|口感|甜感|整體|$))/g;
        const stageBlocks = [...transcript.matchAll(stagePattern)];
        
        if (stageBlocks.length > 0) {
            let stagesData = [];
            stageBlocks.forEach(blockMatch => {
                let blockText = blockMatch[0];
                let timeStr = "";
                
                // 解析時間 (支援 "30秒", "1分15秒", "90秒")
                let minMatch = blockText.match(/(\d+)分/);
                let secMatch = blockText.match(/(\d+)秒/);
                if (minMatch || secMatch) {
                    let m = minMatch ? parseInt(minMatch[1]) : 0;
                    let s = secMatch ? parseInt(secMatch[1]) : 0;
                    if (s >= 60) { m += Math.floor(s / 60); s = s % 60; }
                    timeStr = `${m}:${s.toString().padStart(2, '0')}`;
                }

                // 解析克數與溫度
                let weightMatch = blockText.match(/(\d+)[克g]/i) || blockText.match(/注水(?:到|至)?\s*(\d+)/);
                let weightVal = weightMatch ? weightMatch[1] : "";

                let tempMatch = blockText.match(/(\d+)[度c]/i) || blockText.match(/溫(?:度)?\s*(\d+)/);
                let tempVal = tempMatch ? tempMatch[1] : "";

                if(timeStr || weightVal || tempVal) {
                    stagesData.push({ time: timeStr, weight: weightVal, temp: tempVal });
                }
            });

            if(stagesData.length > 0) {
                results.push({ type: 'stages', data: stagesData });
                logMsgs.push(`注水計畫(${stagesData.length}段)`);
            }
        }

        // 4. 詳細筆記 (抓取「筆記」後面的所有字)
        const noteMatch = transcript.match(/(?:筆記|詳細筆記|紀錄)(?:是|說|寫|為)?(.+)/);
        if (noteMatch && noteMatch[1]) {
            results.push({ type: 'input_str', targetId: 'notes', value: noteMatch[1].trim() });
            logMsgs.push(`筆記已記錄`);
        }

        this.applyResults(results);
        return logMsgs.length > 0 ? `✅ 解析成功: ${logMsgs.join(', ')}` : `🤔 未辨識到參數，請重試`;
    }

    static applyResults(results) {
        results.forEach(res => {
            if (res.type === 'input_num' || res.type === 'input_str') {
                const el = document.getElementById(res.targetId);
                if (el) {
                    if (res.targetId === 'notes') {
                        // 筆記採用附加模式，保留原有內容
                        el.value += (el.value ? '\n' : '') + res.value;
                    } else {
                        el.value = res.value;
                    }
                    this.highlightElement(el);
                }
            } else if (res.type === 'radar') {
                let safeVal = Math.max(1, Math.min(10, res.value));
                const sliderArea = document.getElementById('sliders-area');
                if (sliderArea) {
                    const sliders = sliderArea.querySelectorAll('.slider-input');
                    if (sliders[res.index]) {
                        sliders[res.index].value = safeVal;
                        if (typeof ChartManager !== 'undefined') {
                            ChartManager.updateRadarValue(res.index, safeVal);
                        }
                        this.highlightElement(sliders[res.index].parentElement);
                    }
                }
            } else if (res.type === 'stages') {
                const container = document.getElementById('stages-container');
                if (container && typeof AppController !== 'undefined') {
                    // 語音解析有注水計畫時，清空現有階段，重新生成
                    container.innerHTML = '';
                    AppState.stageCounter = 0;
                    
                    res.data.forEach(stage => {
                        AppController.addStage(stage.weight, stage.temp, '沖煮 (Brew)', stage.time);
                    });
                    this.highlightElement(container);
                }
            }
        });
    }

    static highlightElement(el) {
        el.style.transition = 'background-color 0.3s, transform 0.2s';
        const originalBg = el.style.backgroundColor;
        el.style.backgroundColor = '#FFDCC8'; 
        el.style.transform = 'scale(1.01)';
        setTimeout(() => {
            el.style.backgroundColor = originalBg;
            el.style.transform = 'scale(1)';
        }, 800);
    }
}

/**
 * 智能語音助理服務 (Global Voice Assistant)
 */
class SmartVoiceService {
    static recognition = null;
    static isListening = false;
    
    static init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'zh-TW';
            this.recognition.continuous = false; 
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.showToast(`🗣️ 您說：${transcript}`);
                
                setTimeout(() => {
                    const resultMsg = VoiceCommandParser.parse(transcript);
                    this.showToast(resultMsg, 4000);
                }, 1000);
            };

            this.recognition.onend = () => this.resetBtn();
            this.recognition.onerror = (event) => {
                if(event.error !== 'no-speech') this.showToast("語音辨識發生錯誤：" + event.error);
                this.resetBtn();
            };
        }
    }

    static toggle() {
        if (!this.recognition) {
            this.init();
            if (!this.recognition) {
                alert("抱歉，您的瀏覽器不支援語音輸入功能。");
                return;
            }
        }

        if (!this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                const btn = document.getElementById('smartVoiceBtn');
                const icon = document.getElementById('smartVoiceIcon');
                btn.style.background = 'linear-gradient(135deg, #d32f2f, #9a0007)';
                icon.innerText = '🔴';
                this.showToast("🎧 聆聽指令中...");
            } catch(e) { console.log(e); }
        } else {
            this.recognition.stop();
            this.resetBtn();
        }
    }

    static resetBtn() {
        this.isListening = false;
        const btn = document.getElementById('smartVoiceBtn');
        const icon = document.getElementById('smartVoiceIcon');
        if(btn) btn.style.background = 'linear-gradient(135deg, #E07A5F, #5C3A21)';
        if(icon) icon.innerText = '🎙️';
    }

    static showToast(msg, duration = 3000) {
        const toast = document.getElementById('voiceToast');
        if(!toast) return;
        toast.innerText = msg;
        toast.style.display = 'block';
        
        if(this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.style.display = 'none', duration);
    }
}

/**
 * 舊版局部筆記語音 (保留向下相容)
 */
class SpeechService {
    static recognition = null;
    
    static init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'zh-TW';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const notesArea = document.getElementById('notes');
                notesArea.value += (notesArea.value ? ' ' : '') + transcript;
            };
            this.recognition.onend = () => this.resetBtn();
        }
    }

    static toggleMic() {
        if (!this.recognition) return;
        const micBtn = document.getElementById('micBtn');
        if (micBtn.innerText.includes('筆記語音')) {
            try {
                this.recognition.start();
                micBtn.innerText = '🔴 聆聽中...';
                micBtn.style.color = '#E07A5F'; 
                micBtn.style.borderColor = '#E07A5F';
            } catch(e) { console.log(e); }
        } else {
            this.recognition.stop();
            this.resetBtn();
        }
    }

    static resetBtn() {
        const micBtn = document.getElementById('micBtn');
        if(micBtn) {
            micBtn.innerText = '🎤 筆記語音';
            micBtn.style.color = 'var(--accent-wood)';
            micBtn.style.borderColor = 'var(--border-color)';
        }
    }
}
