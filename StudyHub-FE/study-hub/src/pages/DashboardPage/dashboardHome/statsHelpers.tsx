import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import type StudentGradesSummaryResponse from "../../../api/models/response/StudentGradesSummaryResponse";
import type { StatDef } from "./types";

export function buildStudentStatDefs(
  summary: StudentGradesSummaryResponse | undefined,
  courseCount: number,
  deadlinesSoon: number,
): StatDef[] {
  const s = summary;
  const active = s?.activeSubjects ?? courseCount;
  const avg =
    s?.overallAveragePercent != null
      ? `${Math.round(s.overallAveragePercent)}%`
      : "—";
  return [
    {
      value: String(courseCount),
      label: "My courses",
      hint: "Subjects you are enrolled in",
      icon: <SchoolOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#3b82f6",
    },
    {
      value: String(active),
      label: "Active subjects",
      hint: "With graded activity",
      icon: <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#7c3aed",
    },
    {
      value: String(deadlinesSoon),
      label: "Due in 7 days",
      hint: "Upcoming deadlines",
      icon: <EventAvailableOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#ea580c",
    },
    {
      value: avg,
      label: "Overall average",
      hint: "From graded work",
      icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#16a34a",
    },
  ];
}

export function buildTeacherStatDefs(
  uniqueStudentCount: number | null,
  subjectCount: number,
  deadlinesSoon: number,
  teacherAvg: number | null,
): StatDef[] {
  const total = uniqueStudentCount ?? 0;
  const avg = teacherAvg != null ? `${Math.round(teacherAvg)}%` : "—";
  return [
    {
      value: String(total),
      label: "Total students",
      hint: "Unique across your subjects",
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#3b82f6",
    },
    {
      value: String(subjectCount),
      label: "Active subjects",
      hint: "Courses you manage",
      icon: <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#7c3aed",
    },
    {
      value: String(deadlinesSoon),
      label: "Deadlines (7 days)",
      hint: "Assignments closing soon",
      icon: <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#ea580c",
    },
    {
      value: avg,
      label: "Class average",
      hint: "Across subjects (where available)",
      icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 22 }} />,
      color: "#16a34a",
    },
  ];
}
