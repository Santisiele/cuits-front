import { USER_COLOR_KEYS, USER_PALETTE } from "@/lib/userColors"
import { cn } from "@/lib/utils"

export function UserColorPicker({
  username,
  color,
  disabled,
  onChange,
}: {
  username: string
  color: string | null
  disabled: boolean
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label={`Color de ${username}`}>
      {USER_COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={color === key}
          aria-label={USER_PALETTE[key].label}
          disabled={disabled}
          onClick={() => color !== key && onChange(key)}
          className={cn(
            "h-4 w-4 border border-transparent transition-transform hover:scale-110 disabled:opacity-50",
            USER_PALETTE[key].swatch,
            color === key && "ring-2 ring-offset-1 ring-foreground"
          )}
        />
      ))}
    </div>
  )
}
