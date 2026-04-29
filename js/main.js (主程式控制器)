const AppController = {
    async bootstrap() {
        try {
            ChartManager.initGlobalSettings();
            ChartManager.initRadarChart();
            ChartManager.initMixedChart();
            SpeechService.init();

            await this.loadDatabase();

            this.addStage(40, 92, '悶蒸 (Bloom)', '0:30');
            this.addStage(150, 92, '沖煮 (Brew)', '1:15');
            this.addStage(300, 92, '沖煮 (Brew)', '2:00'); 
        } catch (error) {
            console.error("Bootstrap failed:", error);
        }
    },

    async loadDatabase() {
        try {
            const data = await CoffeeApiService.loadInitialData();
            if (data.beans) {
                AppState.globalBeanData = data.beans;
                this.populateSelect('tool', data.equipment || [], "請選擇濾杯");
                this.populateSelect('grinder', data.accessories || [], "請選擇磨豆機");
            }
            
            const list = document.getElementById('beanList');
            list.innerHTML = "";
            AppState.globalBeanData.forEach(item => {
                if(item.name) {
                    const opt = document.createElement('option');
                    opt.value = item.name; opt.dataset.id = item.id; list.appendChild(opt);
                }
                if(item.flavors) { 
                    Utils.extractFlavors(item.flavors).forEach(f => AppState.allUniqueFlavors.add(f)); 
                }
            });
            this.renderSurpriseFlavors(Array.from(AppState.allUniqueFlavors));
        } catch(e) {
            this.renderSurpriseFlavors(Array.from(AppState.allUniqueFlavors));
        }
    },

    populateSelect(selectId, items, placeholder) {
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">${placeholder}</option>`;
        if (items && items.length > 0) { 
            items.forEach(item => { if (item.id && item.name) { select.innerHTML += `<option value="${item.id}">${item.name}</option>`; } }); 
        }
        select.innerHTML += `<option value="other">✎ 其他 (手動輸入)</option>`;
    },

    checkCustomInput(id) {
        const selectElement = document.getElementById(id);
        const customInput = document.getElementById(`${id}-custom`);
        if (selectElement.value === "other") { customInput.style.display = "block"; } 
        else { customInput.style.display = "none"; customInput.value = ""; }
    },

    handleBeanSelect() {
        const inputName = document.getElementById('beanName').value.trim();
        const matchedBean = AppState.globalBeanData.find(b => b.name && b.name.trim() === inputName);
        document.getElementById('beanId').value = matchedBean ? matchedBean.id : "";

        AppState.selectedExpected.clear(); 
        let defaultFlavors = matchedBean && matchedBean.flavors ? Utils.extractFlavors(matchedBean.flavors) : [];
        const expectedArea = document.getElementById('expected-flavors-area');
        expectedArea.innerHTML = "";
        
        if (defaultFlavors.length === 0) { expectedArea.innerHTML = "<span style='color:#A1887F;'>無紀錄風味</span>"; } 
        else { defaultFlavors.forEach(f => expectedArea.appendChild(this.createTagBtn(f, 'expected'))); }

        let surpriseFlavors = Array.from(AppState.allUniqueFlavors).filter(f => !defaultFlavors.includes(f));
        this.renderSurpriseFlavors(surpriseFlavors);
    },

    renderSurpriseFlavors(flavorsArray) {
        const area = document.getElementById('surprise-flavors-area');
        area.innerHTML = "";
        CONFIG.FLAVOR_CATEGORIES.forEach(cat => {
            let catFlavors = flavorsArray.filter(tag => {
                if (!tag || typeof tag !== 'string') return false; 
                let upperTag = tag.toUpperCase();
                if (cat.id === 'other') return !CONFIG.FLAVOR_CATEGORIES.some(c => c.id !== 'other' && c.keywords.some(k => upperTag.includes(k)));
                return cat.keywords.some(k => upperTag.includes(k));
            });
            if (catFlavors.length > 0) {
                const acc = document.createElement('div'); acc.className = 'accordion';
                const head = document.createElement('div'); head.className = 'acc-header';
                head.innerHTML = `<span>${cat.icon} ${cat.name} <span style="font-size:0.9rem; color:#A1887F; font-family:'Times New Roman', serif;">(${catFlavors.length})</span></span> <span style="font-size:0.75rem;">▼</span>`;
                const body = document.createElement('div'); body.className = 'acc-body tags-wrapper';
                catFlavors.forEach(f => body.appendChild(this.createTagBtn(f, 'surprise')));
                head.onclick = () => { 
                    body.classList.toggle('active'); 
                    head.innerHTML = body.classList.contains('active') ? 
                        `<span>${cat.icon} ${cat.name} <span style="font-size:0.9rem; color:#A1887F; font-family:'Times New Roman', serif;">(${catFlavors.length})</span></span> <span style="font-size:0.75rem;">▲</span>` : 
                        `<span>${cat.icon} ${cat.name} <span style="font-size:0.9rem; color:#A1887F; font-family:'Times New Roman', serif;">(${catFlavors.length})</span></span> <span style="font-size:0.75rem;">▼</span>`;
                };
                acc.appendChild(head); acc.appendChild(body); area.appendChild(acc);
            }
        });
    },

    createTagBtn(flavorText, type) {
        const btn = document.createElement('div');
        btn.className = 'flavor-tag'; btn.innerText = flavorText;
        btn.onclick = () => {
            let targetSet = (type === 'expected') ? AppState.selectedExpected : AppState.selectedSurprise;
            if(targetSet.has(flavorText)) { targetSet.delete(flavorText); btn.classList.remove('selected'); } 
            else { targetSet.add(flavorText); btn.classList.add('selected'); }
        };
        return btn;
    },

    addStage(defaultWeight = '', defaultTemp = '', defaultType = '沖煮 (Brew)', defaultTime = '') {
        AppState.stageCounter++;
        const container = document.getElementById('stages-container');
        const stageId = `stage-${Date.now()}`; 
        
        if(!defaultTime) { 
            defaultTime = AppState.stageCounter === 1 ? '0:30' : (AppState.stageCounter === 2 ? '1:15' : (AppState.stageCounter === 3 ? '2:00' : '')); 
        }

        const html = `
            <div class="stage-block" id="${stageId}">
                <div class="stage-header">
                    <div class="stage-title">💧 Stage ${AppState.stageCounter}</div>
                    <div class="stage-remove" onclick="AppController.removeStage('${stageId}')">刪除 / Delete</div>
                </div>
                <div class="grid-3" style="margin-bottom: 5px;">
                    <input type="text" class="inp-time" placeholder="時間(0:30)" value="${defaultTime}" oninput="AppController.notifyChartUpdate()">
                    <input type="number" class="inp-weight" placeholder="注水至(g)" value="${defaultWeight}" oninput="AppController.notifyChartUpdate()">
                    <input type="number" class="inp-temp" placeholder="水溫(°C)" value="${defaultTemp}" oninput="AppController.notifyChartUpdate()" max="100">
                </div>

                <div class="choice-group-label">階段類型 / Stage Type</div>
                <div class="choice-group" data-key="type" data-val="${defaultType}">
                    <div class="choice-btn ${defaultType.includes('悶蒸') ? 'active' : ''}" onclick="AppController.selectChoice(this, '悶蒸 (Bloom)')">悶蒸 (Bloom)</div>
                    <div class="choice-btn ${defaultType.includes('沖煮') ? 'active' : ''}" onclick="AppController.selectChoice(this, '沖煮 (Brew)')">沖煮 (Brew)</div>
                    <div class="choice-btn ${defaultType.includes('浸泡') ? 'active' : ''}" onclick="AppController.selectChoice(this, '浸泡 (Steep)')">浸泡 (Steep)</div>
                </div>
                <div class="choice-group-label">注水力道 / Pouring Force</div>
                <div class="choice-group" data-key="force" data-val="中等 (Medium)">
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '柔和 (Gentle)')">柔和 (Gentle)</div>
                    <div class="choice-btn active" onclick="AppController.selectChoice(this, '中等 (Medium)')">中等 (Medium)</div>
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '強勁 (Strong)')">強勁 (Strong)</div>
                </div>
                <div class="choice-group-label">水量控制 / Flow Rate</div>
                <div class="choice-group" data-key="flow" data-val="中水 (Medium)">
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '小水 (Small)')">小水 (Small)</div>
                    <div class="choice-btn active" onclick="AppController.selectChoice(this, '中水 (Medium)')">中水 (Medium)</div>
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '大水 (Large)')">大水 (Large)</div>
                </div>
                <div class="choice-group-label">注水方式 / Pouring Method</div>
                <div class="choice-group" data-key="method" data-val="繞圈 (Circles)">
                    <div class="choice-btn active" onclick="AppController.selectChoice(this, '繞圈 (Circles)')">繞圈 (Circles)</div>
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '中心點 (Center)')">中心點 (Center)</div>
                    <div class="choice-btn" onclick="AppController.selectChoice(this, '其他 (Others)')">其他 (Others)</div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
        this.notifyChartUpdate(); 
    },

    removeStage(id) {
        document.getElementById(id).remove(); 
        AppState.stageCounter = 0;
        document.querySelectorAll('.stage-block').forEach(block => {
            AppState.stageCounter++; 
            block.querySelector('.stage-title').innerText = `💧 Stage ${AppState.stageCounter}`;
        });
        this.notifyChartUpdate(); 
    },

    selectChoice(btnElement, value) {
        const group = btnElement.parentElement;
        group.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        group.setAttribute('data-val', value);
        this.notifyChartUpdate();
    },

    collectStagesData() {
        let stagesData = [];
        document.querySelectorAll('.stage-block').forEach((block, index) => {
            stagesData.push({
                stage: index + 1, time: block.querySelector('.inp-time').value, weight: block.querySelector('.inp-weight').value, temp: block.querySelector('.inp-temp').value,
                type: block.querySelector('.choice-group[data-key="type"]')?.getAttribute('data-val') || '沖煮 (Brew)',
                force: block.querySelector('.choice-group[data-key="force"]')?.getAttribute('data-val') || '中等 (Medium)',
                flow: block.querySelector('.choice-group[data-key="flow"]')?.getAttribute('data-val') || '中水 (Medium)',
                method: block.querySelector('.choice-group[data-key="method"]')?.getAttribute('data-val') || '繞圈 (Circles)'
            });
        });
        return stagesData;
    },

    notifyChartUpdate() {
        const data = this.collectStagesData();
        ChartManager.updateMixedChart(data);
    },

    async saveRecord() {
        const btn = document.getElementById('saveBtn');
        const beanNameStr = document.getElementById('beanName').value;
        if(!beanNameStr) { alert("請輸入豆名"); return; }
        
        btn.innerText = "儲存中..."; btn.disabled = true;
        
        const pouringStages = this.collectStagesData();
        let pouringStagesText = pouringStages.map(s => 
            `段${s.stage} [${s.time}]: ${s.weight}g, ${s.temp}°C | ${s.type} | ${s.force}, ${s.flow}, ${s.method}`
        ).join('\n');

        const images = ChartManager.getChartImagesBase64();

        const payload = {
            action: "save", title: beanNameStr, date: new Date().toISOString().split('T')[0],
            bean_id: document.getElementById('beanId').value,
            method: document.getElementById('method').value, 
            tool_id: document.getElementById('tool').value === 'other' ? document.getElementById('tool-custom').value : document.getElementById('tool').value,
            grinder_id: document.getElementById('grinder').value === 'other' ? document.getElementById('grinder-custom').value : document.getElementById('grinder').value,
            dose: document.getElementById('dose').value, water: document.getElementById('water').value,
            grind: document.getElementById('grind').value, pouring_stages_text: pouringStagesText, 
            notes: document.getElementById('notes').value, 
            expected_flavors: AppState.selectedExpected.size > 0 ? Array.from(AppState.selectedExpected).join(',') : "無標記",
            surprise_flavors: AppState.selectedSurprise.size > 0 ? Array.from(AppState.selectedSurprise).join(',') : "無標記",
            fragrance: AppState.radarChartScores[0], aroma: AppState.radarChartScores[1], flavor: AppState.radarChartScores[2], aftertaste: AppState.radarChartScores[3],
            acidity: AppState.radarChartScores[4], mouthfeel: AppState.radarChartScores[5], sweetness: AppState.radarChartScores[6], overall: AppState.radarChartScores[7],
            radar_image: images.radar,
            mixed_image: images.mixed
        };

        try {
            await CoffeeApiService.saveRecord(payload);
            alert("✅ 紀錄儲存成功！"); window.location.reload(); 
        } catch(e) { 
            alert("❌ 儲存失敗"); btn.disabled = false; btn.innerText = "記錄這杯咖啡"; 
        }
    }
};

window.onload = () => AppController.bootstrap();
