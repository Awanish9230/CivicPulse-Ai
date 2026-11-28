import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Complaint from '../src/modules/complaint/complaint.model.js';
import User from '../src/modules/user/user.model.js';
import notificationService from '../src/modules/notification/notification.service.js';
import {
    computeTextSimilarity,
    detectBestDuplicateMatch,
    formatDuplicateHeadline,
    getEscalatedPriorityForCount,
    getRelatedCategories,
    haversineDistanceMeters,
    scoreDuplicateCandidate
} from '../src/modules/complaint/duplicateDetection.service.js';
import {
    checkDuplicatePreview,
    createComplaint,
    getMyComplaints
} from '../src/modules/complaint/complaint.service.js';
import type { AuthenticatedUser } from '../src/types/express.js';

const BASE_COORDS: [number, number] = [77.5095, 28.6825];
const NEAR_20M_COORDS: [number, number] = [77.50968, 28.68255];
const NEAR_65M_COORDS: [number, number] = [77.51015, 28.6825];
const FAR_500M_COORDS: [number, number] = [77.5145, 28.6825];

const makeUser = (id: string, anonymousId: string, pastAnonymousIds: string[] = []): AuthenticatedUser =>
    ({
        _id: new mongoose.Types.ObjectId(id),
        anonymousId,
        pastAnonymousIds,
        email: `${anonymousId.toLowerCase()}@example.com`,
        role: 'Citizen',
        strikes: 0,
        points: 20,
        badges: [],
        isBanned: false,
        banUntil: null,
        restrictedFeatures: []
    }) as unknown as AuthenticatedUser;

describe('Duplicate Detection Heuristics & Scoring', () => {
    it('computes realistic Haversine distance in meters', () => {
        const same = haversineDistanceMeters(BASE_COORDS, BASE_COORDS);
        const near20 = haversineDistanceMeters(BASE_COORDS, NEAR_20M_COORDS);
        const far500 = haversineDistanceMeters(BASE_COORDS, FAR_500M_COORDS);

        assert.equal(same, 0);
        assert.ok(near20 > 10 && near20 < 30, `expected ~18m, got ${near20}`);
        assert.ok(far500 > 400 && far500 < 600, `expected ~488m, got ${far500}`);
    });

    it('matches synonyms across civic complaint descriptions and rejects unrelated text', () => {
        const similar = computeTextSimilarity(
            'Broken street light lamp near gate 2 making road dark',
            'Damaged streetlight lighting off close to gate 2'
        );
        const unrelated = computeTextSimilarity(
            'Large deep pothole damaging cars on main road',
            'Stray dog pack chasing pedestrians near park'
        );

        assert.ok(similar >= 0.35, `expected synonym similarity >= 0.35, got ${similar}`);
        assert.equal(unrelated, 0);
    });

    it('groups sibling categories under the same municipal department', () => {
        const powerRelated = getRelatedCategories('Electricity');
        assert.ok(powerRelated.includes('Electricity'));
        assert.ok(powerRelated.includes('Street Light'));
        assert.ok(!powerRelated.includes('Road'));
    });

    it('auto-merges identical local complaints while rejecting unrelated issues or distant complaints', async () => {
        const candidateSame = {
            _id: 'cand-1',
            category: 'Road' as const,
            description: 'Deep pothole near main college gate breaking vehicles',
            location: { coordinates: BASE_COORDS },
            reportCount: 1
        };

        const directMatch = scoreDuplicateCandidate(
            {
                category: 'Road',
                description: 'Huge pothole in front of college main gate',
                coordinates: NEAR_20M_COORDS
            },
            candidateSame
        );
        assert.equal(directMatch.decision, 'merge');

        const unrelatedIn50m = scoreDuplicateCandidate(
            {
                category: 'Road',
                description: 'Broken guardrail barrier painted badly on overpass',
                coordinates: NEAR_20M_COORDS
            },
            candidateSame
        );
        assert.equal(unrelatedIn50m.decision, 'skip');

        const farAway = scoreDuplicateCandidate(
            {
                category: 'Road',
                description: 'Deep pothole near main college gate breaking vehicles',
                coordinates: FAR_500M_COORDS
            },
            candidateSame
        );
        assert.equal(farAway.decision, 'skip');
    });

    it('uses semantic AI verifier for borderline cross-category matches at 65m', async () => {
        const siblingCandidate = {
            _id: 'cand-sibling',
            category: 'Street Light' as const,
            description: 'Tall lamp post completely dark at main railway crossing corner',
            location: { coordinates: BASE_COORDS }
        };

        const confirmed = await detectBestDuplicateMatch(
            {
                category: 'Electricity',
                description: 'Overhead cable snapped leaving railway crossing hazardous',
                coordinates: NEAR_65M_COORDS
            },
            [siblingCandidate],
            async () => ({ isDuplicate: true, confidence: 0.91, reason: 'Same crossing outage' })
        );
        assert.ok(confirmed);
        assert.equal(confirmed.matchedBy, 'ai');
        assert.equal(confirmed.candidate._id, 'cand-sibling');

        const rejected = await detectBestDuplicateMatch(
            {
                category: 'Electricity',
                description: 'Overhead cable snapped leaving railway crossing hazardous',
                coordinates: NEAR_65M_COORDS
            },
            [siblingCandidate],
            async () => ({ isDuplicate: false, confidence: 0.88, reason: 'Different transformer block' })
        );
        assert.equal(rejected, null);
    });

    it('escalates priority as distinct citizen report count increases and formats headline', () => {
        assert.equal(getEscalatedPriorityForCount('Low', 1), 'Low');
        assert.equal(getEscalatedPriorityForCount('Low', 2), 'Medium');
        assert.equal(getEscalatedPriorityForCount('Medium', 3), 'High');
        assert.equal(getEscalatedPriorityForCount('High', 5), 'Critical');
        assert.equal(getEscalatedPriorityForCount('Critical', 2), 'Critical');

        assert.equal(formatDuplicateHeadline(1), '1 person has reported this issue');
        assert.equal(formatDuplicateHeadline(2), '2 people have reported this issue');
        assert.equal(formatDuplicateHeadline(4), '4 people have reported this issue');
    });
});

describe('Complaint Auto-Merge Workflow', () => {
    afterEach(() => {
        mock.restoreAll();
    });

    it('auto-merges a second citizen duplicate report and attributes 2 people reported', async () => {
        const existingId = new mongoose.Types.ObjectId();
        let savedCalled = false;

        const existingDoc = {
            _id: existingId,
            reportedBy: 'CP-ORIGINAL-1',
            coReporters: [] as string[],
            upvotedBy: [] as string[],
            category: 'Road' as const,
            description: 'Large pothole near hospital entrance blocking traffic',
            location: { type: 'Point', coordinates: BASE_COORDS },
            priority: 'Low' as const,
            status: 'Submitted' as const,
            imageUrl: 'https://cdn.example.com/orig.jpg',
            imageUrls: ['https://cdn.example.com/orig.jpg'],
            supportCount: 1,
            reportCount: 1,
            mergedReports: [] as unknown[],
            assignedTo: null,
            lastActivityAt: new Date(),
            createdAt: new Date(),
            save: async () => {
                savedCalled = true;
                return existingDoc;
            }
        };

        mock.method(Complaint, 'find', () => ({
            limit: async () => [existingDoc]
        }));
        mock.method(notificationService, 'createNotification', async () => null as never);

        const secondUserDoc = {
            _id: new mongoose.Types.ObjectId('65f000000000000000000002'),
            points: 10,
            badges: [] as string[],
            save: async () => secondUserDoc
        };
        mock.method(User, 'findById', async () => secondUserDoc as never);

        const actor2 = makeUser('65f000000000000000000002', 'CP-SECOND-2');
        const result = await createComplaint(
            {
                category: 'Road',
                description: 'Huge pothole outside hospital entrance slowing traffic',
                coordinates: NEAR_20M_COORDS,
                files: []
            },
            actor2
        );

        assert.equal(savedCalled, true);
        assert.equal(result.isDuplicate, true);
        assert.equal(result.reportCount, 2);
        assert.equal(result.headline, '2 people have reported this issue');
        assert.equal(result.pointsAwarded, 5);
        assert.equal(existingDoc.reportCount, 2);
        assert.equal(existingDoc.supportCount, 2);
        assert.equal(existingDoc.priority, 'Medium');
        assert.deepEqual(existingDoc.coReporters, ['CP-SECOND-2']);
        assert.equal(existingDoc.mergedReports.length, 1);
        assert.equal(secondUserDoc.points, 15);
    });

    it('blocks the same user from inflating reportCount even after anonymousId rotation', async () => {
        const existingDoc = {
            _id: new mongoose.Types.ObjectId(),
            reportedBy: 'CP-OLD-ROTATED-ID',
            coReporters: [],
            category: 'Water' as const,
            description: 'Broken water main flooding street corner',
            location: { coordinates: BASE_COORDS },
            reportCount: 1
        };

        mock.method(Complaint, 'find', () => ({
            limit: async () => [existingDoc]
        }));

        const rotatedActor = makeUser('65f000000000000000000001', 'CP-NEW-ROTATED-ID', ['CP-OLD-ROTATED-ID']);

        await assert.rejects(
            () =>
                createComplaint(
                    {
                        category: 'Water',
                        description: 'Broken water pipe flooding street corner',
                        coordinates: NEAR_20M_COORDS
                    },
                    rotatedActor
                ),
            (err: unknown) => (err as { statusCode?: number }).statusCode === 409
        );
    });

    it('returns preview match metadata before submission via checkDuplicatePreview', async () => {
        const candidateDoc = {
            _id: new mongoose.Types.ObjectId(),
            category: 'Garbage' as const,
            description: 'Overflowing garbage bin near central market gate',
            status: 'Verified',
            location: { coordinates: BASE_COORDS },
            reportCount: 1,
            supportCount: 1
        };

        mock.method(Complaint, 'find', () => ({
            select: () => ({
                limit: async () => [candidateDoc]
            })
        }));

        const preview = await checkDuplicatePreview({
            category: 'Garbage',
            description: 'Overflowing trash waste near central market gate',
            coordinates: NEAR_20M_COORDS
        });

        assert.equal(preview.hasMatch, true);
        assert.equal(preview.match?.reportCount, 1);
        assert.equal(preview.match?.nextReportCount, 2);
        assert.equal(preview.match?.headline, '2 people have reported this issue');
    });

    it('queries both reportedBy and coReporters in getMyComplaints so co-reporters see merged issues', async () => {
        let capturedQuery: Record<string, unknown> | null = null;
        mock.method(Complaint, 'find', (query: Record<string, unknown>) => {
            capturedQuery = query;
            return {
                sort: () => ({
                    populate: async () => []
                })
            };
        });

        const coReporter = makeUser('65f000000000000000000003', 'CP-CO-REP', ['CP-PAST-1']);
        await getMyComplaints(coReporter);

        assert.ok(capturedQuery);
        assert.deepEqual(capturedQuery, {
            $or: [
                { reportedBy: { $in: ['CP-CO-REP', 'CP-PAST-1'] } },
                { coReporters: { $in: ['CP-CO-REP', 'CP-PAST-1'] } }
            ]
        });
    });
});
