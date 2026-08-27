import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  RiCheckboxCircleLine,
  RiInformationLine,
  RiErrorWarningLine,
  RiCloseCircleLine,
  RiLoaderLine,
} from "@remixicon/react"
import { useStore } from "@/store/useStore"

/**
 * Toast host. Mounted once at the app root.
 *
 * The shadcn generator wires this to `next-themes`; this app keeps its theme
 * in the Zustand store instead, so the theme is read from there and the extra
 * dependency is dropped. The wrapper also carries the theme class itself
 * because sonner renders through a portal, outside the themed subtree, and
 * would otherwise resolve the CSS variables against the wrong palette.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useStore((state) => state.theme)

  return (
    <Sonner
      theme={theme}
      className={`${theme} toaster group`}
      icons={{
        success: <RiCheckboxCircleLine className="size-4" />,
        info: <RiInformationLine className="size-4" />,
        warning: <RiErrorWarningLine className="size-4" />,
        error: <RiCloseCircleLine className="size-4" />,
        loading: <RiLoaderLine className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "cn-toast" } }}
      {...props}
    />
  )
}

export { Toaster }
