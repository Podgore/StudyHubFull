import { Box, Skeleton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import shell from "../../../layouts/AuthenticatedShell.module.css";
import PageHeader from "../../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../../components/ButtonsMenu/ButtonsMenu";
import type UserResponse from "../../../api/models/response/UserResponse";
import styles from "./CourseTaskLoading.module.css";

export default function CourseTaskLoading(props: { user?: UserResponse }) {
    return (
        <div className={shell.pageShell}>
            <PageHeader user={props.user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={props.user} />
                <Box
                    className={shell.mainScroll}
                    sx={(t) => ({
                        "--st-loading-bg": alpha(t.palette.grey[500], 0.04),
                    })}
                >
                    <Box className={styles.scroll}>
                        <Box className={styles.content}>
                            <Skeleton variant="rounded" height={36} className={styles.sk1} />
                            <Skeleton variant="text" width="45%" height={44} sx={{ mb: 1 }} />
                            <Skeleton variant="rounded" height={40} width="85%" sx={{ mb: 2.5 }} />
                            <Box className={styles.layout}>
                                <Box className={styles.leftCol}>
                                    <Skeleton variant="rounded" height={120} className={styles.skCard} />
                                    <Skeleton variant="rounded" height={180} className={styles.skCard} />
                                    <Skeleton variant="rounded" height={140} className={styles.skCard} />
                                </Box>
                                <Box className={styles.rightCol}>
                                    <Skeleton variant="rounded" height={320} className={styles.skCard} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </div>
        </div>
    );
}
