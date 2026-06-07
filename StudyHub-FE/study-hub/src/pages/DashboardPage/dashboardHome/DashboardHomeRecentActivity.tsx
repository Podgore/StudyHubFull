import { Typography } from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import styles from "../DashboardHome.module.css";
import type { ActivityFeedItem } from "./types";

type Props = {
  isTeacherLike: boolean;
  isStudent: boolean;
  teacherActivity: ActivityFeedItem[];
  studentActivity: ActivityFeedItem[];
};

export default function DashboardHomeRecentActivity({
  isTeacherLike,
  isStudent,
  teacherActivity,
  studentActivity,
}: Props) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <NotificationsNoneOutlinedIcon
            sx={{ color: "#2563eb", fontSize: 22 }}
          />
          Recent activity
        </div>
      </div>
      <div className={styles.activityList}>
        {isTeacherLike ? (
          teacherActivity.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Student activity will show here as learners open subjects and
              submit work.
            </Typography>
          ) : (
            teacherActivity.map((a) => (
              <div key={a.id} className={styles.activityRow}>
                <div
                  className={styles.activityIcon}
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    color: "#2563eb",
                  }}
                >
                  <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
                </div>
                <div>
                  <div className={styles.activityText}>{a.text}</div>
                  <div className={styles.activityWhen}>{a.when}</div>
                </div>
              </div>
            ))
          )
        ) : isStudent ? (
          studentActivity.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Open <strong>My grades</strong> to see detailed progress per
              subject.
            </Typography>
          ) : (
            studentActivity.map((a) => (
              <div key={a.id} className={styles.activityRow}>
                <div
                  className={styles.activityIcon}
                  style={{
                    backgroundColor:
                      a.tone === "ok"
                        ? "rgba(22, 163, 74, 0.12)"
                        : "rgba(59, 130, 246, 0.12)",
                    color: a.tone === "ok" ? "#15803d" : "#2563eb",
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                </div>
                <div>
                  <div className={styles.activityText}>{a.text}</div>
                  <div className={styles.activityWhen}>{a.when}</div>
                </div>
              </div>
            ))
          )
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sign in as a student or teacher to see tailored activity.
          </Typography>
        )}
      </div>
    </section>
  );
}
