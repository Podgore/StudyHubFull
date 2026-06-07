import { Chip } from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import styles from "./AssignmentHeroChips.module.css";
import { STUDYHUB_PRIMARY_MAIN } from "../../../theme/studyHubPalette";

const chipSx = {
    color: "#fff",
    fontWeight: 700,
    border: "none",
    "& .MuiChip-icon": { color: "#fff" },
} as const;

export default function AssignmentHeroChips(props: {
    openLabel: string;
    dueLabel: string;
    maxMark: number;
}) {
    return (
        <>
            <Chip
                icon={<HomeWorkOutlinedIcon className={styles.icon} />}
                label="Homework / task"
                size="medium"
                className={styles.chip}
                sx={{ ...chipSx, backgroundColor: STUDYHUB_PRIMARY_MAIN }}
            />
            <Chip
                icon={<GradeOutlinedIcon className={styles.icon} />}
                label={`${props.maxMark} pts`}
                size="medium"
                className={styles.chip}
                sx={{ ...chipSx, backgroundColor: "#2196f3" }}
            />
            <Chip
                icon={<CalendarTodayOutlinedIcon className={styles.icon} />}
                label={`Opens ${props.openLabel}`}
                size="medium"
                className={`${styles.chip} ${styles.opens}`}
                sx={{ ...chipSx, backgroundColor: "#43a047" }}
            />
            <Chip
                icon={<ScheduleOutlinedIcon className={styles.icon} />}
                label={`Due ${props.dueLabel}`}
                size="medium"
                className={styles.chip}
                sx={{ ...chipSx, backgroundColor: "#fb8c00" }}
            />
        </>
    );
}

