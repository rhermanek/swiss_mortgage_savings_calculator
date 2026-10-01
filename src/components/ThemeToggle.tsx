import { Moon, Sun } from "lucide-react"
import { useTheme } from "./useTheme"
import { useLanguage } from "../i18n/useLanguage"
import { Button } from "./ui"

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const { t } = useLanguage()
    const isDark = resolvedTheme === "dark"

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? t('app.theme_light') : t('app.theme_dark')}
            title={isDark ? t('app.theme_light') : t('app.theme_dark')}
        >
            {isDark ? <Sun /> : <Moon />}
        </Button>
    )
}
