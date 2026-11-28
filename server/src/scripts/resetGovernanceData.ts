import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User, { AuthorityLevel, Department } from '../modules/user/user.model.js';
import Role, { SYSTEM_PERMISSIONS } from '../modules/role/role.model.js';
import DepartmentModel from '../modules/department/department.model.js';
import SystemSettings from '../modules/settings/systemSettings.model.js';
import Complaint from '../modules/complaint/complaint.model.js';
import { DEPARTMENT_CATEGORY_MAP } from '../utils/departmentMapping.js';

interface SeedAccountSpec {
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'Authority';
    department: Department;
    authorityLevel: AuthorityLevel;
    isAuthorityAdmin: boolean;
    roleSlug: string;
}

const DEFAULT_ROLES = [
    {
        name: 'Master System Admin',
        slug: 'master-system-admin',
        scope: 'Admin' as const,
        description: 'Full platform administrator controlling all departments, roles, users, and system rules.',
        permissions: [...SYSTEM_PERMISSIONS],
        isSystem: true
    },
    {
        name: 'Authority Super Admin',
        slug: 'authority-super-admin',
        scope: 'Authority' as const,
        description: 'Cross-department authority administrator managing every municipal department, staff roster, and task.',
        permissions: [
            'manage_all_departments',
            'manage_departments',
            'manage_members',
            'assign_tasks',
            'resolve_tasks',
            'escalate_tasks',
            'view_analytics'
        ],
        isSystem: true
    },
    {
        name: 'Department HOD',
        slug: 'department-hod',
        scope: 'Authority' as const,
        description: 'Head of Department overseeing all Junior and Senior officials and escalated incidents in their department.',
        permissions: ['manage_members', 'assign_tasks', 'resolve_tasks', 'escalate_tasks', 'view_analytics'],
        isSystem: true
    },
    {
        name: 'Senior Inspector',
        slug: 'senior-inspector',
        scope: 'Authority' as const,
        description: 'Senior official handling escalated incidents and supervising Junior field dispatches.',
        permissions: ['assign_tasks', 'resolve_tasks', 'escalate_tasks', 'view_analytics'],
        isSystem: true
    },
    {
        name: 'Junior Field Officer',
        slug: 'junior-field-officer',
        scope: 'Authority' as const,
        description: 'Frontline municipal officer automatically assigned incoming complaints and resolving field issues.',
        permissions: ['resolve_tasks', 'escalate_tasks'],
        isSystem: true
    }
];

const DEFAULT_DEPARTMENTS = [
    { name: 'Public Works', code: 'PWD', categories: DEPARTMENT_CATEGORY_MAP['Public Works'], description: 'Roads, bridges, potholes, and construction infrastructure.' },
    { name: 'Water & Sanitation', code: 'WSN', categories: DEPARTMENT_CATEGORY_MAP['Water & Sanitation'], description: 'Water supply, drainage, garbage, and illegal dumping.' },
    { name: 'Power', code: 'PWR', categories: DEPARTMENT_CATEGORY_MAP['Power'], description: 'Electrical grid, transformers, and street lighting.' },
    { name: 'Traffic & Safety', code: 'TRF', categories: DEPARTMENT_CATEGORY_MAP['Traffic & Safety'], description: 'Traffic signals, bottlenecks, and road safety.' },
    { name: 'Animal Control', code: 'ANM', categories: DEPARTMENT_CATEGORY_MAP['Animal Control'], description: 'Stray animal welfare and public safety.' },
    { name: 'General Administration', code: 'GEN', categories: DEPARTMENT_CATEGORY_MAP['General Administration'], description: 'Miscellaneous municipal services and coordination.' }
];

const OFFICIAL_ROSTER: SeedAccountSpec[] = [
    {
        name: 'Awanish Verma · Master Admin',
        email: 'admin@civicpulse.gov',
        password: 'Admin@1234',
        role: 'Admin',
        department: 'Master Admin',
        authorityLevel: 'HOD',
        isAuthorityAdmin: true,
        roleSlug: 'master-system-admin'
    },
    {
        name: 'Rajeshwar Nair · Authority Admin',
        email: 'authority.admin@civicpulse.gov',
        password: 'Authority@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'HOD',
        isAuthorityAdmin: true,
        roleSlug: 'authority-super-admin'
    },
    {
        name: 'Awanish Verma · Power',
        email: 'awanish.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Karan Malhotra · Power',
        email: 'karan.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Priya Nair · Power',
        email: 'priya.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Neha Kapoor · Power',
        email: 'neha.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Rohan Joshi · Power',
        email: 'rohan.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Siddharth Rao · Power',
        email: 'siddharth.power@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Vikram Singh · Public Works',
        email: 'vikram.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Ananya Deshmukh · Public Works',
        email: 'ananya.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Rajeev Chawla · Public Works',
        email: 'rajeev.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Deepak Tiwari · Public Works',
        email: 'deepak.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Pooja Chauhan · Public Works',
        email: 'pooja.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Harshvardhan Roy · Public Works',
        email: 'harsh.pwd@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Public Works',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Suresh Iyer · Water & Sanitation',
        email: 'suresh.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Meera Krishnan · Water & Sanitation',
        email: 'meera.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Nandini Kulkarni · Water & Sanitation',
        email: 'nandini.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Amit Patel · Water & Sanitation',
        email: 'amit.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Kavita Yadav · Water & Sanitation',
        email: 'kavita.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Tushar Saini · Water & Sanitation',
        email: 'tushar.water@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Water & Sanitation',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Arjun Rathore · Traffic & Safety',
        email: 'arjun.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Devika Sen · Traffic & Safety',
        email: 'devika.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Gaurav Bhatia · Traffic & Safety',
        email: 'gaurav.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Simran Kaur · Traffic & Safety',
        email: 'simran.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Pranav Mehta · Traffic & Safety',
        email: 'pranav.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Komal Arora · Traffic & Safety',
        email: 'komal.traffic@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Traffic & Safety',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Nitin Kulkarni · Animal Control',
        email: 'nitin.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Shalini Bose · Animal Control',
        email: 'shalini.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Ritu Bansal · Animal Control',
        email: 'ritu.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Aakash Thakur · Animal Control',
        email: 'aakash.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Bhavna Saxena · Animal Control',
        email: 'bhavna.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Varun Menon · Animal Control',
        email: 'varun.animal@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'Animal Control',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Divya Menon · General Administration',
        email: 'divya.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'HOD',
        isAuthorityAdmin: false,
        roleSlug: 'department-hod'
    },
    {
        name: 'Sandeep Khanna · General Administration',
        email: 'sandeep.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'Senior',
        isAuthorityAdmin: false,
        roleSlug: 'senior-inspector'
    },
    {
        name: 'Manish Gupta · General Administration',
        email: 'manish.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Sneha Joshi · General Administration',
        email: 'sneha.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Kunal Sharma · General Administration',
        email: 'kunal.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    },
    {
        name: 'Pallavi Verma · General Administration',
        email: 'pallavi.general@civicpulse.gov',
        password: 'Officer@1234',
        role: 'Authority',
        department: 'General Administration',
        authorityLevel: 'Junior',
        isAuthorityAdmin: false,
        roleSlug: 'junior-field-officer'
    }
];

async function resetGovernanceData() {
    await connectDB();

    const oldOfficials = await User.find({ role: { $in: ['Authority', 'Admin'] } }).select('_id');
    const oldIds = oldOfficials.map((u) => u._id);

    if (oldIds.length > 0) {
        await Complaint.updateMany(
            { assignedTo: { $in: oldIds } },
            { $set: { assignedTo: null } }
        );
    }

    const removedUsers = await User.deleteMany({ role: { $in: ['Authority', 'Admin'] } });
    await Role.deleteMany({});
    await DepartmentModel.deleteMany({});

    const createdRoles = await Role.insertMany(DEFAULT_ROLES);
    const roleMap = new Map(createdRoles.map((r) => [r.slug, r]));

    await DepartmentModel.insertMany(DEFAULT_DEPARTMENTS);

    await SystemSettings.findOneAndUpdate(
        { key: 'global' },
        {
            key: 'global',
            escalationRules: {
                juniorToSeniorDays: 5,
                seniorToHodDays: 14,
                autoAssignEnabled: true
            }
        },
        { upsert: true, new: true }
    );

    const createdAccounts = [];
    for (const spec of OFFICIAL_ROSTER) {
        const matchedRole = roleMap.get(spec.roleSlug);
        const created = await User.create({
            name: spec.name,
            email: spec.email,
            password: spec.password,
            role: spec.role,
            department: spec.department,
            authorityLevel: spec.authorityLevel,
            dutyStatus: 'On Duty',
            isActive: true,
            isBanned: false,
            isAuthorityAdmin: spec.isAuthorityAdmin,
            customRole: matchedRole?._id ?? null,
            permissions: matchedRole?.permissions ?? [],
            anonymousId: User.generateAnonymousId()
        });
        createdAccounts.push({
            name: created.name,
            email: created.email,
            role: created.role,
            department: created.department,
            level: created.authorityLevel,
            authorityAdmin: created.isAuthorityAdmin,
            password: spec.password
        });
    }

    console.log(`Removed old Authority/Admin accounts: ${removedUsers.deletedCount}`);
    console.log(`Seeded roles: ${createdRoles.length}, departments: ${DEFAULT_DEPARTMENTS.length}, officials/admins: ${createdAccounts.length}`);
    console.table(createdAccounts);

    await mongoose.disconnect();
}

resetGovernanceData()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed to reset governance data:', err);
        process.exit(1);
    });
