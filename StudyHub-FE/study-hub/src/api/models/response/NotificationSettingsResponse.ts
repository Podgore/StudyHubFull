export interface NotificationToggle {
    enabled: boolean;
}

export interface TeacherDigestPreference extends NotificationToggle {
    frequency: "instant" | "daily_digest" | "weekly_digest";
}

export interface TeacherGradingReminder extends NotificationToggle {
    frequency: "daily_pending" | "instant" | "weekly_digest";
}

export interface OffsetPreference extends NotificationToggle {
    offsets: string[];
}

export interface StudentAssignmentDeadline extends NotificationToggle {
    offsets: string[];
}

export interface StudentNewContent extends NotificationToggle {
    notifyOn: "published" | "opens" | "both";
    frequency: "instant" | "daily_digest";
}

export interface StudentLecture extends NotificationToggle {
    notifyOn: "published" | "scheduled_start" | "both";
    frequency: "instant" | "daily_digest";
}

export interface TeacherNotificationPreferences {
    newStudentSubmissions: TeacherDigestPreference;
    gradingRequired: TeacherGradingReminder;
    assignmentDeadlinesApproaching: OffsetPreference;
    lowSubmissionRate: NotificationToggle;
    upcomingLectureReminder: OffsetPreference;
    studentQuestions: NotificationToggle;
}

export interface StudentNotificationPreferences {
    newLecture: StudentLecture;
    newAssignment: StudentNewContent;
    assignmentDeadline: StudentAssignmentDeadline;
    upcomingLectureReminder: OffsetPreference;
}

export interface NotificationPreferences {
    version: number;
    teacher: TeacherNotificationPreferences;
    student: StudentNotificationPreferences;
}

export interface TelegramStatus {
    connected: boolean;
    displayHandle: string | null;
    botConfigured: boolean;
}

export interface NotificationSettingsResponse {
    telegram: TelegramStatus;
    preferences: NotificationPreferences;
}

export interface UpdateNotificationSettingsRequest {
    preferences: NotificationPreferences;
}

export interface TelegramLinkResponse {
    deepLink: string;
    expiresAt: string;
    message?: string | null;
}
