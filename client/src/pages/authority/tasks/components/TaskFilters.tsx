import React from 'react';
import { Search } from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';

interface TaskFiltersProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    filterPriority: string;
    setFilterPriority: (val: string) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search tasks by ID or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
            </div>
            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                <CustomSelect
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: 'All', label: 'All Statuses' },
                        { value: 'Submitted', label: 'Submitted' },
                        { value: 'Verified', label: 'Verified' },
                        { value: 'In Progress', label: 'In Progress' },
                        { value: 'Resolved', label: 'Resolved' }
                    ]}
                    className="flex-1 min-w-[140px] md:w-40 md:flex-none bg-slate-50"
                />
                <CustomSelect
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    options={[
                        { value: 'All', label: 'All Priorities' },
                        { value: 'Critical', label: 'Critical' },
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' }
                    ]}
                    className="flex-1 min-w-[140px] md:w-40 md:flex-none bg-slate-50"
                />
                <CustomSelect
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    options={[
                        { value: 'All', label: 'All Categories' },
                        { value: 'Road', label: 'Road' },
                        { value: 'Water', label: 'Water' },
                        { value: 'Electricity', label: 'Electricity' },
                        { value: 'Garbage', label: 'Garbage' }
                    ]}
                    className="flex-1 min-w-[140px] md:w-40 md:flex-none bg-slate-50"
                />
                <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                <CustomSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                        { value: 'Newest', label: 'Newest First' },
                        { value: 'Oldest', label: 'Oldest First' },
                        { value: 'Priority (High)', label: 'Highest Priority' }
                    ]}
                    className="flex-1 min-w-[140px] md:w-40 md:flex-none bg-slate-50"
                />
            </div>
        </div>
    );
};

export default TaskFilters;
