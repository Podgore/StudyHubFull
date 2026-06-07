import { Stack, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import styles from "../DashboardHome.module.css";
import { formatTime } from "./helpers";
import type { DashboardEvent } from "./types";

type Props = {
  todayEvents: DashboardEvent[];
};

export default function DashboardHomeTodayEvents({ todayEvents }: Props) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Today&apos;s events</div>
      </div>
      {todayEvents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing scheduled for today in assignment dates.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {todayEvents.map((e) => (
            <div key={e.id} className={styles.todayCard}>
              <div className={styles.todayCardTitle}>{e.title}</div>
              <div className={styles.todayCardSub}>{e.subjectName}</div>
              <div className={styles.todayCardTime}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
                {formatTime(e.at)}
              </div>
            </div>
          ))}
        </Stack>
      )}
    </section>
  );
}
