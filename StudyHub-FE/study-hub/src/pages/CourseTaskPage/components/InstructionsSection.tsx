import { Typography } from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import EditAssignmentModal from "../../../components/AssignmentBuilder/EditAssignmentModal";
import type AssignmentResponse from "../../../api/models/response/AssignmentResponse";
import SectionCard from "./SectionCard";
import styles from "./InstructionsSection.module.css";

function hasInstructions(text: string | null | undefined): boolean {
  return typeof text === "string" && text.trim().length > 0;
}

export default function InstructionsSection(props: {
    assignment: AssignmentResponse;
    isTeacher: boolean;
    onUpdated: () => void;
}) {
    const body = hasInstructions(props.assignment.instructions) ? (
        <Typography component="div" className={styles.text}>
            {props.assignment.instructions}
        </Typography>
    ) : (
        <Typography variant="body2" color="text.secondary" className={styles.empty}>
            No instructions for this task.
        </Typography>
    );

    return (
        <SectionCard
            icon={<ArticleOutlinedIcon />}
            title="Instructions"
            tone="instructions"
            headerExtra={
                props.isTeacher ? (
                    <EditAssignmentModal assignment={props.assignment} onUpdated={props.onUpdated} trigger="icon" />
                ) : undefined
            }
        >
            {body}
        </SectionCard>
    );
}
