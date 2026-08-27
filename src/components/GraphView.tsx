import { useMemo, useState } from "react"
import { ChevronRight, ChevronDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraphService } from "@/services/api"
import { getRelationshipLabel } from "@/utils/relationshipLabels"
import type { CuitSearchResponse, PathResponse, PathNode } from "@/types"
import { useStore } from "@/store/useStore"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/useGraphQueries"

// ─── Tree model ──────────────────────────────────────────────────────────────

/**
 * Internal tree node used by the list view.
 * Each node holds enough info to render itself and its children inline.
 */
interface TreeNode {
  taxId: string
  businessName: string
  /** Relationship leading FROM the parent TO this node (empty at root). */
  relationshipType: string
  inMyBase: boolean
  /** Logical depth: 0 = root, 1 = first level, etc. Used for indentation. */
  depth: number
  /** Stable unique id within the tree (handles repeated taxIds in different branches). */
  uid: string
  children: TreeNode[]
}

// ─── Tree builders ────────────────────────────────────────────────────────────

function buildTreeFromNodeResult(
  result: CuitSearchResponse,
  rootBusinessName?: string
): TreeNode {
  const rootName = rootBusinessName ?? result.results[0]?.data.businessName ?? result.cuit
  const root: TreeNode = {
    taxId: result.cuit,
    businessName: rootName,
    relationshipType: "",
    inMyBase: result.results.some((r) => r.data.inMyBase) || false,
    depth: 0,
    uid: result.cuit,
    children: [],
  }

  for (const item of result.results) {
    const path = item.data.pathToBase
    if (!path) continue
    insertPath(root, path, 1)
  }

  return root
}

function buildTreeFromCuitResult(result: CuitSearchResponse): TreeNode {
  const firstName = result.results[0]?.data.businessName ?? result.cuit
  const root: TreeNode = {
    taxId: result.cuit,
    businessName: firstName,
    relationshipType: "",
    inMyBase: false,
    depth: 0,
    uid: result.cuit,
    children: [],
  }

  for (const item of result.results) {
    if (item.data.inMyBase) {
      root.inMyBase = true
      continue
    }
    const path = item.data.pathToBase
    if (!path) continue

    const searchedAppearsMiddle = path.slice(0, -1).some(
      (n, i) => i > 0 && n.taxId === result.cuit
    )
    if (searchedAppearsMiddle) continue

    insertPath(root, path, 1)
  }

  return root
}

function buildTreeFromPathResult(result: PathResponse): TreeNode | null {
  if (result.path.length === 0) return null
  const first = result.path[0]!.from
  const root: TreeNode = {
    taxId: first.taxId,
    businessName: first.businessName,
    relationshipType: "",
    inMyBase: first.inMyBase,
    depth: 0,
    uid: first.taxId,
    children: [],
  }

  let current = root
  for (let i = 0; i < result.path.length; i++) {
    const segment = result.path[i]!
    const child: TreeNode = {
      taxId: segment.to.taxId,
      businessName: segment.to.businessName,
      relationshipType: segment.relationships.map((r) => getRelationshipLabel(r)).join(" / "),
      inMyBase: segment.to.inMyBase,
      depth: i + 1,
      uid: `${segment.to.taxId}@${i + 1}`,
      children: [],
    }
    current.children.push(child)
    current = child
  }

  return root
}

function insertPath(parent: TreeNode, path: PathNode[], startDepth: number): void {
  let current = parent
  for (let i = 0; i < path.length; i++) {
    const hop = path[i]!
    const newLabel = getRelationshipLabel(hop.relationshipType)

    const existing = current.children.find(
      (c) => c.taxId === hop.taxId && c.relationshipType === newLabel
    )
    if (existing) {
      current = existing
      continue
    }

    const sameNode = current.children.find((c) => c.taxId === hop.taxId)
    if (sameNode && newLabel) {
      const labels = new Set(sameNode.relationshipType.split(" / ").filter(Boolean))
      labels.add(newLabel)
      sameNode.relationshipType = [...labels].join(" / ")
      current = sameNode
      continue
    }

    const next: TreeNode = {
      taxId: hop.taxId,
      businessName: hop.businessName,
      relationshipType: newLabel,
      inMyBase: hop.inMyBase,
      depth: startDepth + i,
      uid: `${hop.taxId}@${startDepth + i}@${current.uid}`,
      children: [],
    }
    current.children.push(next)
    current = next
  }
}

/** Collects every uid in the tree — used by "Expand all". */
function collectAllUids(node: TreeNode, out: Set<string>): void {
  out.add(node.uid)
  for (const child of node.children) collectAllUids(child, out)
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  uid: string
  info: Record<string, string | boolean | null> | null
  loading: boolean
  /** Viewport-relative coordinates (used with position: fixed). */
  x: number
  y: number
}

/**
 * Floating tooltip rendered with `position: fixed` so it escapes any
 * parent overflow / clipping (e.g. the relations Card border). Its
 * x/y are computed from the row's bounding rect at hover time.
 */
function FloatingTooltip({ tooltip, taxId }: { tooltip: TooltipState; taxId: string }) {
  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg p-3 text-xs shadow-xl pointer-events-none"
      style={{ left: tooltip.x, top: tooltip.y, minWidth: "240px", maxWidth: "320px" }}
    >
      {tooltip.loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : tooltip.info ? (
        <div className="space-y-1">
          <p className="font-medium text-white">
            {String(tooltip.info["businessName"] ?? taxId)}
          </p>
          <p className="font-mono text-muted-foreground text-xs mb-2">{taxId}</p>
          {tooltip.info["phone"] && <p><span className="text-muted-foreground">Tel:</span> {String(tooltip.info["phone"])}</p>}
          {tooltip.info["email"] && <p><span className="text-muted-foreground">Email:</span> {String(tooltip.info["email"])}</p>}
          {tooltip.info["birthday"] && <p><span className="text-muted-foreground">Nacimiento:</span> {String(tooltip.info["birthday"])}</p>}
          <p>
            <span className="text-muted-foreground">Base:</span>{" "}
            <span className={tooltip.info["inMyBase"] ? "text-indigo-400" : "text-muted-foreground"}>
              {tooltip.info["inMyBase"] ? "En mi base" : "Externo"}
            </span>
          </p>
          {(() => {
            const srcs = tooltip.info["sources"]
            if (!Array.isArray(srcs) || srcs.length === 0) return null
            return <p><span className="text-muted-foreground">Fuentes:</span> {srcs.join(", ")}</p>
          })()}
        </div>
      ) : (
        <p className="text-muted-foreground">Sin información adicional</p>
      )}
    </div>
  )
}

// ─── Row component ───────────────────────────────────────────────────────────

interface RowProps {
  node: TreeNode
  expanded: Set<string>
  toggle: (uid: string) => void
  onClick: (taxId: string) => void
  onHoverStart: (uid: string, taxId: string, rect: DOMRect) => void
  onHoverEnd: () => void
}

/**
 * Single row in the list. Renders the chevron, the relationship label,
 * the business name + CUIT, and the inMyBase badge.
 *
 * The hover handlers pass the row's bounding rect up so the parent can
 * position the floating tooltip in viewport coordinates (escapes Card
 * overflow / clipping).
 */
function Row({ node, expanded, toggle, onClick, onHoverStart, onHoverEnd }: RowProps) {
  const isOpen = expanded.has(node.uid)
  const hasChildren = node.children.length > 0

  // Indentation: 20px per depth level. Looks like Nosis Manager.
  const indent = node.depth * 20

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>): void {
    const rect = e.currentTarget.getBoundingClientRect()
    onHoverStart(node.uid, node.taxId, rect)
  }

  return (
    <>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 transition-colors"
        style={{ paddingLeft: `${indent + 8}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onHoverEnd}
      >
        {/* Chevron / placeholder */}
        <button
          onClick={() => hasChildren && toggle(node.uid)}
          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded ${
            hasChildren ? "hover:bg-accent cursor-pointer" : "cursor-default"
          }`}
          aria-label={hasChildren ? (isOpen ? "Colapsar" : "Expandir") : ""}
        >
          {hasChildren ? (
            isOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Minus className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Relationship type (only shown for non-root nodes) */}
        {node.relationshipType && (
          <span className="shrink-0 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
            {node.relationshipType}
          </span>
        )}

        {/* Business name + CUIT (clickable) */}
        <button
          onClick={() => onClick(node.taxId)}
          className="flex items-center gap-2 min-w-0 text-left hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <span className="text-sm truncate">{node.businessName || "—"}</span>
          <span className="font-mono text-xs text-muted-foreground truncate">{node.taxId}</span>
        </button>

        {/* inMyBase badge */}
        {node.inMyBase && (
          <Badge variant="default" className="ml-auto shrink-0 text-xs">En mi base</Badge>
        )}
      </div>

      {/* Children */}
      {isOpen && node.children.map((child) => (
        <Row
          key={child.uid}
          node={child}
          expanded={expanded}
          toggle={toggle}
          onClick={onClick}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}
        />
      ))}
    </>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface GraphViewProps {
  /** Result from a CUIT search. */
  cuitResult?: CuitSearchResponse | null
  /** Result from a path search. */
  pathResult?: PathResponse | null
  /** Result from a node relationship query (used in the Edit Node tab). */
  nodeResult?: CuitSearchResponse | null
  /** Override label for the root node — used when nodeResult has no items. */
  nodeRootName?: string
}

/**
 * Nosis-style list view of the relationship tree.
 *
 * Renders a vertically-stacked list where children are indented one level
 * below their parent. Each node has a chevron (▶/▼) that toggles expand /
 * collapse. Clicking the business name or CUIT navigates to the edit page;
 * hovering shows a floating tooltip with additional details.
 *
 * The component grows according to its content — there is no internal
 * scroll. If the containing page can't fit everything, the page itself
 * scrolls. The tooltip is rendered with `position: fixed` so it isn't
 * clipped by ancestor overflow.
 */
export function GraphView({ cuitResult, pathResult, nodeResult, nodeRootName }: GraphViewProps) {
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const tree = useMemo<TreeNode | null>(() => {
    if (nodeResult) return buildTreeFromNodeResult(nodeResult, nodeRootName)
    if (cuitResult) return buildTreeFromCuitResult(cuitResult)
    if (pathResult) return buildTreeFromPathResult(pathResult)
    return null
  }, [cuitResult, pathResult, nodeResult, nodeRootName])

  const defaultExpanded = useMemo<Set<string>>(() => {
    if (!tree) return new Set()
    const out = new Set<string>()
    out.add(tree.uid)
    for (const child of tree.children) out.add(child.uid)
    return out
  }, [tree])

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded)
  const [hydratedFor, setHydratedFor] = useState<Set<string> | null>(null)
  if (hydratedFor !== defaultExpanded) {
    setHydratedFor(defaultExpanded)
    setExpanded(defaultExpanded)
  }

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  function toggle(uid: string): void {
    setExpanded((prev) => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  function expandAll(): void {
    if (!tree) return
    const all = new Set<string>()
    collectAllUids(tree, all)
    setExpanded(all)
  }

  function collapseAll(): void {
    if (!tree) return
    setExpanded(new Set([tree.uid]))
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  /**
   * Computes the tooltip's viewport coordinates given the hovered row's
   * bounding rect. We prefer placing it just below the row, but flip it
   * above when the bottom half of the viewport doesn't have room — this
   * is what fixes the "can't see tooltip near the bottom" issue.
   */
  function computeTooltipPosition(rect: DOMRect): { x: number; y: number } {
    const TOOLTIP_HEIGHT_ESTIMATE = 180
    const TOOLTIP_GAP = 6
    const TOOLTIP_HEIGHT_VISUAL = 140
    const viewportHeight = window.innerHeight

    const spaceBelow = viewportHeight - rect.bottom
    const placeBelow = spaceBelow >= TOOLTIP_HEIGHT_ESTIMATE + TOOLTIP_GAP

    const y = placeBelow
  ? rect.bottom + TOOLTIP_GAP
  : rect.top - TOOLTIP_HEIGHT_VISUAL - TOOLTIP_GAP

    // Anchor x to the start of the row's content (a small indent from the left
    // edge so it lines up visually with the row's text).
    const x = rect.left + 40

    return { x, y }
  }

  async function handleHoverStart(uid: string, taxId: string, rect: DOMRect): Promise<void> {
    const { x, y } = computeTooltipPosition(rect)
    setTooltip({ uid, info: null, loading: true, x, y })
    try {
      const cached = queryClient.getQueryData(queryKeys.node(taxId))
      if (cached) {
        setTooltip({ uid, info: cached as Record<string, string | boolean | null>, loading: false, x, y })
        return
      }
      const info = await GraphService.getNode(taxId) as unknown as Record<string, string | boolean | null>
      queryClient.setQueryData(queryKeys.node(taxId), info)
      setTooltip({ uid, info, loading: false, x, y })
    } catch {
      setTooltip({ uid, info: null, loading: false, x, y })
    }
  }

  function handleHoverEnd(): void {
    setTooltip(null)
  }

  if (!tree) return null

  // The taxId associated with the currently-hovered uid is needed to render
  // the tooltip's name/cuit fallback. We look it up lazily.
  function findTaxIdByUid(node: TreeNode, uid: string): string | null {
    if (node.uid === uid) return node.taxId
    for (const child of node.children) {
      const found = findTaxIdByUid(child, uid)
      if (found) return found
    }
    return null
  }
  const hoveredTaxId = tooltip ? findTaxIdByUid(tree, tooltip.uid) : null

  return (
    <div className="flex flex-col gap-2">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <Button variant="outline" size="sm" onClick={expandAll}>Expandir todo</Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>Colapsar todo</Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          Click en el nombre para editar · Click en ▶/▼ para expandir
        </span>
      </div>

      {/* Tree list — grows with content, no internal scroll */}
      <div className="rounded-lg border border-border bg-background">
        <Row
          node={tree}
          expanded={expanded}
          toggle={toggle}
          onClick={handleNodeClick}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
        />
      </div>

      {/* Floating tooltip — rendered at viewport coords so it escapes
          any ancestor overflow / clipping. */}
      {tooltip && hoveredTaxId && (
        <FloatingTooltip tooltip={tooltip} taxId={hoveredTaxId} />
      )}
    </div>
  )
}