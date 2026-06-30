const fs = require('fs');
const path = require('path');

const pages = [
    { file: 'ManageDepartments.jsx', name: 'ManageDepartments', title: 'Department Management', icon: 'Building2', desc: 'Manage municipal departments and assignments.' },
    { file: 'ManageLocations.jsx', name: 'ManageLocations', title: 'Location Management', icon: 'Map', desc: 'Configure geographical zones and wards.' },
    { file: 'ManageCategories.jsx', name: 'ManageCategories', title: 'Complaint Categories', icon: 'Tag', desc: 'Define and organize complaint categories.' },
    { file: 'AdminTasks.jsx', name: 'AdminTasks', title: 'Task Management', icon: 'CheckSquare', desc: 'Monitor and assign system-wide tasks.' },
    { file: 'AdminCommunity.jsx', name: 'AdminCommunity', title: 'Community Moderation', icon: 'MessageSquare', desc: 'Moderate citizen forums and discussions.' },
    { file: 'AdminFeedback.jsx', name: 'AdminFeedback', title: 'Citizen Feedback', icon: 'MessageCircle', desc: 'Review feedback and satisfaction scores.' },
    { file: 'AdminNotifications.jsx', name: 'AdminNotifications', title: 'Notifications', icon: 'Bell', desc: 'View and manage system notifications.' },
    { file: 'AdminReports.jsx', name: 'AdminReports', title: 'Data Reports', icon: 'FileText', desc: 'Generate and export system reports.' },
    { file: 'SecurityCenter.jsx', name: 'SecurityCenter', title: 'Security Center', icon: 'ShieldAlert', desc: 'Monitor security alerts and access logs.' },
    { file: 'DatabaseManager.jsx', name: 'DatabaseManager', title: 'Database Metrics', icon: 'Database', desc: 'Monitor database health and storage.' },
    { file: 'APIManager.jsx', name: 'APIManager', title: 'API Management', icon: 'Webhook', desc: 'Manage API keys and webhooks.' },
    { file: 'Integrations.jsx', name: 'Integrations', title: 'Integrations', icon: 'Link', desc: 'Configure third-party service integrations.' },
    { file: 'Backups.jsx', name: 'Backups', title: 'System Backups', icon: 'History', desc: 'Trigger manual backups and view history.' },
    { file: 'AdminSettings.jsx', name: 'AdminSettings', title: 'Global Settings', icon: 'Settings', desc: 'Configure system-wide parameters.' }
];

const targetDir = path.join(__dirname, 'client', 'src', 'pages', 'admin');

pages.forEach(p => {
    const content = `import React from 'react';
import { ${p.icon} } from 'lucide-react';

const ${p.name} = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <${p.icon} className="text-orange-600" size={32} />
                        ${p.title}
                    </h1>
                    <p className="text-slate-500 mt-1">${p.desc}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                <div className="w-24 h-24 mx-auto bg-orange-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner shadow-orange-100 border border-orange-100">
                    <${p.icon} className="text-orange-500" size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">Module Under Construction</h2>
                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                    The <strong>${p.title}</strong> module is currently being built and will be available in the upcoming release.
                </p>
                <div className="mt-8 flex justify-center">
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold tracking-widest uppercase">Coming Soon</span>
                </div>
            </div>
        </div>
    );
};

export default ${p.name};
`;
    fs.writeFileSync(path.join(targetDir, p.file), content);
    console.log(`Created ${p.file}`);
});
