import type AssignmentResponse from "../../../api/models/response/AssignmentResponse";
import type SubjectResponse from "../../../api/models/response/SubjectResponse";
import type { TeacherStudentsOverviewResponse } from "../../../api/models/response/TeacherStudentsOverviewResponse";
import type StudentGradesSummaryResponse from "../../../api/models/response/StudentGradesSummaryResponse";
import type {
  ActivityFeedItem,
  CalendarCell,
  DashboardEvent,
  OpenNowRow,
} from "./types";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatLong(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(d: Date): string {
  return d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatSelectedDayHeading(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCalendarMonthLabel(d: Date): string {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function eventDisplayTitle(e: DashboardEvent): string {
  const t = e.title.replace(/\s*—\s*(due|opens)$/i, "").trim();
  return t || e.title;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "";

  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "just now";

  const units = [
    { label: "day",  ms: 86_400_000 },
    { label: "hour", ms:  3_600_000 },
    { label: "min",  ms:     60_000 },
  ];

  for (const { label, ms } of units) {
    const value = Math.floor(diff / ms);
    if (value >= 1) {
      const plural = label === "min" ? "" : value === 1 ? "" : "s";
      return `${value} ${label}${plural} ago`;
    }
  }

  return "";
}

export function buildEvents(
  subjects: SubjectResponse[],
  bySubject: Map<string, AssignmentResponse[]>,
): DashboardEvent[] {
  const out: DashboardEvent[] = [];
  for (const s of subjects) {
    const list = bySubject.get(s.id) ?? [];
    for (const a of list) {
      const close = new Date(a.closingDate);
      const open = new Date(a.openingDate);
      if (!Number.isNaN(close.getTime())) {
        out.push({
          id: `${a.id}-close`,
          kind: "deadline",
          title: `${a.title} — due`,
          subjectName: s.title,
          subjectId: s.id,
          at: close,
        });
      }
      if (!Number.isNaN(open.getTime())) {
        out.push({
          id: `${a.id}-open`,
          kind: "opens",
          title: `${a.title} — opens`,
          subjectName: s.title,
          subjectId: s.id,
          at: open,
        });
      }
    }
  }
  out.sort((x, y) => x.at.getTime() - y.at.getTime());
  return out;
}

export function countDeadlinesInNextWeek(
  assignmentsBySubject: Map<string, AssignmentResponse[]>,
): number {
  const t = Date.now();
  const weekEnd = t + 7 * 24 * 60 * 60 * 1000;
  let n = 0;
  for (const a of assignmentsBySubject.values()) {
    for (const row of a) {
      const c = new Date(row.closingDate);
      if (Number.isNaN(c.getTime())) continue;
      if (c.getTime() >= t && c.getTime() <= weekEnd) n += 1;
    }
  }
  return n;
}

export function buildOpenNowRows(
  subjectList: SubjectResponse[],
  assignmentsBySubject: Map<string, AssignmentResponse[]>,
): OpenNowRow[] {
  const t = Date.now();
  const rows: OpenNowRow[] = [];
  for (const s of subjectList) {
    for (const a of assignmentsBySubject.get(s.id) ?? []) {
      const open = new Date(a.openingDate).getTime();
      const close = new Date(a.closingDate).getTime();
      if (Number.isNaN(open) || Number.isNaN(close)) continue;
      if (open <= t && t <= close) {
        rows.push({
          id: a.id,
          title: a.title,
          subjectName: s.title,
          subjectId: s.id,
          close: new Date(a.closingDate),
        });
      }
    }
  }
  rows.sort((a, b) => a.close.getTime() - b.close.getTime());
  return rows;
}

export function filterEventsThisWeek(events: DashboardEvent[]): DashboardEvent[] {
  const t = Date.now();
  const weekEnd = t + 7 * 24 * 60 * 60 * 1000;
  return events
    .filter((e) => {
      const x = e.at.getTime();
      return x > t && x <= weekEnd;
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function filterEventsForCalendarDay(
  events: DashboardEvent[],
  selectedCalendarDay: Date | null,
): DashboardEvent[] {
  if (!selectedCalendarDay) return [];
  const sod = startOfDay(selectedCalendarDay);
  return events
    .filter((e) => isSameDay(e.at, sod))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function buildDaysWithEventsSet(events: DashboardEvent[]): Set<string> {
  const set = new Set<string>();
  for (const e of events) {
    set.add(`${e.at.getFullYear()}-${e.at.getMonth()}-${e.at.getDate()}`);
  }
  return set;
}

export function buildCalendarCells(calendarMonth: Date): CalendarCell[] {
  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDow; i += 1) {
    const d = new Date(y, m, -firstDow + i + 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ date: new Date(y, m, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const n = new Date(last);
    n.setDate(n.getDate() + 1);
    cells.push({ date: n, inMonth: false });
  }
  return cells;
}

export function buildTeacherActivityFeed(
  overviews: TeacherStudentsOverviewResponse[],
): ActivityFeedItem[] {
  const rows = overviews.flatMap((o) => o.students ?? []);
  const sorted = [...rows]
    .filter((r) => r.lastActivityAt)
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt!).getTime() -
        new Date(a.lastActivityAt!).getTime(),
    )
    .slice(0, 5);
  return sorted.map((r) => ({
    id: r.studentId,
    text: `${r.fullName} was active in your courses`,
    when: relativeTime(r.lastActivityAt),
    tone: "neutral" as const,
  }));
}

export function buildStudentActivityFeed(
  summary: StudentGradesSummaryResponse | undefined,
): ActivityFeedItem[] {
  if (!summary) return [];
  const items: ActivityFeedItem[] = [];
  if (summary.totalAssignments > 0) {
    items.push({
      id: "progress",
      text: `You have completed ${summary.completedAssignments} of ${summary.totalAssignments} graded items.`,
      when: "Progress",
      tone: "ok",
    });
  }
  if (summary.completionRatePercent != null) {
    items.push({
      id: "rate",
      text: `Overall completion rate is about ${Math.round(summary.completionRatePercent)}%.`,
      when: "Summary",
      tone: "info",
    });
  }
  return items.slice(0, 4);
}

export function toggleCalendarDaySelection(
  prev: Date | null,
  date: Date,
): Date | null {
  const sod = startOfDay(date);
  return prev && isSameDay(prev, sod) ? null : sod;
}
