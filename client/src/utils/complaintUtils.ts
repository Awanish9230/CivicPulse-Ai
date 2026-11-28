export const getPriorityColor = (priority?: string, withBorder: boolean = false): string => {
    switch (priority) {
        case 'Critical':
            return withBorder ? 'text-red-600 bg-red-100 border-red-200' : 'text-red-600 bg-red-100';
        case 'High':
            return withBorder ? 'text-orange-600 bg-orange-100 border-orange-200' : 'text-orange-600 bg-orange-100';
        case 'Medium':
            return withBorder ? 'text-yellow-600 bg-yellow-100 border-yellow-200' : 'text-yellow-600 bg-yellow-100';
        case 'Low':
            return withBorder ? 'text-green-600 bg-green-100 border-green-200' : 'text-green-600 bg-green-100';
        default:
            return withBorder ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-slate-600 bg-slate-100';
    }
};

export const getDepartmentForCategory = (category: string): string | undefined => {
    switch (category) {
        case 'Road':
        case 'Construction':
            return 'Public Works';
        case 'Electricity':
        case 'Street Light':
            return 'Power';
        case 'Garbage':
        case 'Water':
        case 'Drainage':
        case 'Illegal Dumping':
            return 'Water & Sanitation';
        case 'Traffic':
            return 'Traffic & Safety';
        case 'Animal':
            return 'Animal Control';
        case 'Others':
            return 'General Administration';
        default:
            return undefined;
    }
};
