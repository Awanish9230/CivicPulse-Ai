import os from 'os';

export const getSystemStatus = (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        const systemStatus = {
            uptime: process.uptime(),
            cpuCount: os.cpus().length,
            loadAvg: os.loadavg(),
            memory: {
                total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usagePercentage: ((usedMem / totalMem) * 100).toFixed(2) + '%'
            },
            platform: os.platform(),
            nodeVersion: process.version
        };

        res.status(200).json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system status',
            error: error.message
        });
    }
};
