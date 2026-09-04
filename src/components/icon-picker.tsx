import { useState } from "react"
import { motion } from "motion/react"

import { Twemoji } from "@/components/twemoji"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ICON_GROUPS } from "@/lib/icons"
import { cn } from "@/lib/utils"

export function IconPicker({
  value,
  onChange,
  tone,
}: {
  value: string
  onChange: (icon: string) => void
  tone: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          aria-label="change icon"
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md text-[0.9rem]",
            "transition-colors hover:bg-foreground/6"
          )}
          style={{ ["--tone" as string]: tone }}
        >
          {value ? (
            <Twemoji className="size-[1.05em]">{value}</Twemoji>
          ) : (
            <span className="size-1.5 rounded-full bg-current opacity-25" />
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[17.5rem] rounded-xl border-border bg-popover p-3 shadow-lg"
      >
        <div className="max-h-72 space-y-3 overflow-y-auto pretty-scroll">
          {ICON_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 px-1 font-display text-[0.72rem] text-muted-foreground italic">
                {group.label}
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {group.icons.map((icon) => (
                  <motion.button
                    key={icon}
                    type="button"
                    whileHover={{ scale: 1.18 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      onChange(icon)
                      setOpen(false)
                    }}
                    className={cn(
                      "grid aspect-square place-items-center rounded-md text-base",
                      "transition-colors hover:bg-foreground/6",
                      value === icon && "bg-foreground/8 ring-1 ring-border"
                    )}
                  >
                    <Twemoji className="size-[1.1em]">{icon}</Twemoji>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className="mt-2 w-full rounded-md py-1.5 text-[0.7rem] text-muted-foreground transition-colors hover:bg-foreground/6"
          >
            remove icon
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
