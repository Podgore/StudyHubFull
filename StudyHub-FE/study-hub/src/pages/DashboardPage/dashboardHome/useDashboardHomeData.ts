import { useCallback, useEffect, useRef, useState } from "react";
import Subject from "../../../api/Subject";
import StudentGrades from "../../../api/StudentGrades";
import type AssignmentResponse from "../../../api/models/response/AssignmentResponse";
import type SubjectResponse from "../../../api/models/response/SubjectResponse";
import type UserResponse from "../../../api/models/response/UserResponse";
import type StudentGradesSummaryResponse from "../../../api/models/response/StudentGradesSummaryResponse";
import type { TeacherStudentsOverviewResponse } from "../../../api/models/response/TeacherStudentsOverviewResponse";

export function useDashboardHomeData(user: UserResponse | undefined) {
  const userId = user?.id;
  const role = user?.role?.toLowerCase() ?? "";
  const isTeacherLike = role === "teacher" || role === "admin";
  const isStudent = role === "student";

  const [subjects, setSubjects] = useState<SubjectResponse[] | undefined>(undefined);
  const [assignmentsBySubject, setAssignmentsBySubject] = useState<Map<string, AssignmentResponse[]>>(new Map());
  const [summary, setSummary] = useState<StudentGradesSummaryResponse | undefined>(undefined);
  const [uniqueStudentCount, setUniqueStudentCount] = useState<number | null>(null);
  const [teacherAvg, setTeacherAvg] = useState<number | null>(null);
  const [overviews, setOverviews] = useState<TeacherStudentsOverviewResponse[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    if (!userId) return;
    const gen = ++loadGeneration.current;
    setLoadErr(null);
    try {
      const subj = await Subject.getSubjectsForUser();
      if (gen !== loadGeneration.current) return;
      const list = Array.isArray(subj) ? subj : [];
      setSubjects(list);

      const pairs = await Promise.all(
        list.map(async (s) => {
          const rows = await Subject.getSubjectWithAssignment(s.id);
          return [s.id, Array.isArray(rows) ? rows : []] as const;
        }),
      );
      if (gen !== loadGeneration.current) return;
      const map = new Map<string, AssignmentResponse[]>();
      for (const [id, rows] of pairs) map.set(id, rows);
      setAssignmentsBySubject(map);

      if (role === "student") {
        const sum = await StudentGrades.getSummary();
        if (gen !== loadGeneration.current) return;
        setSummary(sum);
      } else {
        setSummary(undefined);
      }

      if (isTeacherLike && list.length > 0) {
        const idSet = new Set<string>();
        await Promise.all(
          list.map(async (s) => {
            const studs = await Subject.getSubjectStudents(s.id);
            studs?.forEach((u) => idSet.add(u.id));
          }),
        );
        if (gen !== loadGeneration.current) return;
        setUniqueStudentCount(idSet.size);

        const ovs = await Promise.all(
          list.map(async (s) => {
            try {
              return await Subject.getTeacherStudentsOverview(s.id);
            } catch {
              return {
                metrics: {
                  totalStudents: 0,
                  activeStudents: 0,
                  averageScorePercent: null,
                  averageCompletionPercent: null,
                },
                assignments: [],
                students: [],
              } satisfies TeacherStudentsOverviewResponse;
            }
          }),
        );
        if (gen !== loadGeneration.current) return;
        setOverviews(ovs);
        const scores = ovs
          .map((o) => o.metrics?.averageScorePercent)
          .filter((n): n is number => n != null && !Number.isNaN(n));
        if (scores.length > 0) {
          setTeacherAvg(
            Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          );
        } else setTeacherAvg(null);
      } else {
        setUniqueStudentCount(null);
        setTeacherAvg(null);
        setOverviews([]);
      }
    } catch {
      if (gen !== loadGeneration.current) return;
      setLoadErr("Could not load dashboard data.");
      setSubjects([]);
      setAssignmentsBySubject(new Map());
    }
  }, [userId, role, isTeacherLike]);

  useEffect(() => {
    if (!userId) return;
    void load();
  }, [userId, role, load]);

  return {
    role,
    isTeacherLike,
    isStudent,
    subjects,
    assignmentsBySubject,
    summary,
    uniqueStudentCount,
    teacherAvg,
    overviews,
    loadErr,
  };
}
