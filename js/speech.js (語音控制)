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
            this.recognition.onerror = (event) => {
                console.error("Speech Error:", event.error);
                if(event.error !== 'no-speech') alert("語音辨識發生錯誤：" + event.error);
                this.resetBtn();
            };
        }
    }

    static toggleMic() {
        if (!this.recognition) {
            alert("抱歉，您的瀏覽器不支援語音輸入功能（建議使用 Chrome 或 Safari）。");
            return;
        }
        const micBtn = document.getElementById('micBtn');
        if (micBtn.innerText.includes('語音輸入')) {
            try {
                this.recognition.start();
                micBtn.innerText = '🔴 聆聽中...';
                micBtn.style.color = '#E07A5F'; 
                micBtn.style.borderColor = '#E07A5F';
            } catch(e) { console.log("麥克風已啟動"); }
        } else {
            this.recognition.stop();
            this.resetBtn();
        }
    }

    static resetBtn() {
        const micBtn = document.getElementById('micBtn');
        micBtn.innerText = '🎤 語音輸入';
        micBtn.style.color = 'var(--accent-wood)';
        micBtn.style.borderColor = 'var(--border-color)';
    }
}
