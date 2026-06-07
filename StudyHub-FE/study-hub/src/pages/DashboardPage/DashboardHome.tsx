import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import styles from "./DashboardHome.module.css";
import DashboardHomeCalendar from "./dashboardHome/DashboardHomeCalendar";
import DashboardHomeRecentActivity from "./dashboardHome/DashboardHomeRecentActivity";
import DashboardHomeStatsRow from "./dashboardHome/DashboardHomeStatsRow";
import DashboardHomeTodayEvents from "./dashboardHome/DashboardHomeTodayEvents";
import DashboardHomeUpcoming from "./dashboardHome/DashboardHomeUpcoming";
import {
  buildEvents,
  buildOpenNowRows,
  buildStudentActivityFeed,
  buildTeacherActivityFeed,
  countDeadlinesInNextWeek,
  filterEventsForCalendarDay,
  filterEventsThisWeek,
  isSameDay,
  startOfDay,
  toggleCalendarDaySelection,
} from "./dashboardHome/helpers";
import { buildStudentStatDefs, buildTeacherStatDefs } from "./dashboardHome/statsHelpers";
import type { DashboardHomeProps, StatDef } from "./dashboardHome/types";
import { useDashboardHomeData } from "./dashboardHome/useDashboardHomeData";

const DashboardHome = ({ user }: DashboardHomeProps) => {
  const {
    isTeacherLike,
    isStudent,
    subjects,
    assignmentsBySubject,
    summary,
    uniqueStudentCount,
    teacherAvg,
    overviews,
    loadErr,
  } = useDashboardHomeData(user);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(
    null,
  );
  const calendarMeasureRef = useRef<HTMLDivElement>(null);
  const [upcomingPanelMaxPx, setUpcomingPanelMaxPx] = useState<number | null>(null);

  const subjectList = useMemo(
    () => (Array.isArray(subjects) ? subjects : []),
    [subjects],
  );

  const events = useMemo(
    () => buildEvents(subjectList, assignmentsBySubject),
    [subjectList, assignmentsBySubject],
  );

  useLayoutEffect(() => {
    const el = calendarMeasureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const apply = () => {
      const h = el.getBoundingClientRect().height;
      if (Number.isFinite(h) && h >= 120) setUpcomingPanelMaxPx(Math.round(h));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [calendarMonth, events, selectedCalendarDay]);

  const deadlinesSoon = useMemo(
    () => countDeadlinesInNextWeek(assignmentsBySubject),
    [assignmentsBySubject],
  );

  const openNowRows = useMemo(
    () => buildOpenNowRows(subjectList, assignmentsBySubject),
    [subjectList, assignmentsBySubject],
  );

  const thisWeekEvents = useMemo(
    () => filterEventsThisWeek(events),
    [events],
  );

  const calendarDayEvents = useMemo(
    () => filterEventsForCalendarDay(events, selectedCalendarDay),
    [events, selectedCalendarDay],
  );

  const handleCalendarDayClick = (date: Date) => {
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedCalendarDay((prev) => toggleCalendarDaySelection(prev, date));
  };

  const todayEvents = useMemo(() => {
    const sod = startOfDay(new Date());
    return events.filter((e) => isSameDay(e.at, sod)).slice(0, 4);
  }, [events]);

  const teacherActivity = useMemo(
    () => buildTeacherActivityFeed(overviews),
    [overviews],
  );

  const studentActivity = useMemo(
    () => buildStudentActivityFeed(summary),
    [summary],
  );

  const stats: StatDef[] = useMemo(() => {
    if (isStudent) {
      return buildStudentStatDefs(
        summary,
        subjectList.length,
        deadlinesSoon,
      );
    }
    return buildTeacherStatDefs(
      uniqueStudentCount,
      subjectList.length,
      deadlinesSoon,
      teacherAvg,
    );
  }, [
    isStudent,
    summary,
    subjectList.length,
    deadlinesSoon,
    uniqueStudentCount,
    teacherAvg,
  ]);

  if (!user) {
    return (
      <div className={styles.loadingBox}>
        <CircularProgress size={28} />
      </div>
    );
  }

  if (subjects === undefined) {
    return (
      <div className={styles.loadingBox}>
        <CircularProgress size={28} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {loadErr && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadErr}
        </Alert>
      )}

      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.subtitle}>
        Welcome back! Here&apos;s what&apos;s happening today.
      </p>

      <DashboardHomeStatsRow stats={stats} />

      <div className={styles.midRow}>
        <div ref={calendarMeasureRef} className={styles.midRowCalendarMeasure}>
          <DashboardHomeCalendar
            events={events}
            calendarMonth={calendarMonth}
            onCalendarMonthChange={setCalendarMonth}
            selectedCalendarDay={selectedCalendarDay}
            onDayClick={handleCalendarDayClick}
          />
        </div>
        <DashboardHomeUpcoming
          selectedCalendarDay={selectedCalendarDay}
          onClearCalendarSelection={() => setSelectedCalendarDay(null)}
          calendarDayEvents={calendarDayEvents}
          openNowRows={openNowRows}
          thisWeekEvents={thisWeekEvents}
          panelMaxHeightPx={upcomingPanelMaxPx}
        />
      </div>

      <div className={styles.bottomRow}>
        <DashboardHomeTodayEvents todayEvents={todayEvents} />
        <DashboardHomeRecentActivity
          isTeacherLike={isTeacherLike}
          isStudent={isStudent}
          teacherActivity={teacherActivity}
          studentActivity={studentActivity}
        />
      </div>
    </div>
  );
};

export default DashboardHome;
