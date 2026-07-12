var config = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "var(--bg-base)",
                surface: "var(--bg-surface)",
                raised: "var(--bg-surface-raised)",
                panel: "var(--accent-subtle)",
                border: "var(--border)",
                foreground: "var(--text-primary)",
                muted: "var(--text-secondary)",
                primary: "var(--accent)",
                success: "var(--status-success)",
                info: "var(--status-info)",
                warning: "var(--status-warning)",
                danger: "var(--status-danger)",
            },
            fontFamily: {
                sans: ["Inter", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
            },
            boxShadow: {
                card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 14px 40px rgba(16, 24, 40, 0.08)",
                glow: "0 20px 70px var(--shadow-glow)",
            },
        },
    },
    plugins: [],
};
export default config;
