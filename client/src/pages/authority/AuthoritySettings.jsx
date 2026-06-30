import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Mail, Phone, MapPin, CheckCircle, Save } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AuthoritySettings = () => {
    const { user } = useContext(AuthContext);
    
    // Mock settings state
    const [preferences, setPreferences] = useState({
        emailAlerts: true,
        pushNotifications: true,
        dailySummary: false,
        autoAssign: true
    });
    
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        // Mock save delay
        setTimeout(() => {
            setSaving(false);
            toast.success('Settings updated successfully');
        }, 1000);
    };

    const togglePreference = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-12 w-full max-w-4xl mx-auto"
        >
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings className="text-blue-600" size={32} />
                        Authority Settings
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your official profile and system preferences</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Profile Section */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <User className="text-blue-600" size={24} />
                    <h2 className="text-xl font-black text-slate-900">Official Profile</h2>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-blue-500/20 shrink-0">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="text-slate-900 font-bold bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                    {user?.name || 'Authority Officer'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Official Email</label>
                                <div className="text-slate-900 font-bold bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    {user?.email || 'officer@civicpulse.com'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role / Designation</label>
                                <div className="text-blue-600 font-bold bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex items-center gap-2">
                                    <Shield size={16} />
                                    {user?.role || 'Authority'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Ward</label>
                                <div className="text-slate-900 font-bold bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" />
                                    All Wards
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Preferences Section */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Bell className="text-blue-600" size={24} />
                    <h2 className="text-xl font-black text-slate-900">Notification Preferences</h2>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg">Critical Alert Emails</h4>
                            <p className="text-sm font-medium text-slate-500 mt-1">Receive immediate emails for Critical priority issues.</p>
                        </div>
                        <button 
                            onClick={() => togglePreference('emailAlerts')}
                            className={`w-14 h-8 rounded-full transition-colors relative ${preferences.emailAlerts ? 'bg-blue-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm ${preferences.emailAlerts ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <div className="h-px w-full bg-slate-100"></div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg">Push Notifications</h4>
                            <p className="text-sm font-medium text-slate-500 mt-1">Receive browser notifications for new assignments.</p>
                        </div>
                        <button 
                            onClick={() => togglePreference('pushNotifications')}
                            className={`w-14 h-8 rounded-full transition-colors relative ${preferences.pushNotifications ? 'bg-blue-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm ${preferences.pushNotifications ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <div className="h-px w-full bg-slate-100"></div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg">Daily Summary Report</h4>
                            <p className="text-sm font-medium text-slate-500 mt-1">Receive an email recap of the day's resolved issues.</p>
                        </div>
                        <button 
                            onClick={() => togglePreference('dailySummary')}
                            className={`w-14 h-8 rounded-full transition-colors relative ${preferences.dailySummary ? 'bg-blue-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm ${preferences.dailySummary ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* System Actions */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="bg-red-50 rounded-[2rem] border border-red-100 shadow-sm overflow-hidden"
            >
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="font-black text-red-600 text-xl mb-1">Security Settings</h4>
                        <p className="text-sm font-medium text-red-500/70">Update password or configure two-factor authentication.</p>
                    </div>
                    <button className="bg-white text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors whitespace-nowrap">
                        Change Password
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AuthoritySettings;
