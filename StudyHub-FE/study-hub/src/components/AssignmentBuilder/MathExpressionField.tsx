import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import "mathquill/build/mathquill.css";

let mathQuillScriptLoaded = false;

function ensureMathQuillLoaded(): void {
    if (mathQuillScriptLoaded) return;
    // MathQuill reads window.jQuery when the script executes — set it first.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const jq = require("jquery") as unknown;
    (window as unknown as { jQuery: unknown; $: unknown }).jQuery = jq;
    (window as unknown as { $: unknown }).$ = jq;
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    require("mathquill/build/mathquill.js");
    mathQuillScriptLoaded = true;
}

type MQMathField = {
    latex(): string;
    latex(s: string): void;
    el(): HTMLElement;
};

export interface MathExpressionFieldProps {
    value: string;
    onChange: (latex: string) => void;
    minHeight?: number;
    "aria-labelledby"?: string;
}

const MathExpressionField = ({
    value,
    onChange,
    minHeight = 39,
    "aria-labelledby": ariaLabelledBy,
}: MathExpressionFieldProps) => {
    const hostRef = useRef<HTMLSpanElement>(null);
    const mathFieldRef = useRef<MQMathField | null>(null);
    const focusedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        ensureMathQuillLoaded();
        const host = hostRef.current;
        if (!host) return;

        const MQ = (window as unknown as { MathQuill: { getInterface: (v: number) => { MathField: (el: HTMLElement, cfg?: unknown) => MQMathField } } }).MathQuill.getInterface(2);

        const mathField = MQ.MathField(host, {
            spaceBehavesLikeTab: false,
            handlers: {
                edit: () => {
                    onChangeRef.current(mathField.latex());
                },
            },
        });

        mathField.latex(value ?? "");
        mathFieldRef.current = mathField;

        const root = mathField.el();
        const onFocusIn = () => {
            focusedRef.current = true;
        };
        const onFocusOut = () => {
            focusedRef.current = false;
        };
        root.addEventListener("focusin", onFocusIn);
        root.addEventListener("focusout", onFocusOut);

        return () => {
            root.removeEventListener("focusin", onFocusIn);
            root.removeEventListener("focusout", onFocusOut);
            mathFieldRef.current = null;
            host.innerHTML = "";
        };
        // Mount once per field instance — onChange is read via onChangeRef so parent re-renders do not recreate MathField.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const mf = mathFieldRef.current;
        if (!mf) return;
        if (focusedRef.current) return;
        const next = value ?? "";
        if (mf.latex() !== next) {
            mf.latex(next);
        }
    }, [value]);

    return (
        <Box
            aria-labelledby={ariaLabelledBy}
            sx={{
                border: "2px solid",
                borderColor: "rgba(124, 58, 237, 0.45)",
                borderRadius: "10px",
                px: 1.25,
                py: 0.5,
                minHeight,
                width: "100%",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                transition: "border-color 0.15s ease",
                "&:focus-within": {
                    borderColor: "#6d28d9",
                    borderWidth: "2px",
                    paddingLeft: "calc(10px - 1px)",
                    paddingRight: "calc(10px - 1px)",
                    paddingTop: "calc(4px - 1px)",
                    paddingBottom: "calc(4px - 1px)",
                },
                "& .mq-editable-field": {
                    border: "none !important",
                    boxShadow: "none !important",
                },
                "& .mq-root-block": {
                    padding: "2px 0",
                },
                "& span.mq-editable-field": {
                    minWidth: "6rem",
                },
            }}
        >
            <span
                ref={hostRef}
                style={{
                    display: "inline-block",
                    width: "100%",
                    minWidth: "6rem",
                    verticalAlign: "middle",
                }}
            />
        </Box>
    );
};

export default MathExpressionField;
