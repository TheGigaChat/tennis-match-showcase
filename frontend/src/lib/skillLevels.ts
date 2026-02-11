export const LEVELS = [
    "BEGINNER",
    "INTERMEDIATE",
    "UPPER_INTERMEDIATE",
    "COLLEGE_PLAYER",
    "PRO",
] as const;

export type BackendSkillLevel = typeof LEVELS[number];

export const LEVEL_LABEL: Record<BackendSkillLevel, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    UPPER_INTERMEDIATE: "Upper Intermediate",
    COLLEGE_PLAYER: "College Player",
    PRO: "Professional",
};

// Type guard — useful when parsing backend responses
export function isBackendLevel(val: unknown): val is BackendSkillLevel {
    return typeof val === "string" && (LEVELS as readonly string[]).includes(val);
}

const LEVEL_LABELS = Object.values(LEVEL_LABEL) as readonly string[];

export function toSkillLabel(val: unknown): string {
    if (isBackendLevel(val)) return LEVEL_LABEL[val];
    if (typeof val === "string" && LEVEL_LABELS.includes(val)) return val;
    return LEVEL_LABEL.BEGINNER;
}
