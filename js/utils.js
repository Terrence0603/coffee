const Utils = {
    parseTimeToSeconds(timeStr) {
        if (!timeStr) return null;
        if (timeStr.includes(':')) { let parts = timeStr.split(':'); return parseInt(parts[0]) * 60 + parseInt(parts[1]); }
        return parseInt(timeStr);
    },
    extractFlavors(rawFlavors) {
        if (!rawFlavors) return [];
        let parsed = [];
        let arr = Array.isArray(rawFlavors) ? rawFlavors.flat() : [rawFlavors];
        arr.forEach(f => {
            if (typeof f === 'object' && f !== null && f.name) { f.name.toString().split(',').forEach(s => { if(s.trim()) parsed.push(s.trim()); }); } 
            else if (typeof f === 'string') { f.split(',').forEach(s => { if(s.trim()) parsed.push(s.trim()); }); }
        });
        return parsed.filter(Boolean); 
    }
};
