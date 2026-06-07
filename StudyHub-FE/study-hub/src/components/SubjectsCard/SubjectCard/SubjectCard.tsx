import { IconButton } from "@mui/material";
import type { MouseEvent } from "react";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import UserResponse from "../../../api/models/response/UserResponse";
import SubjectResponse from "../../../api/models/response/SubjectResponse";
import StudentSubjectGradeRowResponse from "../../../api/models/response/StudentSubjectGradeRowResponse";
import type { TeacherSubjectMetricsResponse } from "../../../api/models/response/TeacherStudentsOverviewResponse";
import styles from "./SubjectCard.module.css";

function letterBadgeClass(letter: string | null | undefined): string {
  const first = letter?.trim().charAt(0).toUpperCase() ?? "";
  if (first === "A") return styles.badgeA;
  if (first === "B") return styles.badgeB;
  if (first === "C") return styles.badgeC;
  if (first === "D") return styles.badgeD;
  if (first === "F") return styles.badgeF;
  return styles.badgeNeutral;
}

interface SubjectCardProps {
  subject: SubjectResponse;
  onDelete: (id: string) => void;
  user: UserResponse | undefined;
  variant: "student" | "teacher";
  studentGrade?: StudentSubjectGradeRowResponse | null;
  teacherMetrics?: TeacherSubjectMetricsResponse | null;
}

const SubjectCard = ({
  subject,
  onDelete,
  user,
  variant,
  studentGrade,
  teacherMetrics,
}: SubjectCardProps) => {
  const navigate = useNavigate();
  const isStudent = variant === "student";
  const canDelete =
    user?.role?.toLowerCase() !== "student" &&
    user?.role?.toLowerCase() !== undefined;

  const handleClick = () => {
    navigate(`/subject/${subject.id}`);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(subject.id);
  };

  const teacherDisplay = subject.teacher?.fullName?.trim() || "Instructor";

  return (
    <article className={styles.card} onClick={handleClick} role="button">
      {canDelete && (
        <IconButton
          type="button"
          className={styles.deleteBtn}
          size="small"
          aria-label="Delete subject"
          sx={{
            backgroundColor: "rgba(255,255,255,0.92)",
            "&:hover": { backgroundColor: "#fff" },
          }}
          onClick={handleDeleteClick}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      )}
      <div className={styles.hero}>
        <MenuBookOutlinedIcon sx={{ fontSize: 48, opacity: 0.95 }} />
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{subject.title}</h2>

        {isStudent ? (
          <div className={styles.statRow}>
            <span className={styles.statMain}>
              {studentGrade?.averagePercent != null
                ? `${Math.round(studentGrade.averagePercent)}%`
                : "—"}
            </span>
            {studentGrade?.letterGrade ? (
              <span
                className={`${styles.letterBadge} ${letterBadgeClass(
                  studentGrade.letterGrade,
                )}`}
              >
                {studentGrade.letterGrade.trim()}
              </span>
            ) : null}
          </div>
        ) : (
          <>
            <div className={styles.statRow}>
              <span className={styles.statMain}>
                {teacherMetrics != null ? teacherMetrics.totalStudents : "—"}
              </span>
              <span className={styles.statSuffix}>students</span>
            </div>
            <div className={styles.teacherSubStats}>
              {teacherMetrics?.averageScorePercent != null ? (
                <>
                  Class average{" "}
                  <strong>
                    {Math.round(teacherMetrics.averageScorePercent)}%
                  </strong>
                </>
              ) : (
                <>Class average not available yet</>
              )}
              {teacherMetrics != null &&
              teacherMetrics.averageCompletionPercent != null ? (
                <>
                  {" "}
                  · Completion{" "}
                  <strong>
                    {Math.round(teacherMetrics.averageCompletionPercent)}%
                  </strong>
                </>
              ) : null}
            </div>
          </>
        )}

        <div className={styles.footer}>
          {isStudent ? (
            <>Instructor · {teacherDisplay}</>
          ) : (
            <>
              {new Date().getFullYear()} · Open to manage course, students,
              and assignments
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default SubjectCard;
