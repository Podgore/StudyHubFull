import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    Menu,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Collapse,
    type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageHeader from "../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import Subject from "../../api/Subject";
import SubjectResponse from "../../api/models/response/SubjectResponse";
import type {
    TeacherAssignmentColumnResponse,
    TeacherStudentAssignmentGradeResponse,
    TeacherStudentRowResponse,
    TeacherStudentsOverviewResponse,
} from "../../api/models/response/TeacherStudentsOverviewResponse";
import AddStudentsModal from "../../components/StudentsComponent/AddStudentsModal";
import useNotification from "../../hooks/useNotification";
import shell from "../../layouts/AuthenticatedShell.module.css";
import styles from "./TeacherStudentsPage.module.css";

type StatusFilter = "all" | "active" | "inactive";

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "?";
}

function avatarBg(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
    const hues = [280, 320, 200, 340, 260];
    const hue = hues[Math.abs(h) % hues.length];
    return `hsl(${hue} 55% 46%)`;
}

function letterBadgeClass(letter: string | null | undefined): string {
    const L = letter?.trim().charAt(0).toUpperCase() ?? "";
    if (L === "A") return styles.badgeA;
    if (L === "B") return styles.badgeB;
    if (L === "C") return styles.badgeC;
    if (L === "D") return styles.badgeD;
    if (L === "F") return styles.badgeF;
    return styles.badgeNeutral;
}

function scoreClass(pct: number | null | undefined): string {
    if (pct == null) return styles.scoreMuted;
    if (pct >= 88) return styles.scoreHigh;
    if (pct >= 72) return styles.scoreMid;
    return styles.scoreLow;
}

function formatRelativeActivity(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 45) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const day = Math.floor(hr / 24);
    if (day < 21) return `${day} day${day === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString();
}

function escapeCsvCell(v: string): string {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

function safeFilePart(name: string): string {
    const s = name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
    return s.slice(0, 80) || "subject";
}

function exportEarnedPointsCell(g: TeacherStudentAssignmentGradeResponse): string {
    if (g.status === "graded" && g.earned != null && Number.isFinite(g.earned)) {
        return String(g.earned);
    }
    return "";
}

function sumGradedEarned(
    cols: TeacherAssignmentColumnResponse[],
    gradesById: Map<string, TeacherStudentAssignmentGradeResponse>,
): number {
    let sum = 0;
    for (const a of cols) {
        const g = gradesById.get(a.assignmentId) ?? emptyAssignmentGrade(a.assignmentId);
        if (g.status === "graded" && g.earned != null && Number.isFinite(g.earned)) sum += g.earned;
    }
    return Math.round((sum + Number.EPSILON) * 1000) / 1000;
}

function uniqueAssignmentExportHeaders(cols: TeacherAssignmentColumnResponse[]): string[] {
    const seen = new Map<string, number>();
    return cols.map((c) => {
        const base = (c.title ?? "").trim() || "Assignment";
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        return n === 1 ? base : `${base} (${n})`;
    });
}

function compactScoreFragment(g: TeacherStudentAssignmentGradeResponse): string {
    if (g.status === "graded" && g.earned != null && g.max != null) {
        return `${g.earned}/${g.max}`;
    }
    if (g.status === "pending") return "Pending";
    if (g.status === "in_progress") return "In progress";
    return "—";
}

function emptyAssignmentGrade(assignmentId: string): TeacherStudentAssignmentGradeResponse {
    return { assignmentId, status: "not_started", earned: null, max: null, percent: null };
}

function deriveAssignmentColumnsFromStudentGrades(
    students: TeacherStudentRowResponse[],
): TeacherAssignmentColumnResponse[] {
    let best: TeacherStudentAssignmentGradeResponse[] = [];
    for (const s of students) {
        const g = s.assignmentGrades ?? [];
        if (g.length > best.length) best = g;
    }
    if (best.length === 0) return [];
    return best.map((g, idx) => ({
        assignmentId: String(g.assignmentId),
        title: `Assignment ${idx + 1}`,
        maxMark: g.max ?? 0,
        kind: 0,
    }));
}

const TeacherStudentsPage = () => {
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();
    const [user, setUser] = useState<UserResponse | undefined>();
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [overview, setOverview] = useState<TeacherStudentsOverviewResponse | undefined>();
    const [overviewError, setOverviewError] = useState<string | null>(null);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; student: TeacherStudentRowResponse } | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<TeacherStudentRowResponse | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        User.me()
            .then((u) => {
                setUser(u);
                if (u?.role?.toLowerCase() !== "teacher" && u?.role?.toLowerCase() !== "admin") {
                    navigate("/dashboard");
                }
            })
            .catch(() => setUser(undefined));
    }, [navigate]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingSubjects(true);
            const list = await Subject.getSubjectsForUser();
            if (cancelled) return;
            const arr = Array.isArray(list) ? list : [];
            setSubjects(arr);
            setSubjectId(arr[0]?.id ?? null);
            setLoadingSubjects(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const refreshOverview = useCallback(async () => {
        if (!subjectId) {
            setOverview(undefined);
            setOverviewError(null);
            return;
        }
        setLoadingOverview(true);
        setOverviewError(null);
        try {
            const data = await Subject.getTeacherStudentsOverview(subjectId);
            setOverview(data);
        } catch {
            setOverview(undefined);
            const msg = "Could not load student data from the server. Ensure you are signed in as the subject teacher and the API is running.";
            setOverviewError(msg);
            notifyError(msg);
        } finally {
            setLoadingOverview(false);
        }
    }, [subjectId, notifyError]);

    useEffect(() => {
        void refreshOverview();
    }, [refreshOverview]);

    const currentSubjectTitle = useMemo(
        () => subjects.find((s) => s.id === subjectId)?.title ?? "subject",
        [subjects, subjectId],
    );

    const toggleStudentExpanded = (studentId: string) => {
        const key = String(studentId);
        setExpandedStudentIds((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const assignmentColumns = useMemo((): TeacherAssignmentColumnResponse[] => {
        const fromApi = overview?.assignments ?? [];
        if (fromApi.length > 0) return fromApi;
        return deriveAssignmentColumnsFromStudentGrades(overview?.students ?? []);
    }, [overview?.assignments, overview?.students]);

    const filteredStudents = useMemo(() => {
        const rows = overview?.students ?? [];
        let list = rows;
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (s) =>
                    s.fullName.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q),
            );
        }
        if (statusFilter === "active") {
            list = list.filter((s) => s.completedAssignments > 0);
        } else if (statusFilter === "inactive") {
            list = list.filter((s) => s.completedAssignments === 0);
        }
        return list;
    }, [overview, search, statusFilter]);

    const exportScoresSpreadsheet = () => {
        const cols = assignmentColumns;
        const assignmentHeaders = uniqueAssignmentExportHeaders(cols);
        const headers = [
            "Name",
            "Email",
            "Letter grade",
            "Average %",
            "Completed / Total",
            "Status",
            "Last activity",
            ...assignmentHeaders,
            "Total",
        ];
        const lines = filteredStudents.map((s) => {
            const gradesById = new Map((s.assignmentGrades ?? []).map((g) => [g.assignmentId, g]));
            const assignCells = cols.map((a) =>
                escapeCsvCell(
                    exportEarnedPointsCell(gradesById.get(a.assignmentId) ?? emptyAssignmentGrade(a.assignmentId)),
                ),
            );
            const rowTotal = sumGradedEarned(cols, gradesById);
            return [
                escapeCsvCell(s.fullName),
                escapeCsvCell(s.email),
                escapeCsvCell(s.letterGrade ?? ""),
                s.averagePercent != null ? String(s.averagePercent) : "",
                `${s.completedAssignments}/${s.totalAssignments}`,
                s.completedAssignments > 0 ? "Active" : "Inactive",
                escapeCsvCell(formatRelativeActivity(s.lastActivityAt)),
                ...assignCells,
                String(rowTotal),
            ].join(",");
        });
        const csvBody = [headers.map(escapeCsvCell).join(","), ...lines].join("\n");
        const blob = new Blob([`\ufeff${csvBody}`], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const slug = safeFilePart(currentSubjectTitle);
        a.download = `${slug}-student-scores-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || !subjectId) return;
        setDeleting(true);
        try {
            await Subject.removeStudentFromSubject(deleteTarget.email, subjectId);
            notifySuccess("Student removed from subject.");
            setDeleteTarget(null);
            await refreshOverview();
        } catch {
            notifyError("Could not remove student.");
        } finally {
            setDeleting(false);
        }
    };

    const metrics = overview?.metrics;

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="students" user={user} />
                <div className={`${styles.content} ${shell.mainScroll}`}>
                    <div className={styles.titleBlock}>
                        <Typography component="h1" className={styles.pageTitle}>
                            Students
                        </Typography>
                        <Typography component="p" className={styles.subtitle}>
                            Manage and monitor students by subject
                        </Typography>
                    </div>

                    {loadingSubjects ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : subjects.length === 0 ? (
                        <Alert severity="info">Create a subject first, then add students from here or from the subject page.</Alert>
                    ) : (
                        <>
                            <div className={styles.tabBar}>
                                {subjects.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`${styles.tabBtn} ${subjectId === s.id ? styles.tabBtnActive : ""}`}
                                        onClick={() => setSubjectId(s.id)}
                                    >
                                        {s.title}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.statGrid}>
                                <div className={styles.statCard}>
                                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                        <PersonAddAltIcon />
                                    </div>
                                    <span className={styles.statValue}>{metrics?.totalStudents ?? "—"}</span>
                                    <span className={styles.statLabel}>Total Students</span>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                                        <TrendingUpIcon />
                                    </div>
                                    <span className={styles.statValue}>{metrics?.activeStudents ?? "—"}</span>
                                    <span className={styles.statLabel}>Active Students</span>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                        <EmojiEventsIcon />
                                    </div>
                                    <span className={styles.statValue}>
                                        {metrics?.averageScorePercent != null
                                            ? `${metrics.averageScorePercent}%`
                                            : "—"}
                                    </span>
                                    <span className={styles.statLabel}>Average Score</span>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={`${styles.statIcon} ${styles.statIconPink}`}>
                                        <MenuBookIcon />
                                    </div>
                                    <span className={styles.statValue}>
                                        {metrics?.averageCompletionPercent != null
                                            ? `${metrics.averageCompletionPercent}%`
                                            : "—"}
                                    </span>
                                    <span className={styles.statLabel}>Avg Completion</span>
                                </div>
                            </div>

                            {overviewError && (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOverviewError(null)}>
                                    {overviewError}
                                </Alert>
                            )}

                            <div className={styles.toolbarCard}>
                                <div className={styles.toolbarRow}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        sx={{ flex: "1 1 240px", minWidth: 200 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel id="status-filter-label">Status</InputLabel>
                                        <Select
                                            labelId="status-filter-label"
                                            label="Status"
                                            value={statusFilter}
                                            onChange={(e: SelectChangeEvent<StatusFilter>) =>
                                                setStatusFilter(e.target.value as StatusFilter)
                                            }
                                        >
                                            <MenuItem value="all">All Status</MenuItem>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Tooltip title="UTF-8 CSV for Excel: summary columns, then one column per assignment (earned points), then Total (sum of earned).">
                                        <span>
                                            <Button
                                                variant="outlined"
                                                color="inherit"
                                                startIcon={<DownloadOutlinedIcon />}
                                                onClick={exportScoresSpreadsheet}
                                                sx={{ textTransform: "none", fontWeight: 600 }}
                                            >
                                                Export scores
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Box sx={{ flex: "1 1 auto" }} />
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAddAltIcon />}
                                        onClick={() => setAddModalOpen(true)}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "999px",
                                            px: 2.5,
                                            bgcolor: "primary.main",
                                            boxShadow: "none",
                                        }}
                                    >
                                        Add Student
                                    </Button>
                                </div>
                            </div>

                            <TableContainer className={styles.tableShell}>
                                {loadingOverview ? (
                                    <Box display="flex" justifyContent="center" py={6}>
                                        <CircularProgress size={36} />
                                    </Box>
                                ) : (
                                    <Table size="medium">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    className={styles.tableHeadCell}
                                                    sx={{ width: 48, py: 1.5 }}
                                                    aria-label="Expand"
                                                />
                                                <TableCell className={styles.tableHeadCell}>Student</TableCell>
                                                <TableCell className={styles.tableHeadCell}>Grade</TableCell>
                                                <TableCell className={styles.tableHeadCell}>Score</TableCell>
                                                <TableCell className={styles.tableHeadCell}>Progress</TableCell>
                                                <TableCell className={styles.tableHeadCell}>Status</TableCell>
                                                <TableCell className={styles.tableHeadCell}>Last Activity</TableCell>
                                                <TableCell className={styles.tableHeadCell} align="right">
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {!loadingOverview &&
                                                !overviewError &&
                                                filteredStudents.length === 0 &&
                                                (overview?.students?.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} sx={{ py: 5, textAlign: "center" }}>
                                                            <Typography color="text.secondary">
                                                                No students enrolled in this subject yet. Use Add Student to invite
                                                                them.
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} sx={{ py: 5, textAlign: "center" }}>
                                                            <Typography color="text.secondary">
                                                                No students match your search or status filter.
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {filteredStudents.map((row) => {
                                                const pct =
                                                    row.totalAssignments > 0
                                                        ? (100 * row.completedAssignments) / row.totalAssignments
                                                        : 0;
                                                const expanded = Boolean(
                                                    expandedStudentIds[String(row.studentId)],
                                                );
                                                const assignCols = assignmentColumns;
                                                const grades = row.assignmentGrades ?? [];
                                                return (
                                                    <Fragment key={String(row.studentId)}>
                                                        <TableRow hover>
                                                            <TableCell sx={{ width: 48, py: 0.5, verticalAlign: "middle" }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => toggleStudentExpanded(String(row.studentId))}
                                                                    disabled={assignCols.length === 0 && grades.length === 0}
                                                                    aria-expanded={expanded}
                                                                    aria-label={
                                                                        expanded
                                                                            ? "Hide assignment grades"
                                                                            : "Show assignment grades"
                                                                    }
                                                                >
                                                                    {expanded ? (
                                                                        <KeyboardArrowUpIcon fontSize="small" />
                                                                    ) : (
                                                                        <KeyboardArrowDownIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                                    <Avatar
                                                                        sx={{
                                                                            width: 44,
                                                                            height: 44,
                                                                            bgcolor: avatarBg(row.email || row.studentId),
                                                                            fontSize: "0.95rem",
                                                                            fontWeight: 800,
                                                                        }}
                                                                    >
                                                                        {initialsFromName(row.fullName)}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <div className={styles.studentName}>{row.fullName}</div>
                                                                        <div className={styles.studentEmail}>
                                                                            <MailOutlineIcon sx={{ fontSize: 14 }} />
                                                                            {row.email}
                                                                        </div>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.letterGrade ? (
                                                                    <span
                                                                        className={`${styles.badge} ${letterBadgeClass(
                                                                            row.letterGrade,
                                                                        )}`}
                                                                    >
                                                                        {row.letterGrade}
                                                                    </span>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        —
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={scoreClass(row.averagePercent)}>
                                                                    {row.averagePercent != null ? `${row.averagePercent}%` : "—"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell sx={{ minWidth: 140 }}>
                                                                <div className={styles.progressMeta}>
                                                                    {row.completedAssignments}/{row.totalAssignments}
                                                                </div>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={Math.min(100, pct)}
                                                                    sx={{
                                                                        height: 8,
                                                                        borderRadius: 999,
                                                                        bgcolor: "#e8ecf1",
                                                                        "& .MuiLinearProgress-bar": {
                                                                            borderRadius: 999,
                                                                            background:
                                                                                "linear-gradient(90deg, #d41a6d 0%, #7c3aed 100%)",
                                                                        },
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    size="small"
                                                                    label={row.completedAssignments > 0 ? "Active" : "Inactive"}
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        bgcolor:
                                                                            row.completedAssignments > 0
                                                                                ? "rgba(16, 185, 129, 0.12)"
                                                                                : "rgba(148, 163, 184, 0.2)",
                                                                        color:
                                                                            row.completedAssignments > 0
                                                                                ? "#047857"
                                                                                : "#64748b",
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={styles.lastActivity}>
                                                                    {formatRelativeActivity(row.lastActivityAt)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <IconButton
                                                                    aria-label="More actions"
                                                                    size="small"
                                                                    onClick={(e) =>
                                                                        setMenuAnchor({ el: e.currentTarget, student: row })
                                                                    }
                                                                >
                                                                    <MoreVertIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={8}
                                                                sx={{
                                                                    py: 0,
                                                                    borderTop: 0,
                                                                    bgcolor: "rgba(124, 58, 237, 0.04)",
                                                                }}
                                                            >
                                                                <Collapse in={expanded} timeout="auto" unmountOnExit>
                                                                    <Box sx={{ py: 2, px: 2 }}>
                                                                        {assignCols.length === 0 ? (
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                No assignments in this subject yet.
                                                                            </Typography>
                                                                        ) : (
                                                                            <Box
                                                                                className={styles.assignmentMatrix}
                                                                                role="group"
                                                                                aria-label="Scores by assignment"
                                                                                sx={{
                                                                                    display: "grid",
                                                                                    gridTemplateColumns: `repeat(${assignCols.length}, minmax(96px, max-content))`,
                                                                                    gridTemplateRows: "auto auto",
                                                                                    columnGap: { xs: "16px", sm: "24px" },
                                                                                    rowGap: "10px",
                                                                                    alignItems: "baseline",
                                                                                }}
                                                                            >
                                                                                {assignCols.map((col, idx) => (
                                                                                    <Typography
                                                                                        key={`${col.assignmentId}-title`}
                                                                                        component="div"
                                                                                        variant="body2"
                                                                                        className={styles.assignmentMatrixTitle}
                                                                                        sx={{ gridColumn: idx + 1, gridRow: 1 }}
                                                                                    >
                                                                                        {col.title}
                                                                                    </Typography>
                                                                                ))}
                                                                                {assignCols.map((col, idx) => {
                                                                                    const g =
                                                                                        grades.find(
                                                                                            (x) =>
                                                                                                x.assignmentId === col.assignmentId,
                                                                                        ) ?? emptyAssignmentGrade(col.assignmentId);
                                                                                    return (
                                                                                        <Typography
                                                                                            key={`${col.assignmentId}-score`}
                                                                                            component="div"
                                                                                            variant="body2"
                                                                                            className={styles.assignmentMatrixScore}
                                                                                            sx={{ gridColumn: idx + 1, gridRow: 2 }}
                                                                                        >
                                                                                            {compactScoreFragment(g)}
                                                                                        </Typography>
                                                                                    );
                                                                                })}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </Collapse>
                                                            </TableCell>
                                                        </TableRow>
                                                    </Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </TableContainer>

                            <Menu
                                anchorEl={menuAnchor?.el}
                                open={Boolean(menuAnchor)}
                                onClose={() => setMenuAnchor(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        const s = menuAnchor?.student;
                                        setMenuAnchor(null);
                                        if (s) setDeleteTarget(s);
                                    }}
                                    sx={{ color: "error.main", gap: 1 }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                    Remove from subject
                                </MenuItem>
                            </Menu>

                            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
                                <DialogTitle>Remove student?</DialogTitle>
                                <DialogContent>
                                    <Typography variant="body2">
                                        Remove <strong>{deleteTarget?.fullName}</strong> from this subject? They will lose
                                        access until re-invited.
                                    </Typography>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                        Cancel
                                    </Button>
                                    <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleting}>
                                        {deleting ? "Removing…" : "Remove"}
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            <AddStudentsModal
                                isModalOpen={addModalOpen}
                                onClose={() => setAddModalOpen(false)}
                                subjectId={subjectId ?? undefined}
                                onEnrollmentChanged={() => void refreshOverview()}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherStudentsPage;
