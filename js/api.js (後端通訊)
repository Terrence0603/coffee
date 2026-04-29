class CoffeeApiService {
    static async loadInitialData() {
        try {
            const res = await fetch(CONFIG.WEBHOOK_URL, { 
                method: "POST", 
                headers: {"Content-Type": "application/json"}, 
                body: JSON.stringify({ action: "load" }) 
            });
            return await res.json();
        } catch (error) {
            console.error("API Load Error:", error);
            throw error;
        }
    }

    static async saveRecord(payload) {
        try {
            const res = await fetch(CONFIG.WEBHOOK_URL, { 
                method: "POST", 
                headers: {"Content-Type": "application/json"}, 
                body: JSON.stringify(payload) 
            });
            return res;
        } catch (error) {
            console.error("API Save Error:", error);
            throw error;
        }
    }
}
