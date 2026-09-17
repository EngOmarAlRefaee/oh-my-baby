import React from "react";

const dotTone = {
    aubergine: "bg-aubergine",
    pistachio: "bg-pistachio",
    butter: "bg-butter",
};

/**
 * The recurring editorial label used at the top of every section:
 * a hairline rule, a small accent dot, and a tracked serif micro-label.
 * This one mark is what visually ties every section together.
 */
export default function Eyebrow({ children, tone = "aubergine", dark = false }) {
    return (
        <div className={`omb-eyebrow ${dark ? "text-white" : "text-espresso"}`}>
            <span className="omb-eyebrow-rule" />
            <span className={`omb-eyebrow-dot ${dotTone[tone] || dotTone.aubergine}`} />
            <span
                className={`omb-eyebrow-label ${dark ? "text-white/75" : "text-aubergine/75"}`}
            >
                {children}
            </span>
        </div>
    );
}
