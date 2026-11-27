import type { UserDocument } from '../modules/user/user.model.js';

export type AuthenticatedUser = UserDocument & {
    anonymousId: string;
    pastAnonymousIds: string[];
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};
