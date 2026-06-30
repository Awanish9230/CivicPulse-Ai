import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, HardDrive, Cpu, Search } from 'lucide-react';

const AdminMonitor = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="text-indigo-600" size={32} />
                        System Monitor
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time infrastructure health and server statistics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
                    <Server className="text-indigo-400 mb-4" size={32} />
                    <h3 className="text-lg font-bold">API Latency</h3>
                    <p className="text-3xl font-black mt-2 text-indigo-400">45<span className="text-lg text-slate-400">ms</span></p>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
                    <Cpu className="text-emerald-400 mb-4" size={32} />
                    <h3 className="text-lg font-bold">CPU Usage</h3>
                    <p className="text-3xl font-black mt-2 text-emerald-400">12<span className="text-lg text-slate-400">%</span></p>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
                    <HardDrive className="text-amber-400 mb-4" size={32} />
                    <h3 className="text-lg font-bold">Memory Load</h3>
                    <p className="text-3xl font-black mt-2 text-amber-400">2.4<span className="text-lg text-slate-400">GB</span></p>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
                    <Database className="text-rose-400 mb-4" size={32} />
                    <h3 className="text-lg font-bold">DB Connections</h3>
                    <p className="text-3xl font-black mt-2 text-rose-400">1,024</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-64 flex items-center justify-center text-slate-400 font-medium border-dashed border-2">
                Server Traffic Graph Placeholder
            </div>
        </div>
    );
};

export default AdminMonitor;
