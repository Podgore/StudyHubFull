import { type ReactNode, useMemo, useState } from "react";
import {
    Typography,
    Chip,
    Box,
    Paper,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import styles from "./AssignmentsCard.module.css";
import AssignmentResponse, { AssignmentKind } from "../../api/models/response/AssignmentResponse";
import UserResponse from "../../api/models/response/UserResponse";
import type StudentAssignmentGradeRowResponse from "../../api/models/response/StudentAssignmentGradeRowResponse";
import NewAssignmentModal from "../AssignmentBuilder/NewAssignmentModal";
import EditAssignmentModal, { assignmentDurationToFormString } from "../AssignmentBuilder/EditAssignmentModal";
import Assignment from "../../api/Assignment";
import useNotification from "../../hooks/useNotification";

interface AssignmentsCardProps {
    assignments: AssignmentResponse[] | undefined;
    user: UserResponse | undefined;
    subjectId: string | undefined;
    onNavigate: (path: string) => void;
    onAssignmentsUpdated?: () => void | Promise<void>;
    studentAssignmentGrades?: StudentAssignmentGradeRowResponse[];
}

type ChipColor = "success" | "default" | "warning" | "error" | "primary" | "secondary" | "info";

type WindowFilter = "all" | "not_opened" | "opened" | "closed";
type KindFilter = "all" | "homework" | "test";
type SortMode = "closing" | "opening" | "marks";
type StudentProgressFilter = "all" | "not_started" | "pending_score" | "graded";

const getAssignmentStatus = (openingDate: string, closingDate: string): { label: string; color: ChipColor } => {
    const now = new Date();
    const openDate = new Date(openingDate);
    const closeDate = new Date(closingDate);

    if (now < openDate) return { label: "Not Opened", color: "warning" };
    if (now > closeDate) return { label: "Closed", color: "error" };
    return { label: "Opened", color: "success" };
};

function getWindowFilterKey(openingDate: string | Date, closingDate: string | Date): WindowFilter {
    const now = new Date();
    const openDate = new Date(openingDate);
    const closeDate = new Date(closingDate);
    if (now < openDate) return "not_opened";
    if (now > closeDate) return "closed";
    return "opened";
}

function getStudentProgressKey(
    gradeRow: StudentAssignmentGradeRowResponse | undefined,
): StudentProgressFilter {
    if (!gradeRow?.submittedAt) return "not_started";
    if (gradeRow.pointsEarned != null) return "graded";
    return "pending_score";
}

function assignmentTime(a: AssignmentResponse, field: "opening" | "closing"): number {
    const raw = field === "opening" ? a.openingDate : a.closingDate;
    return new Date(raw).getTime();
}

function compareBySortMode(a: AssignmentResponse, b: AssignmentResponse, mode: SortMode): number {
    if (mode === "closing") return assignmentTime(a, "closing") - assignmentTime(b, "closing");
    if (mode === "opening") return assignmentTime(a, "opening") - assignmentTime(b, "opening");
    return (b.maxMark ?? 0) - (a.maxMark ?? 0);
}

function FilterPill({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            className={`${styles.filterPill} ${selected ? styles.filterPillActive : ""}`}
            onClick={onClick}
            aria-pressed={selected}
        >
            {children}
        </button>
    );
}

interface SubjectAssignmentRowProps {
    assignment: AssignmentResponse;
    user: UserResponse | undefined;
    subjectId: string | undefined;
    status: { label: string; color: ChipColor };
    onNavigate: (path: string) => void;
    onAssignmentsUpdated?: () => void | Promise<void>;
    gradeRow?: StudentAssignmentGradeRowResponse;
}

const SubjectAssignmentRow = ({
    assignment,
    user,
    subjectId,
    status,
    onNavigate,
    onAssignmentsUpdated,
    gradeRow,
}: SubjectAssignmentRowProps) => {
    const isTeacher = user?.role?.toLowerCase() === "teacher";
    const isStudent = user?.role?.toLowerCase() === "student";
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { notifySuccess } = useNotification();

    const goToAssignment = () => {
        const isHomework = (assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.Homework;
        if (isHomework) {
            onNavigate(`course-task/${assignment.id}`);
            return;
        }
        if (isTeacher) {
            onNavigate(`assignment-creator/${assignment.id}`);
            return;
        }

        onNavigate(`assignment/${assignment.id}`);
    };

    const handleConfirmDelete = async () => {
        if (!onAssignmentsUpdated) return;
        setDeleting(true);
        try {
            const ok = await Assignment.deleteAssignment(String(assignment.id));
            if (ok) {
                notifySuccess("Assignment deleted.");
                setDeleteDialogOpen(false);
                await onAssignmentsUpdated();
            }
        } catch {
            /* Server message shown via global API handler */
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                borderColor: "divider",
                boxShadow: "0px 1px 1px rgba(0,0,0,0.1)",
                transition: "box-shadow 0.2s ease-in-out",
                "&:hover": { boxShadow: "0px 4px 8px rgba(245, 109, 197, 0.2)" },
            }}
        >
            <Box display="flex" alignItems="flex-start" gap={1.5} flexWrap="wrap">
                <Box flex="1 1 200px" minWidth={0} onClick={goToAssignment} sx={{ cursor: "pointer" }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {assignment.title}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                        <Chip
                            label={
                                (assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.Homework
                                    ? "Homework"
                                    : "Test"
                            }
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                        />
                    </Stack>
                    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {(assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.Homework
                                    ? "No timed session"
                                    : `Duration: ${assignmentDurationToFormString(assignment.duration)}`}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <EventIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Opening date: {new Date(assignment.openingDate).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <EventIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Closing date: {new Date(assignment.closingDate).toLocaleString()}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                        ml: { xs: 0, sm: "auto" },
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Chip
                        label={`${assignment.maxMark} pts`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                    {isStudent &&
                        gradeRow &&
                        (assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.Homework &&
                        (gradeRow.pointsEarned != null ? (
                            <Chip
                                label={`Your score: ${gradeRow.pointsEarned}/${gradeRow.maxPoints}`}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        ) : gradeRow.submittedAt ? (
                            <Chip label="Submitted" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                        ) : null)}
                    {isStudent &&
                        gradeRow &&
                        (assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.TimedTest &&
                        gradeRow.submittedAt && (
                            <Chip
                                label={
                                    gradeRow.pointsEarned != null
                                        ? `Your score: ${gradeRow.pointsEarned}/${gradeRow.maxPoints}`
                                        : "Test completed · awaiting score"
                                }
                                size="small"
                                color={gradeRow.pointsEarned != null ? "success" : "default"}
                                variant={gradeRow.pointsEarned != null ? "filled" : "outlined"}
                                sx={{ fontWeight: 600 }}
                            />
                        )}
                    {isTeacher && onAssignmentsUpdated && (
                        <>
                            <EditAssignmentModal assignment={assignment} onUpdated={onAssignmentsUpdated} trigger="icon" />
                            {(assignment.kind ?? AssignmentKind.TimedTest) === AssignmentKind.TimedTest &&
                                subjectId && (
                                    <Tooltip title="Grade open-ended answers">
                                        <IconButton
                                            size="small"
                                            component={RouterLink}
                                            to={`/subject/${subjectId}/open-ended-grade/${assignment.id}`}
                                            aria-label="Grade open-ended answers"
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ color: "text.secondary" }}
                                        >
                                            <RateReviewOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            <IconButton
                                size="small"
                                aria-label="Delete assignment"
                                title="Delete assignment"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialogOpen(true);
                                }}
                                sx={{ color: "text.secondary" }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                            <Dialog
                                open={deleteDialogOpen}
                                onClose={() => !deleting && setDeleteDialogOpen(false)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DialogTitle>Delete assignment?</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        This will permanently remove &quot;{assignment.title}&quot; and related data.
                                        This cannot be undone.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmDelete}
                                        color="error"
                                        variant="contained"
                                        disabled={deleting}
                                    >
                                        {deleting ? "Deleting…" : "Delete"}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                    <Chip
                        label={status.label}
                        color={status.color}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

const AssignmentsCard = ({
    assignments,
    user,
    subjectId,
    onNavigate,
    onAssignmentsUpdated,
    studentAssignmentGrades,
}: AssignmentsCardProps) => {
    const isTeacher = user?.role?.toLowerCase() === "teacher";
    const isStudent = user?.role?.toLowerCase() === "student";
    const assignmentList = Array.isArray(assignments) ? assignments : [];

    const [kindFilter, setKindFilter] = useState<KindFilter>("all");
    const [windowFilter, setWindowFilter] = useState<WindowFilter>("all");
    const [sortMode, setSortMode] = useState<SortMode>("closing");
    const [studentProgressFilter, setStudentProgressFilter] = useState<StudentProgressFilter>("all");

    const gradeByAssignmentId = useMemo(() => {
        const map = new Map<string, StudentAssignmentGradeRowResponse>();
        for (const g of studentAssignmentGrades ?? []) {
            map.set(String(g.assignmentId), g);
        }
        return map;
    }, [studentAssignmentGrades]);

    const filteredAssignments = useMemo(() => {
        let list = [...assignmentList];

        if (kindFilter !== "all") {
            const want = kindFilter === "homework" ? AssignmentKind.Homework : AssignmentKind.TimedTest;
            list = list.filter((a) => (a.kind ?? AssignmentKind.TimedTest) === want);
        }

        if (windowFilter !== "all") {
            list = list.filter((a) => getWindowFilterKey(a.openingDate, a.closingDate) === windowFilter);
        }

        if (isStudent && studentProgressFilter !== "all") {
            list = list.filter((a) => {
                const row = gradeByAssignmentId.get(String(a.id));
                return getStudentProgressKey(row) === studentProgressFilter;
            });
        }

        list.sort((a, b) => compareBySortMode(a, b, sortMode));

        return list;
    }, [
        assignmentList,
        kindFilter,
        windowFilter,
        sortMode,
        studentProgressFilter,
        isStudent,
        gradeByAssignmentId,
    ]);

    const clearFilters = () => {
        setKindFilter("all");
        setWindowFilter("all");
        setStudentProgressFilter("all");
        setSortMode("closing");
    };

    const hasNonDefaultFilters =
        kindFilter !== "all" ||
        windowFilter !== "all" ||
        (isStudent && studentProgressFilter !== "all") ||
        sortMode !== "closing";

    return (
        <div className={styles.assignmentsBox}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                sx={{ marginBottom: "1rem" }}
            >
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    Assignments
                </Typography>
                {isTeacher && <NewAssignmentModal onAssignmentCreated={onAssignmentsUpdated} />}
            </Box>

            <div className={styles.filterToolbar}>
                <div className={styles.filterRow}>
                    <span className={styles.filterPrefix}>
                        <FilterListIcon className={styles.filterPrefixIcon} fontSize="small" aria-hidden />
                        Filters:
                    </span>
                    <div className={styles.filterGroup}>
                        <span className={styles.filterGroupLabel}>Type:</span>
                        <FilterPill selected={kindFilter === "all"} onClick={() => setKindFilter("all")}>
                            All
                        </FilterPill>
                        <FilterPill selected={kindFilter === "homework"} onClick={() => setKindFilter("homework")}>
                            Homework
                        </FilterPill>
                        <FilterPill selected={kindFilter === "test"} onClick={() => setKindFilter("test")}>
                            Test
                        </FilterPill>
                    </div>
                    <div className={styles.filterGroup}>
                        <span className={styles.filterGroupLabel}>Status:</span>
                        <FilterPill selected={windowFilter === "all"} onClick={() => setWindowFilter("all")}>
                            All
                        </FilterPill>
                        <FilterPill
                            selected={windowFilter === "not_opened"}
                            onClick={() => setWindowFilter("not_opened")}
                        >
                            Not opened
                        </FilterPill>
                        <FilterPill selected={windowFilter === "opened"} onClick={() => setWindowFilter("opened")}>
                            Open
                        </FilterPill>
                        <FilterPill selected={windowFilter === "closed"} onClick={() => setWindowFilter("closed")}>
                            Closed
                        </FilterPill>
                    </div>
                    {isStudent && (
                        <div className={styles.filterGroup}>
                            <span className={styles.filterGroupLabel}>Your work:</span>
                            <FilterPill
                                selected={studentProgressFilter === "all"}
                                onClick={() => setStudentProgressFilter("all")}
                            >
                                All
                            </FilterPill>
                            <FilterPill
                                selected={studentProgressFilter === "not_started"}
                                onClick={() => setStudentProgressFilter("not_started")}
                            >
                                Not done
                            </FilterPill>
                            <FilterPill
                                selected={studentProgressFilter === "pending_score"}
                                onClick={() => setStudentProgressFilter("pending_score")}
                            >
                                Awaiting score
                            </FilterPill>
                            <FilterPill
                                selected={studentProgressFilter === "graded"}
                                onClick={() => setStudentProgressFilter("graded")}
                            >
                                Graded
                            </FilterPill>
                        </div>
                    )}
                    {hasNonDefaultFilters ? (
                        <button type="button" className={styles.filterToolbarClear} onClick={clearFilters}>
                            Clear filters
                        </button>
                    ) : null}
                </div>
                <div className={styles.filterRow}>
                    <span className={styles.filterPrefix}>
                        <SwapVertIcon className={styles.filterPrefixIcon} fontSize="small" aria-hidden />
                        Sort by:
                    </span>
                    <div className={styles.filterGroup}>
                        <FilterPill selected={sortMode === "closing"} onClick={() => setSortMode("closing")}>
                            Closing date
                        </FilterPill>
                        <FilterPill selected={sortMode === "opening"} onClick={() => setSortMode("opening")}>
                            Opening date
                        </FilterPill>
                        <FilterPill selected={sortMode === "marks"} onClick={() => setSortMode("marks")}>
                            Marks
                        </FilterPill>
                    </div>
                </div>
            </div>

            {filteredAssignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {assignmentList.length === 0
                        ? "No assignments yet."
                        : "No assignments match the selected filters."}
                </Typography>
            ) : (
                filteredAssignments.map((assignment) => {
                    const status = getAssignmentStatus(
                        assignment.openingDate.toString(),
                        assignment.closingDate.toString(),
                    );
                    const gradeRow = gradeByAssignmentId.get(String(assignment.id));

                    return (
                        <SubjectAssignmentRow
                            key={assignment.id}
                            assignment={assignment}
                            user={user}
                            subjectId={subjectId}
                            status={status}
                            onNavigate={onNavigate}
                            onAssignmentsUpdated={onAssignmentsUpdated}
                            gradeRow={gradeRow}
                        />
                    );
                })
            )}
        </div>
    );
};

export default AssignmentsCard;
