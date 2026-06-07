import { Box, CircularProgress } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import SubjectResponse from "../../api/models/response/SubjectResponse";
import Subject from "../../api/Subject";
import SubjectCard from "./SubjectCard/SubjectCard";
import AddSubjectCard from "./AddSubjectCard";
import UserResponse from "../../api/models/response/UserResponse";
import User from "../../api/User";
import StudentGrades from "../../api/StudentGrades";
import StudentSubjectGradeRowResponse from "../../api/models/response/StudentSubjectGradeRowResponse";
import type { TeacherSubjectMetricsResponse } from "../../api/models/response/TeacherStudentsOverviewResponse";
import pageStyles from "./SubjectsCards.module.css";

const SubjectsCards = () => {
  const [subjects, setSubjects] = useState<SubjectResponse[] | undefined>(
    undefined,
  );
  const [user, setUser] = useState<UserResponse | undefined>(undefined);
  const [gradeRows, setGradeRows] = useState<StudentSubjectGradeRowResponse[]>(
    [],
  );
  const [teacherMetricsById, setTeacherMetricsById] = useState<
    Record<string, TeacherSubjectMetricsResponse | null>
  >({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await User.me();
        setUser(response);
      } catch (error) {
        console.error(error);
        setUser(undefined);
      }
    };

    void fetchUser();
  }, []);

  const refreshSubjects = useCallback(async () => {
    try {
      const response = await Subject.getSubjectsForUser();
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    void refreshSubjects();
  }, [refreshSubjects]);

  const role = user?.role?.toLowerCase() ?? "";
  const isStudent = role === "student";
  const isTeacherLike = role === "teacher" || role === "admin";
  const canCreateSubject = isTeacherLike;

  useEffect(() => {
    if (!isStudent) {
      setGradeRows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await StudentGrades.getSubjects();
        if (!cancelled && Array.isArray(rows)) setGradeRows(rows);
      } catch {
        if (!cancelled) setGradeRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  const subjectList = useMemo(
    () => (Array.isArray(subjects) ? subjects : []),
    [subjects],
  );

  useEffect(() => {
    if (!canCreateSubject || subjectList.length === 0) {
      setTeacherMetricsById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        subjectList.map(async (s) => {
          try {
            const o = await Subject.getTeacherStudentsOverview(s.id);
            return [s.id, o.metrics] as const;
          } catch {
            return [s.id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, TeacherSubjectMetricsResponse | null> = {};
      for (const [id, m] of entries) next[id] = m;
      setTeacherMetricsById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [canCreateSubject, subjectList]);

  const gradeBySubject = useMemo(() => {
    const m = new Map<string, StudentSubjectGradeRowResponse>();
    for (const row of gradeRows) m.set(row.subjectId, row);
    return m;
  }, [gradeRows]);

  const handleDelete = async (id: string) => {
    try {
      await Subject.deleteSubject(id);
      setSubjects((prev) =>
        Array.isArray(prev) ? prev.filter((subject) => subject.id !== id) : [],
      );
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const isLoading = subjects === undefined;
  const hasSubjects = subjectList.length > 0;
  const n = subjectList.length;

  const pageTitle = isStudent
    ? "My courses"
    : isTeacherLike
      ? "Teaching"
      : "Courses";
  const subtitle = isStudent
    ? n === 0
      ? "You are not enrolled in any courses yet."
      : `You are enrolled in ${n} course${n === 1 ? "" : "s"}.`
    : isTeacherLike
      ? n === 0
        ? "Create a subject to start teaching."
        : `You are teaching ${n} course${n === 1 ? "" : "s"}.`
      : n === 0
        ? "No courses to show."
        : `${n} course${n === 1 ? "" : "s"} available.`;

  return (
    <Box className={pageStyles.pageWrap}>
      <div className={pageStyles.headerRow}>
        <div className={pageStyles.titleBlock}>
          <h1 className={pageStyles.pageTitle}>{pageTitle}</h1>
          <p className={pageStyles.subtitle}>{subtitle}</p>
        </div>
        {canCreateSubject && (
          <AddSubjectCard variant="button" onCreated={refreshSubjects} />
        )}
      </div>

      {isLoading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={32} />
        </Box>
      ) : !hasSubjects ? (
        <p className={pageStyles.empty}>No subjects yet.</p>
      ) : (
        <div className={pageStyles.grid}>
          {subjectList.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onDelete={handleDelete}
              user={user}
              variant={isStudent ? "student" : "teacher"}
              studentGrade={gradeBySubject.get(subject.id) ?? null}
              teacherMetrics={teacherMetricsById[subject.id] ?? null}
            />
          ))}
        </div>
      )}
    </Box>
  );
};

export default SubjectsCards;
