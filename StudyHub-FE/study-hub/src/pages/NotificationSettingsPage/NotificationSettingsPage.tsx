import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    type SelectChangeEvent,
    Switch,
    Typography,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import TelegramIcon from "@mui/icons-material/Telegram";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PageHeader from "../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import type {
    NotificationPreferences,
    NotificationSettingsResponse,
    StudentLecture,
    StudentNewContent,
    TeacherDigestPreference,
    TeacherGradingReminder,
} from "../../api/models/response/NotificationSettingsResponse";
import useNotification from "../../hooks/useNotification";
import shell from "../../layouts/AuthenticatedShell.module.css";
import styles from "./NotificationSettingsPage.module.css";
import { STUDYHUB_PRIMARY_MAIN } from "../../theme/studyHubPalette";

const DEADLINE_OFFSETS: { value: string; label: string }[] = [
    { value: "P7D", label: "1 week before" },
    { value: "P3D", label: "3 days before" },
    { value: "P1D", label: "1 day before" },
    { value: "PT6H", label: "6 hours before" },
    { value: "PT1H", label: "1 hour before" },
];

const LECTURE_OFFSETS: { value: string; label: string }[] = [
    { value: "P1D", label: "1 day before" },
    { value: "PT3H", label: "3 hours before" },
    { value: "PT1H", label: "1 hour before" },
    { value: "PT30M", label: "30 minutes before" },
];

function defaultPreferences(): NotificationPreferences {
    return {
        version: 1,
        teacher: {
            newStudentSubmissions: { enabled: true, frequency: "daily_digest" },
            gradingRequired: { enabled: true, frequency: "daily_pending" },
            assignmentDeadlinesApproaching: { enabled: true, offsets: ["P1D"] },
            lowSubmissionRate: { enabled: false },
            upcomingLectureReminder: { enabled: true, offsets: ["P1D", "PT1H"] },
            studentQuestions: { enabled: false },
        },
        student: {
            newLecture: { enabled: true, notifyOn: "both", frequency: "instant" },
            newAssignment: { enabled: true, notifyOn: "published", frequency: "instant" },
            assignmentDeadline: { enabled: true, offsets: ["P1D", "PT6H"] },
            upcomingLectureReminder: { enabled: true, offsets: ["P1D", "PT1H"] },
        },
    };
}

function clonePrefs(p: NotificationPreferences): NotificationPreferences {
    return JSON.parse(JSON.stringify(p)) as NotificationPreferences;
}

const NotificationSettingsPage = () => {
    const { notifyError, notifySuccess } = useNotification();
    const [user, setUser] = useState<UserResponse | undefined>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPreferences);
    const [telegram, setTelegram] = useState<NotificationSettingsResponse["telegram"]>({
        connected: false,
        displayHandle: null,
        botConfigured: false,
    });
    const [linkInfo, setLinkInfo] = useState<{ deepLink: string; expiresAt: string } | null>(null);
    const skipSaveRef = useRef(true);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const u = await User.me();
            setUser(u);
            const data = await User.getNotificationSettings();
            if (data) {
                setPrefs(clonePrefs(data.preferences));
                setTelegram(data.telegram);
            }
        } catch {
            notifyError("Could not load notification settings.");
        } finally {
            setLoading(false);
            skipSaveRef.current = true;
        }
    }, [notifyError]);

    useEffect(() => {
        void load();
    }, [load]);

    const persist = useCallback(async (next: NotificationPreferences) => {
        setSaving(true);
        try {
            const res = await User.updateNotificationSettings({ preferences: next });
            if (res) {
                skipSaveRef.current = true;
                setPrefs(clonePrefs(res.preferences));
                setTelegram(res.telegram);
            }
        } catch {
            notifyError("Could not save settings.");
        } finally {
            setSaving(false);
        }
    }, [notifyError]);

    useEffect(() => {
        if (skipSaveRef.current) {
            skipSaveRef.current = false;
            return;
        }
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            void persist(prefs);
        }, 650);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [prefs, persist]);

    const role = user?.role?.toLowerCase() ?? "";
    const isTeacher = role === "teacher" || role === "admin";

    const patchTeacherOffsets = (
        key: "assignmentDeadlinesApproaching" | "upcomingLectureReminder",
        value: string,
        checked: boolean,
    ) => {
        setPrefs((prev) => {
            const n = clonePrefs(prev);
            const target = n.teacher[key];
            const cur = new Set(target.offsets);
            if (checked) cur.add(value);
            else cur.delete(value);
            target.offsets = Array.from(cur);
            return n;
        });
    };

    const patchStudentLectureOffsets = (value: string, checked: boolean) => {
        setPrefs((prev) => {
            const n = clonePrefs(prev);
            const cur = new Set(n.student.upcomingLectureReminder.offsets);
            if (checked) cur.add(value);
            else cur.delete(value);
            n.student.upcomingLectureReminder.offsets = Array.from(cur);
            return n;
        });
    };

    const patchStudentDeadlineOffsets = (value: string, checked: boolean) => {
        setPrefs((prev) => {
            const n = clonePrefs(prev);
            const cur = new Set(n.student.assignmentDeadline.offsets);
            if (checked) cur.add(value);
            else cur.delete(value);
            n.student.assignmentDeadline.offsets = Array.from(cur);
            return n;
        });
    };

    const startTelegramLink = async () => {
        try {
            const res = await User.createTelegramLink();
            if (!res?.deepLink) {
                notifyError(res?.message ?? "Telegram bot is not configured.");
                return;
            }
            setLinkInfo({ deepLink: res.deepLink, expiresAt: res.expiresAt });
            window.open(res.deepLink, "_blank", "noopener,noreferrer");
        } catch {
            notifyError("Could not start Telegram linking.");
        }
    };

    const disconnectTelegram = async () => {
        try {
            await User.disconnectTelegram();
            setLinkInfo(null);
            notifySuccess("Telegram disconnected.");
            await load();
        } catch {
            notifyError("Could not disconnect Telegram.");
        }
    };

    const testNotifications = async () => {
        try {
            await User.testTelegramNotification();
            notifySuccess("Test message sent (if Telegram is connected and the bot token is valid).");
        } catch {
            notifyError("Could not send test (connect Telegram and configure the bot on the server).");
        }
    };

    const renderOffsetGroup = (
        label: string,
        options: { value: string; label: string }[],
        selected: string[],
        onToggle: (value: string, checked: boolean) => void,
        disabled: boolean,
    ) => (
        <Box className={styles.configBox}>
            <Typography className={styles.configLabel}>{label}</Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
                {options.map((o) => (
                    <Box key={o.value} display="flex" alignItems="center" gap={0.75}>
                        <Checkbox
                            size="small"
                            checked={selected.includes(o.value)}
                            disabled={disabled}
                            onChange={(_, c) => onToggle(o.value, c)}
                        />
                        <Typography variant="body2">{o.label}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="settings" user={user} />
                <div className={`${styles.content} ${shell.mainScroll}`}>
                    <Typography component="h1" className={styles.pageTitle}>
                        Notification Settings
                    </Typography>
                    <Typography className={styles.subtitle}>
                        Configure how and when you receive notifications via Telegram
                    </Typography>

                    {loading ? (
                        <Typography color="text.secondary">Loading…</Typography>
                    ) : (
                        <>
                            {saving && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                    Saving…
                                </Typography>
                            )}

                            <Card className={styles.card} elevation={0}>
                                <CardContent className={styles.cardInner}>
                                    <Box display="flex" gap={2} alignItems="flex-start">
                                        <Box className={styles.tgIconWrap}>
                                            <TelegramIcon sx={{ color: "#fff", fontSize: 28 }} />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography className={styles.cardTitle}>Telegram Integration</Typography>
                                            {telegram.connected ? (
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Connected as {telegram.displayHandle ?? "your account"}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                    Link Telegram to receive reminders about lectures, assignments,
                                                    deadlines, and (for teachers) student activity.
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                You will receive notifications through the StudyHub Telegram bot after
                                                linking.
                                            </Typography>
                                            {!telegram.botConfigured && (
                                                <Alert severity="warning" sx={{ mt: 2 }}>
                                                    Server admin: set <code>TelegramConfig:BotToken</code> and{" "}
                                                    <code>BotUsername</code> in appsettings. The API runs the bot with
                                                    Telegram long polling (<code>StartReceiving</code>) — no webhook URL
                                                    is required for local development.
                                                </Alert>
                                            )}
                                            {linkInfo && (
                                                <Alert severity="info" sx={{ mt: 2 }}>
                                                    If the chat did not open,{" "}
                                                    <a href={linkInfo.deepLink} target="_blank" rel="noreferrer">
                                                        open this link
                                                    </a>{" "}
                                                    before {new Date(linkInfo.expiresAt).toLocaleString()}.
                                                </Alert>
                                            )}
                                            <Box display="flex" gap={1.5} flexWrap="wrap" mt={2}>
                                                {telegram.connected ? (
                                                    <Button variant="outlined" color="error" onClick={disconnectTelegram}>
                                                        Disconnect Telegram
                                                    </Button>
                                                ) : (
                                                    <Button variant="contained" onClick={startTelegramLink}>
                                                        Connect Telegram
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Card className={styles.card} elevation={0}>
                                <CardContent className={styles.cardInner}>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <NotificationsActiveIcon sx={{ color: "#7c3aed" }} />
                                        <Typography className={styles.cardTitle}>Notification preferences</Typography>
                                    </Box>

                                    {isTeacher && (
                                        <>
                                            <PrefRow
                                                icon={<AssignmentTurnedInIcon sx={{ color: "#7c3aed" }} />}
                                                title="New student submissions"
                                                description="Get notified when students submit assignments."
                                                enabled={prefs.teacher.newStudentSubmissions.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.newStudentSubmissions.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                                    <InputLabel>Notify me</InputLabel>
                                                    <Select
                                                        label="Notify me"
                                                        value={prefs.teacher.newStudentSubmissions.frequency}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.teacher.newStudentSubmissions.frequency = e
                                                                    .target.value as TeacherDigestPreference["frequency"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="instant">Immediately</MenuItem>
                                                        <MenuItem value="daily_digest">Daily digest</MenuItem>
                                                        <MenuItem value="weekly_digest">Weekly digest</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<EmojiEventsIcon sx={{ color: "#7c3aed" }} />}
                                                title="Grading required"
                                                description="Remind me about assignments that need grading."
                                                enabled={prefs.teacher.gradingRequired.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.gradingRequired.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                                    <InputLabel>Remind me</InputLabel>
                                                    <Select
                                                        label="Remind me"
                                                        value={prefs.teacher.gradingRequired.frequency}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.teacher.gradingRequired.frequency = e.target
                                                                    .value as TeacherGradingReminder["frequency"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="daily_pending">
                                                            Daily if there are pending grades
                                                        </MenuItem>
                                                        <MenuItem value="instant">Immediately</MenuItem>
                                                        <MenuItem value="weekly_digest">Weekly digest</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<ScheduleIcon sx={{ color: "#7c3aed" }} />}
                                                title="Assignment deadlines approaching"
                                                description="Get reminded about upcoming assignment deadlines."
                                                enabled={prefs.teacher.assignmentDeadlinesApproaching.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.assignmentDeadlinesApproaching.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                {renderOffsetGroup(
                                                    "Remind me",
                                                    DEADLINE_OFFSETS,
                                                    prefs.teacher.assignmentDeadlinesApproaching.offsets,
                                                    (val, c) => patchTeacherOffsets("assignmentDeadlinesApproaching", val, c),
                                                    !prefs.teacher.assignmentDeadlinesApproaching.enabled,
                                                )}
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<WarningAmberIcon sx={{ color: "#94a3b8" }} />}
                                                title="Low submission rate alert"
                                                description="Alert me if fewer than half of students have submitted."
                                                enabled={prefs.teacher.lowSubmissionRate.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.lowSubmissionRate.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            />
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<MenuBookIcon sx={{ color: "#7c3aed" }} />}
                                                title="Upcoming lecture reminder"
                                                description="Remind me about scheduled lectures."
                                                enabled={prefs.teacher.upcomingLectureReminder.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.upcomingLectureReminder.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                {renderOffsetGroup(
                                                    "Remind me",
                                                    LECTURE_OFFSETS,
                                                    prefs.teacher.upcomingLectureReminder.offsets,
                                                    (val, c) => patchTeacherOffsets("upcomingLectureReminder", val, c),
                                                    !prefs.teacher.upcomingLectureReminder.enabled,
                                                )}
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<PeopleOutlineIcon sx={{ color: "#94a3b8" }} />}
                                                title="Student questions / messages"
                                                description="Get notified when students send questions."
                                                enabled={prefs.teacher.studentQuestions.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.teacher.studentQuestions.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            />
                                        </>
                                    )}

                                    {!isTeacher && (
                                        <>
                                            <PrefRow
                                                icon={<MenuBookIcon sx={{ color: "#7c3aed" }} />}
                                                title="New lecture"
                                                description="When a new lecture is published or about to start."
                                                enabled={prefs.student.newLecture.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.student.newLecture.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                                    <InputLabel>Notify about</InputLabel>
                                                    <Select
                                                        label="Notify about"
                                                        value={prefs.student.newLecture.notifyOn}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.student.newLecture.notifyOn = e.target
                                                                    .value as StudentLecture["notifyOn"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="published">When published</MenuItem>
                                                        <MenuItem value="scheduled_start">Before start time</MenuItem>
                                                        <MenuItem value="both">Both</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
                                                    <InputLabel>Delivery</InputLabel>
                                                    <Select
                                                        label="Delivery"
                                                        value={prefs.student.newLecture.frequency}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.student.newLecture.frequency = e.target
                                                                    .value as StudentLecture["frequency"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="instant">Immediately</MenuItem>
                                                        <MenuItem value="daily_digest">Daily digest</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<AssignmentTurnedInIcon sx={{ color: "#7c3aed" }} />}
                                                title="New assignment"
                                                description="When an assignment is posted or becomes available."
                                                enabled={prefs.student.newAssignment.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.student.newAssignment.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                                    <InputLabel>Notify about</InputLabel>
                                                    <Select
                                                        label="Notify about"
                                                        value={prefs.student.newAssignment.notifyOn}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.student.newAssignment.notifyOn = e.target
                                                                    .value as StudentNewContent["notifyOn"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="published">When published</MenuItem>
                                                        <MenuItem value="opens">When it opens</MenuItem>
                                                        <MenuItem value="both">Both</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
                                                    <InputLabel>Delivery</InputLabel>
                                                    <Select
                                                        label="Delivery"
                                                        value={prefs.student.newAssignment.frequency}
                                                        onChange={(e: SelectChangeEvent) =>
                                                            setPrefs((p) => {
                                                                const n = clonePrefs(p);
                                                                n.student.newAssignment.frequency = e.target
                                                                    .value as StudentNewContent["frequency"];
                                                                return n;
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="instant">Immediately</MenuItem>
                                                        <MenuItem value="daily_digest">Daily digest</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<ScheduleIcon sx={{ color: "#7c3aed" }} />}
                                                title="Assignment deadline"
                                                description="Reminders before an assignment closes."
                                                enabled={prefs.student.assignmentDeadline.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.student.assignmentDeadline.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                {renderOffsetGroup(
                                                    "Remind me",
                                                    DEADLINE_OFFSETS,
                                                    prefs.student.assignmentDeadline.offsets,
                                                    patchStudentDeadlineOffsets,
                                                    !prefs.student.assignmentDeadline.enabled,
                                                )}
                                            </PrefRow>
                                            <Divider sx={{ my: 2 }} />
                                            <PrefRow
                                                icon={<MenuBookIcon sx={{ color: "#7c3aed" }} />}
                                                title="Upcoming lecture reminder"
                                                description="Remind me before scheduled lectures."
                                                enabled={prefs.student.upcomingLectureReminder.enabled}
                                                onEnabled={(v) =>
                                                    setPrefs((p) => {
                                                        const n = clonePrefs(p);
                                                        n.student.upcomingLectureReminder.enabled = v;
                                                        return n;
                                                    })
                                                }
                                            >
                                                {renderOffsetGroup(
                                                    "Remind me",
                                                    LECTURE_OFFSETS,
                                                    prefs.student.upcomingLectureReminder.offsets,
                                                    patchStudentLectureOffsets,
                                                    !prefs.student.upcomingLectureReminder.enabled,
                                                )}
                                            </PrefRow>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Box className={styles.footerRow}>
                                <Typography variant="caption" color="text.secondary">
                                    Changes are saved automatically
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={testNotifications}
                                    className={styles.testBtn}
                                    sx={{
                                        background: `linear-gradient(90deg, ${STUDYHUB_PRIMARY_MAIN} 0%, #7c3aed 100%)`,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        borderRadius: "999px",
                                        px: 3,
                                        boxShadow: "none",
                                    }}
                                >
                                    Test notifications
                                </Button>
                            </Box>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

function PrefRow(props: {
    icon: ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onEnabled: (v: boolean) => void;
    children?: ReactNode;
}) {
    const { icon, title, description, enabled, onEnabled, children } = props;
    const muted = !enabled;
    return (
        <Box display="flex" gap={2} alignItems="flex-start">
            <Switch
                checked={enabled}
                onChange={(_, v) => onEnabled(v)}
                color="primary"
                sx={{
                    mt: 0.5,
                    "& .MuiSwitch-switchBase.Mui-checked": { color: STUDYHUB_PRIMARY_MAIN },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: STUDYHUB_PRIMARY_MAIN,
                    },
                }}
            />
            <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1}>
                    {icon}
                    <Typography fontWeight={700} color={muted ? "text.disabled" : "text.primary"}>
                        {title}
                    </Typography>
                </Box>
                <Typography variant="body2" color={muted ? "text.disabled" : "text.secondary"} sx={{ mt: 0.5 }}>
                    {description}
                </Typography>
                {enabled && children}
            </Box>
        </Box>
    );
}

export default NotificationSettingsPage;
