import { useEffect, useState } from "react"
import { ThemeProviderContext, type Theme } from "./useTheme"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)")

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [systemDark, setSystemDark] = useState(() => darkQuery().matches)

    // Follow OS-level changes while the user has not picked a theme explicitly.
    useEffect(() => {
        const mq = darkQuery()
        const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [])

    const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(resolvedTheme)
    }, [resolvedTheme])

    const value = {
        theme,
        resolvedTheme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
