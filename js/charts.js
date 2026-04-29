class ChartManager {
    static radarChartInstance = null;
    static mixedChartInstance = null;

    static customCanvasBackgroundColor = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#FCFAF8';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };

    static initGlobalSettings() {
        Chart.defaults.font.family = "'Times New Roman', 'Noto Serif TC', serif";
        Chart.defaults.color = "#6F4E37";
        Chart.register(ChartDataLabels);
        Chart.defaults.plugins.datalabels.display = false;
    }

    static initRadarChart() {
        const ctx = document.getElementById('radarChart').getContext('2d');
        let initialLabels = ['乾香','溼香','風味','尾韻','酸質','口感','甜感','整體'].map(l => l + ' 5.0');
        this.radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: { 
                labels: initialLabels, 
                datasets: [{ 
                    data: AppState.radarChartScores, 
                    backgroundColor: 'rgba(92, 58, 33, 0.25)', borderColor: '#5C3A21', 
                    pointBackgroundColor: '#FFF', pointBorderColor: '#5C3A21', borderWidth: 2 
                }] 
            },
            plugins: [this.customCanvasBackgroundColor], 
            options: { 
                devicePixelRatio: 3, responsive: true, maintainAspectRatio: false, 
                scales: { r: { min: 1, max: 10, ticks: { stepSize: 2, display: false }, grid: { color: '#D7C4B7' }, angleLines: { color: '#D7C4B7' }, pointLabels: { font: { size: 14, weight: '700' } } } }, 
                plugins: { legend: { display: false } } 
            }
        });
        this.renderRadarSliders();
    }

    static renderRadarSliders() {
        const area = document.getElementById('sliders-area');
        const sliderLabels = ['乾香 (Fragrance)','溼香 (Aroma)','風味 (Flavor)','尾韻 (Aftertaste)','酸質 (Acidity)','口感 (Body)','甜感 (Sweetness)','整體 (Overall)'];
        sliderLabels.forEach((label, i) => {
            area.insertAdjacentHTML('beforeend', `<div class="slider-row"><span class="slider-label">${label}</span><input type="range" class="slider-input" min="1" max="10" step="0.5" value="5" oninput="ChartManager.updateRadarValue(${i}, this.value)"><span class="slider-val" id="val-${i}">5.0</span></div>`);
        });
    }

    static updateRadarValue(index, val) {
        if(!this.radarChartInstance) return;
        let numVal = parseFloat(val).toFixed(1);
        document.getElementById(`val-${index}`).innerText = numVal;
        
        AppState.radarChartScores[index] = val;
        this.radarChartInstance.data.datasets[0].data[index] = val;
        
        let baseLabels = ['乾香','溼香','風味','尾韻','酸質','口感','甜感','整體'];
        this.radarChartInstance.data.labels[index] = baseLabels[index] + ' ' + numVal;
        this.radarChartInstance.update();
    }

    static initMixedChart() {
        const ctx = document.getElementById('mixedChart').getContext('2d');
        this.mixedChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                datasets: [
                    { type: 'line', label: '水溫 / Temp (°C)', data: [], yAxisID: 'yTemp', borderColor: '#E07A5F', backgroundColor: '#FFF', borderWidth: 3, fill: false, pointBackgroundColor: '#FFF', pointRadius: (ctx) => (ctx.dataIndex % 4 === 1) ? 0 : 5, pointBorderWidth: (ctx) => (ctx.dataIndex % 4 === 1) ? 0 : 2, spanGaps: false, clip: false },
                    { type: 'line', label: '累積水量 / Total Water (g)', data: [{x: 0, y: 0}], yAxisID: 'yWater', borderColor: '#5C3A21', backgroundColor: 'rgba(92, 58, 33, 0.15)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#FFF', pointBorderColor: '#5C3A21', pointRadius: 4, clip: false }
                ]
            },
            plugins: [this.customCanvasBackgroundColor],
            options: {
                devicePixelRatio: 3, responsive: true, maintainAspectRatio: false, layout: { padding: { top: 60, left: 15, right: 15 } }, 
                scales: {
                    x: { type: 'linear', title: { display: true, text: '時間 / Time (秒 Seconds)', color: '#A1887F', font: {size: 11} }, grid: { color: '#EFEBE9' }, min: 0, offset: false, ticks: { stepSize: 10, color: '#6F4E37', font: { family: "'Times New Roman', serif" } } },
                    yWater: { type: 'linear', position: 'left', title: { display: true, text: '累積水量 / Total Water (g)', color: '#A1887F', font: {size: 11} }, min: 0, beginAtZero: true, grid: { color: '#EFEBE9' }, ticks: { color: '#6F4E37', font: { family: "'Times New Roman', serif" } } },
                    yTemp: { type: 'linear', position: 'right', title: { display: true, text: '水溫 / Temp (°C)', color: '#E07A5F', font: {size: 11} }, min: 70, max: 100, grid: { drawOnChartArea: false }, ticks: { stepSize: 5, color: '#E07A5F', font: { family: "'Times New Roman', serif" } } }
                },
                plugins: { 
                    legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
                    datalabels: {
                        display: (context) => context.datasetIndex === 0 && context.dataIndex % 4 === 1 && context.dataset.data[context.dataIndex] && context.dataset.data[context.dataIndex].y !== null,
                        align: 'top', offset: 6, color: '#E07A5F', font: { weight: 'bold', size: 12, family: "'Times New Roman', serif" },
                        formatter: (value) => value && value.y ? value.y + '°' : ''
                    }
                }
            }
        });
    }

    static updateMixedChart(stagesData) {
        if(!this.mixedChartInstance) return;
        let waterData = [{x: 0, y: 0}];
        let tempData = []; 
        let prevWater = 0; let prevSeconds = 0; let cumulativeSeconds = 0; 

        stagesData.forEach((stage) => {
            let seconds = Utils.parseTimeToSeconds(stage.time.trim());
            if (seconds === null || isNaN(seconds)) { cumulativeSeconds += 30; seconds = cumulativeSeconds; } else { cumulativeSeconds = seconds; }
            let weightVal = parseFloat(stage.weight) || prevWater;
            let tempVal = parseFloat(stage.temp) || null;

            if (weightVal > 0) {
                waterData.push({ x: seconds, y: weightVal });
                if (tempVal !== null) { 
                    tempData.push({ x: prevSeconds, y: tempVal });             
                    tempData.push({ x: (prevSeconds + seconds) / 2, y: tempVal }); 
                    tempData.push({ x: seconds, y: tempVal });                 
                    tempData.push({ x: seconds, y: null });                    
                }
                prevWater = weightVal;
            }
            prevSeconds = seconds; 
        });
        this.mixedChartInstance.data.datasets[0].data = tempData; 
        this.mixedChartInstance.data.datasets[1].data = waterData; 
        this.mixedChartInstance.update();
    }

    static getChartImagesBase64() {
        return {
            radar: this.radarChartInstance ? this.radarChartInstance.toBase64Image() : null,
            mixed: this.mixedChartInstance ? this.mixedChartInstance.toBase64Image() : null
        };
    }
    }
}
