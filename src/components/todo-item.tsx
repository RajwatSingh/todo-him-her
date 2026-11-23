import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlignLeft, ChevronDown, Plus, Trash2 } from "lucide-react"

import { IconPicker } from "@/components/icon-picker"
import { Twemoji } from "@/components/twemoji"
import { guessIcon } from "@/lib/icons"
import type { Todo, TodoNode } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX_DEPTH = 3

export type TodoItemProps = {
  node: TodoNode
  depth: number
  tone: string
  glow: string
  onToggle: (id: string) => void
  onPatch: (id: string, patch: Partial<Omit<Todo, "id">>) => void
  onRemove: (id: string) => void
  onAddChild: (parentId: string, text: string) => void
}

/**
 * One task, as a pane of glass: checkbox, icon, words, in reading order.
 *
 * Every leading element sits in a box exactly one line tall, so the checkbox
 * and the icon line up with the first line of the title however many lines it
 * wraps to — and they line up the same way at every depth, because a nested
 * row only steps its type down a size, never its structure.
 */
export function TodoItem({
  node,
  depth,
  tone,
  glow,
  onToggle,
  onPatch,
  onRemove,
  onAddChild,
}: TodoItemProps) {
  const [expanded, setExpanded] = useState(true)
  const [editingText, setEditingText] = useState(false)
  const [draftText, setDraftText] = useState(node.text)
  const [showNote, setShowNote] = useState(Boolean(node.description))
  const [addingChild, setAddingChild] = useState(false)
  const [childDraft, setChildDraft] = useState("")

  const childInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // Grow the note to fit its content — on mount too, not just while typing,
  // otherwise a saved multi-line note comes back clipped to one row.
  useLayoutEffect(() => {
    const el = noteRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [node.description, showNote])

  useEffect(() => setDraftText(node.text), [node.text])
  useEffect(() => {
    if (addingChild) childInputRef.current?.focus()
  }, [addingChild])
  useEffect(() => {
    if (editingText) textInputRef.current?.select()
  }, [editingText])

  const hasChildren = node.children.length > 0
  const doneChildren = node.children.filter((c) => c.completed).length
  const canNest = depth < MAX_DEPTH
  const nested = depth > 0

  // one line of the title, as a box: the checkbox and icon centre in it
  const line = nested ? "h-5" : "h-[1.375rem]"
  const titleSize = nested ? "text-small leading-5" : "text-body leading-[1.375rem]"

  const commitText = () => {
    const next = draftText.trim()
    setEditingText(false)
    if (next && next !== node.text) onPatch(node.id, { text: next })
    else setDraftText(node.text)
  }

  const submitChild = () => {
    const text = childDraft.trim()
    if (text) onAddChild(node.id, text)
    setChildDraft("")
    setAddingChild(false)
  }

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="relative"
    >
      <div
        className={cn(
          "group/item relative flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors hover:bg-white/[0.07]",
          nested ? "py-1.5 pr-1.5 pl-2.5" : "py-2 pr-1.5 pl-3"
        )}
      >
        <div className={cn("flex shrink-0 items-center", line)}>
          <Check
            checked={node.completed}
            label={node.text}
            small={nested}
            tone={tone}
            glow={glow}
            onChange={() => onToggle(node.id)}
          />
        </div>

        <div className={cn("-mx-1 flex shrink-0 items-center", line)}>
          <IconPicker
            value={node.icon}
            tone={tone}
            onChange={(icon) => onPatch(node.id, { icon })}
          />
        </div>

        <div className="min-w-0 flex-1">
          {editingText ? (
            <input
              ref={textInputRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitText()
                if (e.key === "Escape") {
                  setDraftText(node.text)
                  setEditingText(false)
                }
              }}
              className={cn("w-full bg-transparent outline-none", titleSize)}
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setEditingText(true)}
              onClick={() => {
                if (node.description || showNote) setShowNote((v) => !v)
              }}
              className={cn(
                "block w-full text-left break-words transition-colors",
                titleSize,
                node.completed
                  ? "text-white/45 line-through decoration-[1.5px]"
                  : "text-foreground"
              )}
              style={
                node.completed
                  ? { textDecorationColor: `color-mix(in oklab, ${tone} 70%, transparent)` }
                  : undefined
              }
            >
              {node.text}
            </button>
          )}

          {/* the note: a step down in size and weight, so it reads as an
              aside to the task rather than a second task under it */}
          <AnimatePresence initial={false}>
            {showNote ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <textarea
                  ref={noteRef}
                  value={node.description}
                  placeholder="a little more about this…"
                  rows={1}
                  onChange={(e) =>
                    onPatch(node.id, { description: e.target.value })
                  }
                  onBlur={() => {
                    if (!node.description) setShowNote(false)
                  }}
                  className={cn(
                    "mt-1 -ml-1.5 block w-[calc(100%+0.375rem)] resize-none overflow-hidden rounded-md px-1.5 py-0.5",
                    "bg-transparent text-xs leading-relaxed text-white/60",
                    "outline-none transition-colors placeholder:text-white/35",
                    "focus:bg-white/[0.04]"
                  )}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* row actions: hidden until the row is hovered or focused */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 transition-opacity",
            line,
            "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100",
            "max-sm:opacity-60"
          )}
        >
          {!node.description && !showNote ? (
            <RowAction label="add a note" onClick={() => setShowNote(true)}>
              <AlignLeft className="size-3.5" />
            </RowAction>
          ) : null}

          {canNest ? (
            <RowAction
              label="add a sub-task"
              onClick={() => {
                setExpanded(true)
                setAddingChild(true)
              }}
            >
              <Plus className="size-3.5" />
            </RowAction>
          ) : null}

          <RowAction
            label="delete"
            destructive
            onClick={() => onRemove(node.id)}
          >
            <Trash2 className="size-3.5" />
          </RowAction>
        </div>

        {/* sub-task count, which is also the fold — always visible, since it
            is information and not just a control */}
        {hasChildren ? (
          <div className={cn("flex shrink-0 items-center", line)}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={`${expanded ? "collapse" : "expand"} sub-tasks, ${doneChildren} of ${node.children.length} done`}
              className="inline-flex h-6 items-center gap-0.5 rounded-full px-1.5 text-fine text-white/65 tnum transition-colors outline-none hover:bg-white/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {doneChildren}/{node.children.length}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  !expanded && "-rotate-90"
                )}
                strokeWidth={2}
              />
            </button>
          </div>
        ) : null}
      </div>

      {/* children: stepped in, hung off a hairline that runs down from the
          parent so it's clear which row they belong to */}
      <AnimatePresence initial={false}>
        {expanded && (hasChildren || addingChild) ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="relative pt-1.5 pl-6">
              <span
                aria-hidden
                className="absolute top-0 bottom-2 left-3 w-px bg-white/[0.09]"
              />
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {node.children.map((child) => (
                    <TodoItem
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      tone={tone}
                      glow={glow}
                      onToggle={onToggle}
                      onPatch={onPatch}
                      onRemove={onRemove}
                      onAddChild={onAddChild}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {addingChild ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.03] py-1.5 pr-2 pl-2.5",
                    hasChildren && "mt-1.5"
                  )}
                >
                  <span className="grid size-4 shrink-0 place-items-center text-white/45">
                    {childDraft.trim() ? (
                      <Twemoji className="size-3.5">{guessIcon(childDraft)}</Twemoji>
                    ) : (
                      <Plus className="size-3.5" strokeWidth={2} />
                    )}
                  </span>
                  <input
                    ref={childInputRef}
                    value={childDraft}
                    placeholder="sub-task…"
                    onChange={(e) => setChildDraft(e.target.value)}
                    onBlur={submitChild}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitChild()
                      if (e.key === "Escape") {
                        setChildDraft("")
                        setAddingChild(false)
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-small leading-5 outline-none placeholder:text-white/40"
                  />
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}

/**
 * The completion mark: a ring that fills with the person's own colour and
 * draws a tick. It is a button with the checkbox role, so keyboards and
 * screen readers treat it as one.
 */
function Check({
  checked,
  label,
  small,
  tone,
  glow,
  onChange,
}: {
  checked: boolean
  label: string
  small: boolean
  tone: string
  glow: string
  onChange: () => void
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `mark as not done: ${label}` : `mark as done: ${label}`}
      onClick={onChange}
      whileTap={{ scale: 0.86 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-[1.5px] outline-none transition-[background-color,border-color,box-shadow] duration-200",
        "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
        small ? "size-4" : "size-[1.125rem]",
        checked ? "" : "border-white/30 hover:border-white/55 hover:bg-white/[0.06]"
      )}
      style={
        checked
          ? { backgroundColor: tone, borderColor: tone, boxShadow: `0 0 0 3px ${glow}` }
          : undefined
      }
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={small ? "size-2.5" : "size-3"}
        fill="none"
        stroke="var(--void)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </svg>
    </motion.button>
  )
}

function RowAction({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "grid size-6 place-items-center rounded-md text-white/55 transition-colors",
        destructive
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-white/[0.08] hover:text-foreground"
      )}
    >
      {children}
    </motion.button>
  )
}

/** Re-exported so the column can render an icon without importing Twemoji itself. */
export { Twemoji }

/** Suggest an icon for freshly typed text. */
export { guessIcon }
