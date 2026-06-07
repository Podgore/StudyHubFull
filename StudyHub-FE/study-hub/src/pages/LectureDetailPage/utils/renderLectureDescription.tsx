import type { ReactNode } from "react";
import type { LectureMaterialResponse } from "../../../api/models/response/LectureMaterialResponse";
import styles from "../LectureDetailPage.module.css";

export interface RenderLectureDescriptionOptions {
    onNavigateToMaterial?: (materialId: string) => void;
}

export function renderLectureDescriptionWithMaterialLinks(
    text: string,
    materials: LectureMaterialResponse[],
    options?: RenderLectureDescriptionOptions
): ReactNode {
    const byId = new Map(materials.map((m) => [m.id, m]));
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const re = /\[(.+?)\]\(#lecture-material-([0-9a-fA-F-]{36})\)|#lecture-material-([0-9a-fA-F-]{36})/g;
    let key = 0;

    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(
                <span key={`t${key++}`} className={styles.descriptionPlain}>
                    {text.slice(lastIndex, match.index)}
                </span>
            );
        }
        const id = (match[2] || match[3]) as string;
        const label = match[2] ? match[1] : byId.get(id)?.title ?? "Material";
        nodes.push(
            <a
                key={`l${key++}`}
                href={`#lecture-material-${id}`}
                className={styles.descMaterialLink}
                onClick={() => options?.onNavigateToMaterial?.(id)}
            >
                {label}
            </a>
        );
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push(
            <span key={`t${key++}`} className={styles.descriptionPlain}>
                {text.slice(lastIndex)}
            </span>
        );
    }

    if (nodes.length === 0) {
        return (
            <span className={styles.descriptionPlain} style={{ whiteSpace: "pre-wrap" }}>
                {text}
            </span>
        );
    }

    return (
        <span className={styles.descriptionPlain} style={{ whiteSpace: "pre-wrap" }}>
            {nodes}
        </span>
    );
}

export function materialAnchorForId(materialId: string): string {
    return `#lecture-material-${materialId}`;
}

export function markdownMaterialLink(materialId: string, title: string): string {
    const safeTitle = title.replace(/[[\]]/g, "").trim() || "Material";
    return `[${safeTitle}](${materialAnchorForId(materialId)})`;
}
