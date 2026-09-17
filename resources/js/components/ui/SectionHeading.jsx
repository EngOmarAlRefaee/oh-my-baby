import React from "react";
import Eyebrow from "./Eyebrow";

/**
 * The repeated section-opening pattern (eyebrow, heading, optional lead
 * paragraph, optional "view all" link) lived as four slightly different
 * hand-copies across NewArrivals, BestSellers, Categories and GiftIdeas.
 * Centralizing it is what keeps their spacing and type in lockstep.
 */
export default function SectionHeading({
    eyebrow,
    tone = "aubergine",
    title,
    description,
    linkHref,
    linkLabel,
}) {
    return (
        <div className="omb-section-head">
            <div>
                <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
                <h2 className="omb-h2 text-espresso">{title}</h2>
                {description && <p className="omb-lead">{description}</p>}
            </div>

            {linkHref && (
                <a href={linkHref} className="omb-link hidden shrink-0 sm:inline-flex">
                    {linkLabel}
                </a>
            )}
        </div>
    );
}
