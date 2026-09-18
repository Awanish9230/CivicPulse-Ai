export const DEPARTMENT_CATEGORY_MAP = {
    'Public Works': ['Road', 'Construction'],
    'Water & Sanitation': ['Water', 'Drainage', 'Garbage', 'Illegal Dumping'],
    'Power': ['Electricity', 'Street Light'],
    'Traffic & Safety': ['Traffic'],
    'Animal Control': ['Animal'],
    'General Administration': ['Others']
};

export const getCategoriesForDepartment = (department) => {
    return DEPARTMENT_CATEGORY_MAP[department] || [];
};
