import { useMemo } from "react";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import styles from "../DashboardHome.module.css";
import {
  WEEKDAYS,
  buildCalendarCells,
  buildDaysWithEventsSet,
  formatCalendarMonthLabel,
  isSameDay,
} from "./helpers";
import type { DashboardEvent } from "./types";

type Props = {
  events: DashboardEvent[];
  calendarMonth: Date;
  onCalendarMonthChange: (d: Date) => void;
  selectedCalendarDay: Date | null;
  onDayClick: (date: Date) => void;
};

export default function DashboardHomeCalendar({
  events,
  calendarMonth,
  onCalendarMonthChange,
  selectedCalendarDay,
  onDayClick,
}: Props) {
  const monthLabel = formatCalendarMonthLabel(calendarMonth);
  const calendarCells = useMemo(
    () => buildCalendarCells(calendarMonth),
    [calendarMonth],
  );
  const daysWithEvents = useMemo(
    () => buildDaysWithEventsSet(events),
    [events],
  );

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <CalendarMonthOutlinedIcon sx={{ color: "#db2777", fontSize: 22 }} />
          Calendar
        </div>
        <span className={styles.panelMeta}>{monthLabel}</span>
      </div>
      <div className={styles.calendarNav}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            onCalendarMonthChange(
              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
            )
          }
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            onCalendarMonthChange(
              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
            )
          }
        >
          ›
        </button>
      </div>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className={styles.grid}>
        {calendarCells.map(({ date, inMonth }, idx) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const has = daysWithEvents.has(key);
          const today = isSameDay(date, new Date());
          const selected =
            selectedCalendarDay != null && isSameDay(date, selectedCalendarDay);
          const label = inMonth
            ? `${monthLabel} ${date.getDate()}`
            : `${date.toLocaleDateString(undefined, { month: "short" })} ${date.getDate()}`;
          return (
            <button
              key={`${key}-${inMonth}-${idx}`}
              type="button"
              className={[
                styles.dayCell,
                styles.dayCellBtn,
                !inMonth ? styles.dayCellMuted : "",
                today ? styles.dayCellToday : "",
                selected ? styles.dayCellSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onDayClick(date)}
            >
              <span>{date.getDate()}</span>
              {has ? <span className={styles.dayDot} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
