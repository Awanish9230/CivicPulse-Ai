import Complaint from '../complaint/complaint.model.js';
import User, { Department } from '../user/user.model.js';
import { DEPARTMENT_CATEGORY_MAP } from '../../utils/departmentMapping.js';

export interface JuniorCandidate {
    _id: { toString(): string };
    name?: string;
    department?: string;
    authorityLevel?: string;
    dutyStatus?: string;
    isActive?: boolean;
    isBanned?: boolean;
    createdAt?: Date;
}

export const getDepartmentForCategory = (category: string): Department => {
    for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORY_MAP)) {
        if (categories.includes(category)) {
            return dept as Department;
        }
    }
    return 'General Administration';
};

export const selectLeastLoadedJuniorOfficial = <T extends JuniorCandidate>(
    candidates: T[],
    activeTaskCounts: Map<string, number>
): T | null => {
    const eligible = candidates.filter(
        (c) => c.isActive !== false && !c.isBanned
    );
    if (eligible.length === 0) return null;

    const onDuty = eligible.filter((c) => !c.dutyStatus || c.dutyStatus === 'On Duty');
    const pool = onDuty.length > 0 ? onDuty : eligible.filter((c) => c.dutyStatus !== 'Off Duty' && c.dutyStatus !== 'On Leave');
    const finalPool = pool.length > 0 ? pool : eligible;

    const sorted = [...finalPool].sort((a, b) => {
        const countA = activeTaskCounts.get(a._id.toString()) ?? 0;
        const countB = activeTaskCounts.get(b._id.toString()) ?? 0;
        if (countA !== countB) {
            return countA - countB;
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
    });

    return sorted[0] ?? null;
};

export const findLeastLoadedJuniorForCategory = async (category: string) => {
    const department = getDepartmentForCategory(category);
    const candidates = await User.find({
        role: 'Authority',
        department,
        authorityLevel: 'Junior',
        isActive: { $ne: false },
        isBanned: { $ne: true }
    })
        .select('_id name department authorityLevel dutyStatus isActive isBanned createdAt')
        .lean();

    if (!candidates || candidates.length === 0) {
        return null;
    }

    const candidateIds = candidates.map((c) => c._id);
    const taskCounts = await Complaint.aggregate<{ _id: unknown; count: number }>([
        {
            $match: {
                assignedTo: { $in: candidateIds },
                status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
            }
        },
        {
            $group: {
                _id: '$assignedTo',
                count: { $sum: 1 }
            }
        }
    ]);

    const countMap = new Map<string, number>();
    for (const row of taskCounts) {
        if (row._id) {
            countMap.set(String(row._id), row.count);
        }
    }

    return selectLeastLoadedJuniorOfficial(candidates, countMap);
};
