export function extractServerErrorMessage(data: unknown): string | null {
    if (data == null) return null;
    if (typeof data === "string") {
        const s = data.trim();
        return s.length ? s : null;
    }
    if (typeof data === "object") {
        const o = data as Record<string, unknown>;
        if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
        if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
        if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
        if (typeof o.title === "string" && o.title.trim()) return o.title.trim();
        const errors = o.errors;
        if (errors && typeof errors === "object") {
            const first = Object.values(errors as Record<string, unknown>)
                .flat()
                .find((x) => typeof x === "string") as string | undefined;
            if (first?.trim()) return first.trim();
        }
    }
    return null;
}

export function isAssignmentTaskMarkLimitServerMessage(message: string): boolean {
    const m = message.toLowerCase();
    return m.includes("assigned mark exceeds") || m.includes("sum of all task marks");
}
