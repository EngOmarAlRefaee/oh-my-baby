import React from "react";

const variantClass = {
    primary: "omb-btn omb-btn-primary",
    secondary: "omb-btn omb-btn-secondary",
    "secondary-dark": "omb-btn omb-btn-secondary omb-btn-on-dark",
};

/**
 * Every CTA on the site — hero actions, section "shop" links, newsletter
 * submit, rewards signup — renders through this one component so the pill
 * radius, padding, weight and hover lift can never drift between sections.
 */
export default function Button({
    as: Component = "a",
    variant = "primary",
    icon = false,
    className = "",
    children,
    ...props
}) {
    return (
        <Component
            className={`${variantClass[variant] || variantClass.primary} ${className}`.trim()}
            {...props}
        >
            <span>{children}</span>
            {icon && (
                <span className="omb-btn-icon" aria-hidden="true">
                    ←
                </span>
            )}
        </Component>
    );
}
