import { Button, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import styles from "../DashboardHome.module.css";
import {
  eventDisplayTitle,
  formatLong,
  formatSelectedDayHeading,
} from "./helpers";
import type { DashboardEvent, OpenNowRow } from "./types";

function AssignmentEventRow({ e }: { e: DashboardEvent }) {
  return (
    <div className={styles.eventRow}>
      <div
        className={styles.eventIcon}
        style={{
          backgroundColor:
            e.kind === "deadline"
              ? "rgba(22, 163, 74, 0.15)"
              : "rgba(59, 130, 246, 0.15)",
          color: e.kind === "deadline" ? "#15803d" : "#1d4ed8",
        }}
      >
        {e.kind === "deadline" ? (
          <CheckCircleOutlineIcon fontSize="small" />
        ) : (
          <MenuBookIcon fontSize="small" />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className={styles.eventTitleRow}>
          <span className={styles.eventTitleText}>{eventDisplayTitle(e)}</span>
          <span
            className={`${styles.kindBadge} ${
              e.kind === "deadline"
                ? styles.kindBadgeDue
                : styles.kindBadgeOpens
            }`}
          >
            {e.kind === "deadline" ? "Due" : "Opens"}
          </span>
        </div>
        <div className={styles.eventSub}>{e.subjectName}</div>
        <div className={styles.eventTime}>{formatLong(e.at)}</div>
      </div>
    </div>
  );
}

function OpenNowEventRow({ row }: { row: OpenNowRow }) {
  return (
    <div className={styles.eventRow}>
      <div
        className={styles.eventIcon}
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.18)",
          color: "#b45309",
        }}
      >
        <HourglassTopOutlinedIcon fontSize="small" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className={styles.eventTitleRow}>
          <span className={styles.eventTitleText}>{row.title}</span>
          <span
            className={`${styles.kindBadge} ${styles.kindBadgeOpenNow}`}
          >
            Open now
          </span>
        </div>
        <div className={styles.eventSub}>{row.subjectName}</div>
        <div className={styles.openNowMeta}>Due {formatLong(row.close)}</div>
      </div>
    </div>
  );
}

type Props = {
  selectedCalendarDay: Date | null;
  onClearCalendarSelection: () => void;
  calendarDayEvents: DashboardEvent[];
  openNowRows: OpenNowRow[];
  thisWeekEvents: DashboardEvent[];
  /** When set, caps panel height to match the calendar column so the list scrolls. */
  panelMaxHeightPx?: number | null;
};

export default function DashboardHomeUpcoming({
  selectedCalendarDay,
  onClearCalendarSelection,
  calendarDayEvents,
  openNowRows,
  thisWeekEvents,
  panelMaxHeightPx,
}: Props) {
  const capStyle =
    panelMaxHeightPx != null && panelMaxHeightPx > 0
      ? ({
          maxHeight: panelMaxHeightPx,
          overflow: "hidden",
        } as const)
      : undefined;

  return (
    <section
      className={`${styles.panel} ${styles.panelUpcoming}`}
      style={capStyle}
    >
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <ScheduleOutlinedIcon sx={{ color: "#7c3aed", fontSize: 22 }} />
          {selectedCalendarDay
            ? formatSelectedDayHeading(selectedCalendarDay)
            : "Upcoming"}
        </div>
        {selectedCalendarDay ? (
          <Button
            type="button"
            size="small"
            variant="text"
            sx={{ flexShrink: 0, textTransform: "none" }}
            onClick={onClearCalendarSelection}
          >
            Show grouped view
          </Button>
        ) : null}
      </div>
      {selectedCalendarDay ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.5 }}
        >
          Tap a date again to clear the selection. Badges show whether the time
          is an opening or a due date.
        </Typography>
      ) : null}
      <div className={styles.eventListGrow}>
        {selectedCalendarDay ? (
          <div className={styles.eventList}>
            {calendarDayEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No assignment openings or deadlines on this day.
              </Typography>
            ) : (
              calendarDayEvents.map((e) => (
                <AssignmentEventRow key={e.id} e={e} />
              ))
            )}
          </div>
        ) : openNowRows.length === 0 && thisWeekEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing open right now and no openings or dues in the next 7 days.
          </Typography>
        ) : (
          <div className={styles.upcomingStack}>
            <div className={styles.upcomingSection}>
              <h3 className={styles.upcomingSectionTitle}>Open now</h3>
              <p className={styles.upcomingSectionHint}>
                Assignments whose window is active (after open time, before the
                due date).
              </p>
              <div className={styles.eventList}>
                {openNowRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No assignment windows are open at the moment.
                  </Typography>
                ) : (
                  openNowRows.map((row) => (
                    <OpenNowEventRow key={row.id} row={row} />
                  ))
                )}
              </div>
            </div>
            <div className={styles.upcomingSection}>
              <h3 className={styles.upcomingSectionTitle}>This week</h3>
              <p className={styles.upcomingSectionHint}>
                Opens or dues scheduled in the next 7 days (after now).
              </p>
              <div className={styles.eventList}>
                {thisWeekEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No openings or dues in the next week.
                  </Typography>
                ) : (
                  thisWeekEvents.map((e) => (
                    <AssignmentEventRow key={e.id} e={e} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
