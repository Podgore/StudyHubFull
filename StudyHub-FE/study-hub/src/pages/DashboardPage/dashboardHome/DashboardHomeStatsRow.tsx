import styles from "../DashboardHome.module.css";
import type { StatDef } from "./types";

type Props = {
  stats: StatDef[];
};

export default function DashboardHomeStatsRow({ stats }: Props) {
  return (
    <div className={styles.statsRow}>
      {stats.map((s) => (
        <div key={s.label} className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ backgroundColor: s.color }}
          >
            {s.icon}
          </div>
          <div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statHint}>{s.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
