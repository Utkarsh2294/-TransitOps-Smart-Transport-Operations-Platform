declare const config: {
    darkMode: ["class"];
    content: string[];
    theme: {
        extend: {
            colors: {
                background: string;
                surface: string;
                raised: string;
                panel: string;
                border: string;
                foreground: string;
                muted: string;
                primary: string;
                success: string;
                info: string;
                warning: string;
                danger: string;
            };
            fontFamily: {
                sans: [string, string, string, string, string];
            };
            boxShadow: {
                card: string;
                glow: string;
            };
        };
    };
    plugins: never[];
};
export default config;
