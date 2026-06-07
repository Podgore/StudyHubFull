import QuestionForTest from "../api/models/response/QuestionForTest";

export type TimedTestSessionCache = {
    sessionId: string;
    sessionHash: string;
    questions: QuestionForTest[];
};

export function timedTestSessionCacheKey(assignmentId: string): string {
    return `StudyHub_TimedTest_${assignmentId}`;
}

export function readTimedTestSessionCache(assignmentId: string): TimedTestSessionCache | null {
    try {
        const raw = sessionStorage.getItem(timedTestSessionCacheKey(assignmentId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as TimedTestSessionCache;
        if (!parsed?.sessionId || !parsed?.sessionHash || !Array.isArray(parsed.questions)) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function writeTimedTestSessionCache(assignmentId: string, cache: TimedTestSessionCache): void {
    sessionStorage.setItem(timedTestSessionCacheKey(assignmentId), JSON.stringify(cache));
}

export function clearTimedTestSessionCache(assignmentId: string): void {
    sessionStorage.removeItem(timedTestSessionCacheKey(assignmentId));
}

export function parseRemainingTimeToSeconds(remainingTime: string): number {
    const parts = String(remainingTime).split(":").map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
        return 0;
    }
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
}
