import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import Complaint from '../src/modules/complaint/complaint.model.js';
import User from '../src/modules/user/user.model.js';
import SystemSettings from '../src/modules/settings/systemSettings.model.js';
import {
    getDepartmentForCategory,
    selectLeastLoadedJuniorOfficial,
    JuniorCandidate
} from '../src/modules/authority/autoAssign.service.js';
import { runEscalationSweep } from '../src/utils/escalationCron.js';
import {
    assignAdminTask,
    generateTemporaryPassword,
    resetMemberPasswordOneClick,
    toggleMemberStatus,
    updateEscalationSettings
} from '../src/modules/admin/admin.service.js';
import {
    deleteEnvVariable,
    listEnvVariables,
    upsertEnvVariable
} from '../src/modules/admin/envManager.service.js';
import { changeOwnPassword, rotateAnonymousId, updateOwnProfile } from '../src/modules/user/user.service.js';
import type { AuthenticatedUser } from '../src/types/express.js';

const oid = (hex: string) => new mongoose.Types.ObjectId(hex);

afterEach(() => {
    mock.restoreAll();
});

describe('Department Auto-Assignment (Junior Load Balancing)', () => {
    it('maps complaint categories to municipal departments', () => {
        assert.equal(getDepartmentForCategory('Electricity'), 'Power');
        assert.equal(getDepartmentForCategory('Road'), 'Public Works');
        assert.equal(getDepartmentForCategory('Garbage'), 'Water & Sanitation');
    });

    it('assigns to the On Duty junior with 0 or fewest open tasks', () => {
        const candidates: JuniorCandidate[] = [
            {
                _id: oid('65f000000000000000000001'),
                name: 'Busy Junior · Power',
                dutyStatus: 'On Duty',
                isActive: true,
                isBanned: false,
                createdAt: new Date('2026-01-01T00:00:00Z')
            },
            {
                _id: oid('65f000000000000000000002'),
                name: 'Zero-Task Junior · Power',
                dutyStatus: 'On Duty',
                isActive: true,
                isBanned: false,
                createdAt: new Date('2026-01-02T00:00:00Z')
            },
            {
                _id: oid('65f000000000000000000003'),
                name: 'Off-Duty Zero · Power',
                dutyStatus: 'Off Duty',
                isActive: true,
                isBanned: false,
                createdAt: new Date('2026-01-01T00:00:00Z')
            }
        ];

        const counts = new Map<string, number>([
            ['65f000000000000000000001', 4],
            ['65f000000000000000000002', 0],
            ['65f000000000000000000003', 0]
        ]);

        const selected = selectLeastLoadedJuniorOfficial(candidates, counts);
        assert.equal(selected?._id.toString(), '65f000000000000000000002');
    });

    it('ignores disabled or blocked candidates and falls back cleanly when On Duty is absent', () => {
        const candidates: JuniorCandidate[] = [
            {
                _id: oid('65f000000000000000000011'),
                name: 'Disabled Zero · Water',
                dutyStatus: 'On Duty',
                isActive: false,
                isBanned: false
            },
            {
                _id: oid('65f000000000000000000012'),
                name: 'Blocked Zero · Water',
                dutyStatus: 'On Duty',
                isActive: true,
                isBanned: true
            },
            {
                _id: oid('65f000000000000000000013'),
                name: 'Busy Marked · Water',
                dutyStatus: 'Busy',
                isActive: true,
                isBanned: false
            }
        ];

        const counts = new Map<string, number>([['65f000000000000000000013', 2]]);
        const selected = selectLeastLoadedJuniorOfficial(candidates, counts);
        assert.equal(selected?._id.toString(), '65f000000000000000000013');
    });
});

describe('Configurable Escalation Sweep (5-Day & 14-Day Rules)', () => {
    it('escalates stale Junior complaints using configured 5d Senior / 14d HOD thresholds', async () => {
        const now = new Date('2026-11-28T12:00:00Z');
        let savedJuniorCount = 0;
        let savedHodCount = 0;

        const staleJuniorDoc = {
            _id: oid('65f100000000000000000001'),
            escalationLevel: 'Junior',
            lastActivityAt: new Date('2026-11-22T00:00:00Z'),
            officialReplies: [] as Array<{ authorityName: string; content: string }>,
            save: async () => {
                savedJuniorCount += 1;
            }
        };

        const staleSeniorDoc = {
            _id: oid('65f100000000000000000002'),
            escalationLevel: 'Senior',
            lastActivityAt: new Date('2026-11-10T00:00:00Z'),
            officialReplies: [] as Array<{ authorityName: string; content: string }>,
            save: async () => {
                savedHodCount += 1;
            }
        };

        let findCall = 0;
        const capturedQueries: Array<Record<string, unknown>> = [];
        mock.method(Complaint, 'find', async (query: Record<string, unknown>) => {
            capturedQueries.push(query);
            findCall += 1;
            return findCall === 1 ? [staleJuniorDoc] : [staleSeniorDoc];
        });

        const summary = await runEscalationSweep(now, { juniorToSeniorDays: 5, seniorToHodDays: 14 });

        assert.equal(summary.juniorToSeniorDays, 5);
        assert.equal(summary.seniorToHodDays, 14);
        assert.equal(summary.escalatedToSenior, 1);
        assert.equal(summary.escalatedToHod, 1);
        assert.equal(savedJuniorCount, 1);
        assert.equal(savedHodCount, 1);
        assert.equal(staleJuniorDoc.escalationLevel, 'Senior');
        assert.equal(staleSeniorDoc.escalationLevel, 'HOD');
        assert.ok(staleJuniorDoc.officialReplies[0].content.includes('5 days'));
        assert.ok(staleSeniorDoc.officialReplies[0].content.includes('14 days'));

        const expectedJuniorCutoff = now.getTime() - 5 * 24 * 60 * 60 * 1000;
        const expectedHodCutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
        assert.equal((capturedQueries[0].lastActivityAt as { $lt: Date }).$lt.getTime(), expectedJuniorCutoff);
        assert.equal((capturedQueries[1].createdAt as { $lt: Date }).$lt.getTime(), expectedHodCutoff);
    });

    it('rejects invalid escalation settings where HOD <= Senior days', async () => {
        const settingsDoc = {
            key: 'global',
            escalationRules: {
                juniorToSeniorDays: 5,
                seniorToHodDays: 14,
                autoAssignEnabled: true
            },
            save: async () => settingsDoc
        };

        mock.method(SystemSettings, 'findOne', async () => settingsDoc);

        await assert.rejects(
            () => updateEscalationSettings({ juniorToSeniorDays: 10, seniorToHodDays: 8 }),
            /HOD escalation days must be greater than Senior escalation days/
        );
    });
});

describe('Admin Account Controls, 1-Click Reset & Task Guardrails', () => {
    it('prevents an admin from disabling or blocking their own account', async () => {
        const selfId = '65f200000000000000000001';
        await assert.rejects(
            () => toggleMemberStatus(selfId, { isActive: false }, selfId),
            /cannot disable or block your own/i
        );
    });

    it('toggles isActive/isBanned and invalidates refreshToken when disabled', async () => {
        const targetId = '65f200000000000000000002';
        const actorId = '65f200000000000000000099';
        let saved = false;

        const targetDoc = {
            _id: oid(targetId),
            isActive: true,
            isBanned: false,
            banUntil: new Date('2026-12-01T00:00:00Z') as Date | null,
            refreshToken: 'active-token-123' as string | undefined,
            save: async () => {
                saved = true;
            }
        };

        let callCount = 0;
        mock.method(User, 'findById', (id: string) => {
            callCount += 1;
            if (callCount === 1) {
                return Promise.resolve(targetDoc);
            }
            return {
                populate: () => ({
                    select: async () => ({
                        _id: oid(id),
                        isActive: targetDoc.isActive,
                        isBanned: targetDoc.isBanned
                    })
                })
            };
        });

        const updated = (await toggleMemberStatus(
            targetId,
            { isActive: false, isBanned: true },
            actorId
        )) as { isActive: boolean; isBanned: boolean };

        assert.equal(saved, true);
        assert.equal(targetDoc.refreshToken, undefined);
        assert.equal(updated.isActive, false);
        assert.equal(updated.isBanned, true);
    });

    it('generates temporary password and performs 1-click reset cleanly', async () => {
        const temp = generateTemporaryPassword();
        assert.match(temp, /^Civic@[A-F0-9]{8}$/);

        const targetId = '65f200000000000000000003';
        let saved = false;
        const userDoc = {
            _id: oid(targetId),
            name: 'Awanish Verma · Power',
            email: 'awanish.power@civicpulse.gov.in',
            anonymousId: 'AUTH-PWR-01',
            password: 'old-password-hash',
            refreshToken: 'refresh-abc' as string | undefined,
            save: async () => {
                saved = true;
            }
        };

        mock.method(User, 'findById', async () => userDoc);

        const result = await resetMemberPasswordOneClick(targetId);
        assert.equal(saved, true);
        assert.equal(userDoc.refreshToken, undefined);
        assert.match(result.temporaryPassword, /^Civic@[A-F0-9]{8}$/);
        assert.equal(userDoc.password, result.temporaryPassword);
    });

    it('rejects assigning a task to a disabled or blocked official', async () => {
        const complaintId = '65f300000000000000000001';
        const disabledOfficialId = '65f200000000000000000004';
        const actor = { _id: oid('65f200000000000000000099'), name: 'Super Admin' } as unknown as AuthenticatedUser;

        mock.method(Complaint, 'findById', async () => ({
            _id: oid(complaintId),
            status: 'Verified',
            officialReplies: []
        }));

        mock.method(User, 'findById', async () => ({
            _id: oid(disabledOfficialId),
            role: 'Authority',
            isActive: false,
            isBanned: false
        }));

        await assert.rejects(
            () => assignAdminTask(complaintId, disabledOfficialId, actor),
            /disabled or blocked official/i
        );
    });

    it('rejects assigning an Electricity issue to an official from another department', async () => {
        const complaintId = '65f300000000000000000002';
        const wrongDeptOfficialId = '65f200000000000000000005';
        const actor = { _id: oid('65f200000000000000000099'), name: 'Super Admin' } as unknown as AuthenticatedUser;

        mock.method(Complaint, 'findById', async () => ({
            _id: oid(complaintId),
            category: 'Electricity',
            status: 'Verified',
            officialReplies: []
        }));

        mock.method(User, 'findById', async () => ({
            _id: oid(wrongDeptOfficialId),
            role: 'Authority',
            department: 'Public Works',
            isActive: true,
            isBanned: false
        }));

        await assert.rejects(
            () => assignAdminTask(complaintId, wrongDeptOfficialId, actor),
            /Electricity issues can only be assigned to Power officials/i
        );
    });
});

describe('Admin Environment (.env) Manager', () => {
    it('lists, adds, updates, masks secrets, validates keys, and deletes variables in isolated env file', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'civicpulse-env-'));
        const tempEnvPath = path.join(tmpDir, '.env');
        await fs.writeFile(tempEnvPath, '# Existing comment\nPORT=5000\nJWT_SECRET=supersecret12345\n', 'utf8');

        const initial = await listEnvVariables(tempEnvPath);
        assert.equal(initial.variables.length, 2);
        const secretEntry = initial.variables.find((v) => v.key === 'JWT_SECRET');
        assert.equal(secretEntry?.isSecret, true);
        assert.equal(secretEntry?.restartRecommended, true);
        assert.ok(secretEntry?.maskedValue.includes('•'));

        await upsertEnvVariable('custom_feature_flag', 'enabled with spaces', tempEnvPath);
        const afterAdd = await listEnvVariables(tempEnvPath);
        const added = afterAdd.variables.find((v) => v.key === 'CUSTOM_FEATURE_FLAG');
        assert.equal(added?.value, 'enabled with spaces');
        assert.equal(process.env.CUSTOM_FEATURE_FLAG, 'enabled with spaces');

        await assert.rejects(
            () => upsertEnvVariable('BAD KEY=INJECT', 'val', tempEnvPath),
            /Environment variable key must start with/i
        );

        await deleteEnvVariable('CUSTOM_FEATURE_FLAG', tempEnvPath);
        const afterDelete = await listEnvVariables(tempEnvPath);
        assert.equal(afterDelete.variables.some((v) => v.key === 'CUSTOM_FEATURE_FLAG'), false);
        assert.equal(process.env.CUSTOM_FEATURE_FLAG, undefined);

        const rawFinal = await fs.readFile(tempEnvPath, 'utf8');
        assert.ok(rawFinal.includes('# Existing comment'));

        await fs.rm(tmpDir, { recursive: true, force: true });
    });
});

describe('Non-Anonymous Authority & Admin Identity Guard', () => {
    it('strictly blocks identity rotation for both Authority and Admin accounts', async () => {
        const authorityUser = {
            _id: oid('65f400000000000000000001'),
            role: 'Authority',
            anonymousId: 'AUTH-PWR-01'
        } as unknown as AuthenticatedUser;

        const adminUser = {
            _id: oid('65f400000000000000000002'),
            role: 'Admin',
            anonymousId: 'ADMIN-01'
        } as unknown as AuthenticatedUser;

        await assert.rejects(
            () => rotateAnonymousId(authorityUser),
            /strictly restricted to Citizen accounts/i
        );
        await assert.rejects(
            () => rotateAnonymousId(adminUser),
            /strictly restricted to Citizen accounts/i
        );
    });
});

describe('Self-Service Profile Update & Password Change', () => {
    it('allows Admin/Authority to edit name, email, phone, bio, dutyStatus without escalating privileges', async () => {
        const userId = oid('65f500000000000000000001');
        const actor = {
            _id: userId,
            role: 'Authority',
            anonymousId: 'AUTH-PWR-01'
        } as unknown as AuthenticatedUser;

        const userDoc = {
            _id: userId,
            role: 'Authority',
            email: 'old@civicpulse.gov',
            name: 'Old Name · Power',
            phone: '',
            bio: '',
            dutyStatus: 'On Duty',
            lastSeenAt: new Date(),
            save: async () => undefined
        };

        let findByIdCount = 0;
        mock.method(User, 'findById', () => {
            findByIdCount += 1;
            if (findByIdCount === 1) {
                return Promise.resolve(userDoc);
            }
            return {
                populate: () => ({
                    select: () => ({
                        lean: async () => ({
                            _id: userId,
                            role: userDoc.role,
                            email: userDoc.email,
                            name: userDoc.name,
                            phone: userDoc.phone,
                            bio: userDoc.bio,
                            dutyStatus: userDoc.dutyStatus
                        })
                    })
                })
            };
        });
        mock.method(User, 'findOne', async () => null);

        const updated = (await updateOwnProfile(actor, {
            name: 'Awanish Verma · Power',
            email: 'awanish.updated@civicpulse.gov',
            phone: '+91 9999988888',
            bio: 'Head of Electrical Grid',
            dutyStatus: 'Busy',
            role: 'Admin'
        } as unknown as Parameters<typeof updateOwnProfile>[1])) as {
            role: string;
            name: string;
            email: string;
            phone: string;
            bio: string;
            dutyStatus: string;
        };

        assert.equal(updated.role, 'Authority');
        assert.equal(updated.name, 'Awanish Verma · Power');
        assert.equal(updated.email, 'awanish.updated@civicpulse.gov');
        assert.equal(updated.phone, '+91 9999988888');
        assert.equal(updated.bio, 'Head of Electrical Grid');
        assert.equal(updated.dutyStatus, 'Busy');
    });

    it('rejects changeOwnPassword when currentPassword does not match', async () => {
        const userId = oid('65f500000000000000000002');
        const actor = {
            _id: userId,
            role: 'Admin',
            anonymousId: 'ADMIN-01'
        } as unknown as AuthenticatedUser;

        mock.method(User, 'findById', async () => ({
            _id: userId,
            isPasswordCorrect: async () => false
        }));

        await assert.rejects(
            () => changeOwnPassword(actor, 'WrongPass', 'NewSecure123'),
            /Current password is incorrect/i
        );
    });
});



