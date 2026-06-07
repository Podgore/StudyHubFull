import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import styles from "./SectionCard.module.css";

export type SectionTone = "default" | "materials" | "instructions";

export default function SectionCard(props: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    headerExtra?: ReactNode;
    tone?: SectionTone;
}) {
    const theme = useTheme();
    const tone = props.tone ?? "default";
    const iconColor =
        tone === "materials"
            ? theme.palette.success.main
            : tone === "instructions"
              ? theme.palette.secondary.main
              : theme.palette.primary.main;

    return (
        <Paper elevation={0} className={styles.card}>
            <Box
                className={styles.header}
                style={
                    {
                        ["--st-section-icon-color" as any]: iconColor,
                    } as React.CSSProperties
                }
            >
                <Box className={styles.titleRow}>
                    <Box className={styles.icon}>{props.icon}</Box>
                    <Typography component="h2" className={styles.title}>
                        {props.title}
                    </Typography>
                </Box>
                {props.headerExtra}
            </Box>
            <Box className={styles.body}>{props.children}</Box>
        </Paper>
    );
}

