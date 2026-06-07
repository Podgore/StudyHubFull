import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import type { HighlightedHTMLElement } from "highlight.js";
import "highlight.js/styles/tokyo-night-dark.css";
import styles from "../LectureDetailPage.module.css";

const LANG_ALIASES: Record<string, string> = {
    "c#": "csharp",
    cs: "csharp",
    csharp: "csharp",
    "c++": "cpp",
    cpp: "cpp",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    md: "markdown",
};

const LANGUAGE_LABELS: Record<string, string> = {
    bash: "Bash",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    css: "CSS",
    go: "Go",
    html: "HTML",
    java: "Java",
    javascript: "JavaScript",
    json: "JSON",
    kotlin: "Kotlin",
    markdown: "Markdown",
    php: "PHP",
    plaintext: "Plain text",
    python: "Python",
    ruby: "Ruby",
    rust: "Rust",
    scss: "SCSS",
    shell: "Shell",
    sql: "SQL",
    swift: "Swift",
    typescript: "TypeScript",
    xml: "XML",
    yaml: "YAML",
};

function resolveLanguage(lang: string | null | undefined): string | undefined {
    if (!lang?.trim()) return undefined;
    const key = lang.trim().toLowerCase();
    return LANG_ALIASES[key] ?? key;
}

function languageDisplayName(hljsLanguageId: string | undefined | null): string {
    if (!hljsLanguageId) return "Plain text";
    return LANGUAGE_LABELS[hljsLanguageId] ?? hljsLanguageId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialBarLabel(language: string | null | undefined): string {
    const resolved = resolveLanguage(language);
    if (resolved && hljs.getLanguage(resolved)) {
        return languageDisplayName(resolved);
    }
    if (language?.trim()) {
        return language.trim();
    }
    return "Auto";
}

export interface HighlightedCodeBlockProps {
    code: string;
    language?: string | null;
}

const HighlightedCodeBlock = ({ code, language }: HighlightedCodeBlockProps) => {
    const ref = useRef<HighlightedHTMLElement | null>(null);
    const [langLabel, setLangLabel] = useState(() => initialBarLabel(language));

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (!code) {
            setLangLabel(initialBarLabel(language));
            return;
        }

        delete el.dataset.highlighted;
        el.textContent = code;
        el.removeAttribute("class");

        const resolved = resolveLanguage(language);
        if (resolved && hljs.getLanguage(resolved)) {
            el.classList.add(`language-${resolved}`);
        }

        hljs.highlightElement(el);

        const used = (el.result as { language?: string } | undefined)?.language;
        setLangLabel(languageDisplayName(used));
    }, [code, language]);

    return (
        <div className={styles.codeBlockShell}>
            <div className={styles.codeBlockLangBar}>{langLabel}</div>
            <pre className={styles.codeBlockPre}>
                <code ref={ref} />
            </pre>
        </div>
    );
};

export default HighlightedCodeBlock;
