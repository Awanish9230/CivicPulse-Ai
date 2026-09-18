import React from 'react';
import { ClipboardList, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ClipboardList className="text-indigo-600" size={32} />
                        Audit Logs
                    </h1>
                    <p className="text-slate-500 mt-1">Track every action taken within the Super Admin Panel.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
                        <Filter size={18} />
                        Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search logs by action or user..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Performed By</th>
                                <th className="px-6 py-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-500">2026-06-30 14:02:10</td>
                                <td className="px-6 py-4 font-bold text-slate-800">Assigned Department to Rahul Verma</td>
                                <td className="px-6 py-4">SuperAdmin (ID: 1)</td>
                                <td className="px-6 py-4 font-mono text-xs">192.168.1.1</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-500">2026-06-30 13:45:00</td>
                                <td className="px-6 py-4 font-bold text-slate-800">Generated AI Insights</td>
                                <td className="px-6 py-4">SuperAdmin (ID: 1)</td>
                                <td className="px-6 py-4 font-mono text-xs">192.168.1.1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
