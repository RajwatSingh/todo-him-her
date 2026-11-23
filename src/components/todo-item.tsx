import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react"
import { AlignLeft, ChevronDown, Heart, Plus, Trash2 } from "lucide-react"

import { IconPicker } from "@/components/icon-picker"
import { TearTicket } from "@/components/tear-check"
import { Twemoji } from "@/components/twemoji"
import { haptic } from "@/lib/haptic"
import { guessIcon } from "@/lib/icons"
import { useTasks } from "@/lib/task-context"
import type { TodoNode } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX_DEPTH = 3
/** how long a press has to be held before the row lifts to be dragged */
const LONG_PRESS_MS = 300
/** how far a finger can drift during that hold before it counts as a scroll */
const PRESS_SLOP = 8

const RESTING = "drop-shadow(0 0px 0px rgb(0 0 0 / 0))"
const LIFTED = "drop-shadow(0 14px 22px rgb(0 0 0 / 0.45))"

/**
 * One set of siblings, reorderable. Order comes from the store; during a
 * drag this keeps its own copy, and on release hands the new order back to
 * be saved as positions. Each level of nesting is its own list, so a task
 * only ever moves among its own siblings.
 */
export function TaskList({ nodes, depth }: { nodes: TodoNode[]; depth: number }) {
  const { reorder } = useTasks()
  const ids = nodes.map((n) => n.id)
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)
  const orderRef = useRef<string[] | null>(null)

  const byId = new Map(nodes.map((n) => [n.id, n]))
  // while dragging, the drag's order — minus anything deleted, plus anything
  // that arrived from the other phone mid-drag
  const shown = dragOrder
    ? [
        ...dragOrder.filter((id) => byId.has(id)),
        ...ids.filter((id) => !dragOrder.includes(id)),
      ]
    : ids

  const setOrder = (next: string[]) => {
    orderRef.current = next
    setDragOrder(next)
  }

  const finish = () => {
    const next = orderRef.current
    orderRef.current = null
    setDragOrder(null)
    if (next && next.join() !== ids.join()) reorder(next)
  }

  /** keyboard: Alt+↑ / Alt+↓ moves the focused task among its siblings */
  const move = (id: string, delta: number) => {
    const from = ids.indexOf(id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= ids.length) return
    const next = [...ids]
    next.splice(to, 0, next.splice(from, 1)[0])
    reorder(next)
  }

  return (
    <Reorder.Group as="ul" axis="y" values={shown} onReorder={setOrder} className="space-y-1.5">
      <AnimatePresence initial={false}>
        {shown.map((id) => (
          <TodoItem
            key={id}
            node={byId.get(id)!}
            depth={depth}
            onDragStart={() => setOrder(shown)}
            onDragEnd={finish}
            onMove={(delta) => move(id, delta)}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  )
}

/**
 * One task, as a ticket made of glass: the stub on the left is the checkbox —
 * tap it, or drag it down and away, and it tears off along the perforation —
 * then the icon, then the words, in reading order.
 *
 * Holding the body of the ticket for a moment lifts it, and it can then be
 * dragged up or down among its siblings. The two gestures never meet: the
 * tear lives on the stub, the lift on the body, and they are separate
 * elements, so a pointer that goes down on one is never seen by the other.
 */
function TodoItem({
  node,
  depth,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  node: TodoNode
  depth: number
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (delta: number) => void
}) {
  const { tone, glow, toggle, patch, remove, addChild, me, v3, cheer } = useTasks()

  const [expanded, setExpanded] = useState(true)
  const [editingText, setEditingText] = useState(false)
  const [draftText, setDraftText] = useState(node.text)
  const [showNote, setShowNote] = useState(Boolean(node.description))
  const [addingChild, setAddingChild] = useState(false)
  const [childDraft, setChildDraft] = useState("")

  const childInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const lift = useLongPressLift({ disabled: editingText, onLift: () => haptic(10) })

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
    if (next && next !== node.text) patch(node.id, { text: next })
    else setDraftText(node.text)
  }

  const submitChild = () => {
    const text = childDraft.trim()
    if (text) addChild(node.id, text)
    setChildDraft("")
    setAddingChild(false)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return
    e.preventDefault()
    onMove(e.key === "ArrowUp" ? -1 : 1)
  }

  return (
    <Reorder.Item
      as="li"
      value={node.id}
      dragListener={false}
      dragControls={lift.controls}
      onDragStart={onDragStart}
      onDragEnd={() => {
        lift.drop()
        onDragEnd()
      }}
      layout="position"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: 1,
        scale: lift.lifted ? 1.02 : 1,
        filter: lift.lifted ? LIFTED : RESTING,
      }}
      exit={{ opacity: 0, x: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn("relative", lift.lifted && "z-20")}
      data-lifted={lift.lifted || undefined}
    >
      <TearTicket
        side="left"
        size={nested ? "sm" : "md"}
        tone={tone}
        glow={glow}
        label={node.text}
        completed={node.completed}
        onTear={() => toggle(node.id)}
        onUndo={() => toggle(node.id)}
        className="group/item"
      >
        {/* the body: everything that isn't the stub, and where a long press
            lifts the row */}
        <div
          ref={lift.ref}
          {...lift.handlers}
          onKeyDown={onKeyDown}
          className={cn(
            "flex items-start gap-2.5 select-none [-webkit-touch-callout:none]",
            nested ? "py-1.5 pr-1.5 pl-1.5" : "py-2 pr-1.5 pl-2",
            lift.lifted && "cursor-grabbing"
          )}
        >
          <div data-no-drag className={cn("-mx-1 flex shrink-0 items-center", line)}>
            <IconPicker
              value={node.icon}
              tone={tone}
              onChange={(icon) => patch(node.id, { icon })}
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
                className={cn("w-full bg-transparent outline-none select-text", titleSize)}
              />
            ) : (
              <button
                type="button"
                title="double-click to edit · hold to move · alt+↑↓ to reorder"
                onDoubleClick={() => setEditingText(true)}
                onClick={() => {
                  if (node.description || showNote) setShowNote((v) => !v)
                }}
                className={cn(
                  "block w-full text-left break-words transition-colors outline-none focus-visible:underline focus-visible:decoration-white/40",
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
                    onChange={(e) => patch(node.id, { description: e.target.value })}
                    onBlur={() => {
                      if (!node.description) setShowNote(false)
                    }}
                    className={cn(
                      "mt-1 -ml-1.5 block w-[calc(100%+0.375rem)] resize-none overflow-hidden rounded-md px-1.5 py-0.5 select-text",
                      "bg-transparent text-xs leading-relaxed text-white/60",
                      "outline-none transition-colors placeholder:text-white/35",
                      "focus:bg-white/[0.04]"
                    )}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {v3 ? (
            <Cheers node={node} me={me} tone={tone} line={line} onCheer={() => cheer(node.id)} />
          ) : null}

          {/* row actions: hidden until the row is hovered or focused */}
          <div
            data-no-drag
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

            <RowAction label="delete" destructive onClick={() => remove(node.id)}>
              <Trash2 className="size-3.5" />
            </RowAction>
          </div>

          {/* sub-task count, which is also the fold — always visible, since it
              is information and not just a control */}
          {hasChildren ? (
            <div data-no-drag className={cn("flex shrink-0 items-center", line)}>
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
      </TearTicket>

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
              <TaskList nodes={node.children} depth={depth + 1} />

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
    </Reorder.Item>
  )
}

/**
 * Press and hold to lift. A press that is held still for LONG_PRESS_MS
 * starts a drag through `controls`; one that drifts more than PRESS_SLOP
 * first is a scroll and is let go. Presses that start on a control
 * (`[data-no-drag]`, inputs) are ignored entirely.
 *
 * On touch, the page would normally take over the finger as a scroll the
 * moment it moves, so once lifted, touchmove is cancelled on the row until
 * it's put down. And the click that the release would otherwise send to
 * the title — opening its note — is swallowed.
 */
function useLongPressLift({
  disabled,
  onLift,
}: {
  disabled: boolean
  onLift: () => void
}) {
  const controls = useDragControls()
  const [lifted, setLifted] = useState(false)
  const liftedRef = useRef(false)
  const pressRef = useRef<{ timer: number; x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const cancelPress = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer)
    pressRef.current = null
  }

  const drop = () => {
    if (!liftedRef.current) return
    liftedRef.current = false
    setLifted(false)
  }

  // a non-passive listener, so a lifted row's touchmove can stop the scroll
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (liftedRef.current && e.cancelable) e.preventDefault()
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMove)
  }, [])

  useEffect(() => cancelPress, [])

  const handlers = {
    onPointerDown: (e: ReactPointerEvent) => {
      if (disabled || e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest("[data-no-drag], input, textarea")) return
      const native = e.nativeEvent
      cancelPress()
      pressRef.current = {
        x: e.clientX,
        y: e.clientY,
        timer: window.setTimeout(() => {
          pressRef.current = null
          liftedRef.current = true
          setLifted(true)
          onLift()
          controls.start(native)

          // the release: put the row down even if it never moved, and eat
          // the click it would otherwise land on the title
          const swallow = (ev: Event) => {
            ev.stopPropagation()
            ev.preventDefault()
          }
          window.addEventListener("click", swallow, true)
          const release = () => {
            window.removeEventListener("pointerup", release, true)
            window.removeEventListener("pointercancel", release, true)
            drop()
            window.setTimeout(
              () => window.removeEventListener("click", swallow, true),
              0
            )
          }
          window.addEventListener("pointerup", release, true)
          window.addEventListener("pointercancel", release, true)
        }, LONG_PRESS_MS),
      }
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const p = pressRef.current
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > PRESS_SLOP) cancelPress()
    },
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
    onContextMenu: (e: React.MouseEvent) => {
      // a long press on touch would otherwise also open the context menu
      if (liftedRef.current || pressRef.current) e.preventDefault()
    },
  }

  return { controls, lifted, drop, ref, handlers }
}

/**
 * Cheers. On the other one's task, a heart to tap — always showing once the
 * task is torn off, since that's the moment worth cheering. On your own
 * task, whatever they've sent you, as a little cluster of emoji.
 */
function Cheers({
  node,
  me,
  tone,
  line,
  onCheer,
}: {
  node: TodoNode
  me: string
  tone: string
  line: string
  onCheer: () => void
}) {
  const fromThem = node.reactions.filter((r) => r.by !== me)
  const mineOn = node.reactions.some((r) => r.by === me)
  const theirs = node.owner !== me

  const received =
    fromThem.length > 0 ? (
      <span
        className="inline-flex items-center -space-x-0.5"
        title={`${fromThem.length} cheer${fromThem.length > 1 ? "s" : ""}`}
      >
        {[...new Set(fromThem.map((r) => r.emoji))].slice(0, 3).map((e) => (
          <motion.span
            key={e}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Twemoji className="size-3.5">{e}</Twemoji>
          </motion.span>
        ))}
      </span>
    ) : null

  if (!theirs) {
    return received ? (
      <div data-no-drag className={cn("flex shrink-0 items-center", line)}>
        {received}
      </div>
    ) : null
  }

  return (
    <div
      data-no-drag
      className={cn(
        "flex shrink-0 items-center transition-opacity",
        line,
        node.completed || mineOn
          ? "opacity-100"
          : "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 max-sm:opacity-60"
      )}
    >
      <motion.button
        type="button"
        onClick={onCheer}
        whileTap={{ scale: 0.8 }}
        aria-pressed={mineOn}
        aria-label={mineOn ? "take back your cheer" : "cheer this on"}
        title={mineOn ? "cheered" : "cheer"}
        className="grid size-6 place-items-center rounded-md text-white/55 transition-colors hover:bg-white/[0.08] hover:text-foreground"
      >
        <motion.span
          key={String(mineOn)}
          initial={mineOn ? { scale: 0.5 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 12 }}
          className="inline-flex"
        >
          <Heart
            className="size-3.5"
            strokeWidth={2.2}
            style={mineOn ? { fill: tone, color: tone } : undefined}
          />
        </motion.span>
      </motion.button>
    </div>
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
