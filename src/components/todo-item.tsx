import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlignLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { IconPicker } from "@/components/icon-picker"
import { Twemoji } from "@/components/twemoji"
import { Checkbox } from "@/components/ui/checkbox"
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
      className="group/item relative"
    >
      <div
        className={cn(
          "relative flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors",
          "hover:bg-foreground/[0.035]"
        )}
      >
        {/* expand / collapse */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "collapse" : "expand"}
          className={cn(
            "mt-1 grid size-4 shrink-0 place-items-center rounded text-muted-foreground transition-transform",
            hasChildren ? "opacity-60 hover:opacity-100" : "invisible",
            expanded && "rotate-90"
          )}
        >
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </button>

        <div className="mt-0.5">
          <IconPicker
            value={node.icon}
            tone={tone}
            onChange={(icon) => onPatch(node.id, { icon })}
          />
        </div>

        <Checkbox
          checked={node.completed}
          onCheckedChange={() => onToggle(node.id)}
          aria-label={node.completed ? "mark as not done" : "mark as done"}
          className={cn(
            "mt-1.5 size-[1rem] shrink-0 rounded-[5px] border-input bg-card",
            "transition-transform active:scale-90",
            "data-[state=checked]:border-transparent data-[state=checked]:text-white"
          )}
          style={
            node.completed
              ? { backgroundColor: tone, borderColor: tone }
              : undefined
          }
        />

        <div className="min-w-0 flex-1 pt-0.5">
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
              className="w-full bg-transparent text-[0.9rem] leading-snug outline-none"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setEditingText(true)}
              onClick={() => {
                if (node.description || showNote) setShowNote((v) => !v)
              }}
              className={cn(
                "block w-full text-left text-[0.9rem] leading-snug break-words transition-all",
                node.completed &&
                  "text-muted-foreground line-through decoration-[1.5px] opacity-60"
              )}
              style={
                node.completed
                  ? { textDecorationColor: tone }
                  : undefined
              }
            >
              {node.text}
            </button>
          )}

          {/* description */}
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
                    "mt-1 w-full resize-none overflow-hidden rounded-sm border-l py-0.5 pl-2.5",
                    "bg-transparent font-display text-[0.8rem] leading-relaxed text-muted-foreground italic",
                    "outline-none transition-colors placeholder:text-muted-foreground/45",
                    "focus:bg-foreground/[0.03]"
                  )}
                  style={{ borderColor: glow }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* child count badge when collapsed */}
          {hasChildren && !expanded ? (
            <div className="mt-1 text-[0.68rem] text-muted-foreground">
              {doneChildren} of {node.children.length} sub-tasks done
            </div>
          ) : null}
        </div>

        {/* row actions */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 pt-1 transition-opacity",
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
      </div>

      {/* children */}
      <AnimatePresence initial={false}>
        {expanded && (hasChildren || addingChild) ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="ml-[1.4rem] border-l border-border pl-2.5"
            >
              <ul className="space-y-0.5 pt-0.5">
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
                  className="flex items-center gap-1.5 py-1 pl-2"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: tone }}
                  />
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
                    className="flex-1 bg-transparent text-[0.82rem] outline-none placeholder:text-muted-foreground/50"
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
        "grid size-6 place-items-center rounded-md text-muted-foreground/70 transition-colors",
        destructive
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-foreground/6 hover:text-foreground"
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
