// ─── Graph API types ────────────────────────────────────────────────────────

/**
 * A single node along the path from a searched CUIT to a base node.
 * Used inside {@link SearchResult}.
 */
export interface PathNode {
  taxId: string
  businessName: string
  relationshipType: string
  inMyBase: boolean
}

/**
 * A single result returned by the CUIT search endpoint.
 * Each result represents one source file / database that matched the query.
 */
export interface SearchResult {
  cuit: string
  source: string
  file: string
  data: {
    businessName?: string
    inMyBase?: boolean
    pathToBase?: PathNode[]
    [key: string]: unknown
  }
}

/**
 * Response shape for `GET /graph/cuit/:taxId`.
 */
export interface CuitSearchResponse {
  cuit: string
  found: boolean
  results: SearchResult[]
}

// ─── Path types ─────────────────────────────────────────────────────────────

/**
 * Minimal node information used inside a {@link PathSegment}.
 */
export interface PathNodeInfo {
  taxId: string
  businessName: string
  inMyBase: boolean
}

/**
 * A directed segment between two consecutive nodes in a path,
 * including all relationship types connecting them.
 */
export interface PathSegment {
  from: PathNodeInfo
  to: PathNodeInfo
  relationships: string[]
}

/**
 * Response shape for `GET /graph/path`.
 */
export interface PathResponse {
  found: boolean
  path: PathSegment[]
}

// ─── Graph visualization types ───────────────────────────────────────────────

/**
 * A node in the React Flow graph visualization.
 */
export interface GraphNode {
  id: string
  label: string
  inMyBase: boolean
}

/**
 * An edge in the React Flow graph visualization.
 */
export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
}

// ─── Node detail types ───────────────────────────────────────────────────────

/**
 * Full detail of a single node as returned by `GET /graph/node/:taxId`.
 */
export interface LenderMonth {
  period: string
  situation: string
  totalLoan: number
}

export interface Lender {
  entityName: string
  months: LenderMonth[]
}

export interface NodeData {
  taxId: string
  businessName: string | null
  phone: string | null
  email: string | null
  birthday: string | null
  inMyBase: boolean
  entryDate: string | null
  exitDate: string | null
  loadedAt: string | null
  /** All sources that contributed this node (e.g. ["poseidon", "seniorHome"]). */
  sources: string[]
  /**
   * Trust level assigned to this CUIT. See `TRUST_LEVELS` for what each
   * number means; 0 is "Sin nivel", the unclassified default.
   *
   * Optional because responses cached before the field existed will not
   * carry it — treat undefined the same as 0.
   */
  levelOfTrust?: number
  /** Why this CUIT was put in that level. Empty when it has no level. */
  trustReason?: string
  /** Months with Bolsa operations, as `yyyy-mm`, most recent first. */
  bolsaMonths?: string[]
  /** Months with "Deudores por financiera" operations, most recent first. */
  financieraMonths?: string[]
  financieraLenders?: Lender[]
  bankMonths?: string[]
  bankLenders?: Lender[]
  /**
   * Date the company was published in the boletín oficial, as `dd/mm/yyyy`.
   *
   * Only "Empresas concursadas" records it, so it arrives empty for every
   * other source. Optional for the same reason as {@link bolsaMonths}.
   */
  publicationDate?: string
}

/**
 * Fields that can be updated via `PATCH /graph/node/:taxId`.
 */
export interface NodeUpdateFields {
  phone?: string
  email?: string
  birthday?: string,
  entryDate?: string,
  exitDate?: string,
  loadedAt?: string
  /** Omitting this leaves the stored level alone. Send 0 to clear it. */
  levelOfTrust?: number
  trustReason?: string
}

/**
 * A node listed in the "my base" table.
 */
export interface BaseNode {
  taxId: string
  businessName: string
  /** All sources that contributed this node. */
  sources: string[]
  relationshipCount: number
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relatedSources?: string[]
}

/**
 * A row of the crossing-over table: a node that belongs to every selected
 * source at once.
 *
 * A company can belong to a source without carrying it, by being directly
 * related to a node that does — which is the only way a source made of people
 * ("Residentes Senior Home") ever crosses with a source made of companies.
 */
export interface CrossingNode extends BaseNode {
  /**
   * The selected sources this node reaches only through a related node. Empty
   * for a plain member of all of them.
   */
  indirectSources: string[]
}

// ─── Birthday types ─────────────────────────────────────────────────────────

/**
 * A row in the birthdays list.
 * `birthday` is stored as dd/mm/yyyy on the backend; the relationship
 * count is fetched separately (the backend returns it alongside the node).
 */
export interface BirthdayNode {
  taxId: string
  businessName: string
  /** dd/mm/yyyy */
  birthday: string
  sources: string[]
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relationshipCount: number
}

/**
 * Response shape for `GET /graph/birthdays`.
 */
export interface BirthdaysResponse {
  count: number
  results: BirthdayNode[]
}

// ─── Name search types ───────────────────────────────────────────────────────

/**
 * A node matched by searching business names.
 *
 * The backend searches the whole graph, so most results are nodes that are NOT
 * in the base — they were discovered through enrichment. `inMyBase` is what
 * lets the list say which is which.
 */
export interface NameSearchResult {
  taxId: string
  businessName: string
  sources: string[]
  inMyBase: boolean
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relationshipCount: number
  knownRelationshipCount: number
}

// ─── Source administration types ─────────────────────────────────────────────

/**
 * Category a source belongs to.
 *
 * The backend serialises this as `"known" | "to_know"` (snake_case, its domain
 * type). It is normalised to camelCase in `GraphService.getSources` so the
 * whole frontend speaks one dialect — see the note there before changing this.
 */
export type SourceCategory = "known" | "toKnow"

/**
 * A source as registered in the backend graph, with how many nodes hang off it.
 */
export interface SourceInfo {
  name: string
  category: SourceCategory
  nodeCount: number
}

/**
 * Result of a source admin operation, returned identically by a dry run and by
 * the real execution — `dryRun` is what tells them apart.
 *
 * `message` arrives already written in Spanish and is safe to display as-is.
 */
export interface OperationSummary {
  operation: "rename" | "merge" | "delete" | "add-source" | "move-source"
  affectedNodeCount: number
  removedNodeCount: number
  updatedNodeCount: number
  createdSourceName?: string
  removedSourceName?: string
  dryRun: boolean
  message: string
}

// ─── Trust level types ───────────────────────────────────────────────────────

export type TrustLevelColor =
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink"
  | "slate"

export interface TrustLevelInfo {
  value: number
  label: string
  color: TrustLevelColor
  description: string
  nodeCount: number
}

export interface TrustLevelMember {
  taxId: string
  businessName: string
  sources: string[]
  relationshipCount: number
  isKnown: boolean
  isToKnow: boolean
  trustReason: string
}

export interface TrustLevelMembersResponse {
  level: TrustLevelInfo
  members: TrustLevelMember[]
}

export interface TrustLevelOperationSummary {
  operation: "create-level" | "update-level" | "delete-level"
  value: number
  label: string
  affectedNodeCount: number
  dryRun: boolean
  message: string
}

export interface AppUser {
  username: string
  role: "creator" | "admin" | "member"
  createdAt: string
  disabled: boolean
  color?: string | null
}

export interface ActivityEntry {
  time: string
  level: "info" | "warn" | "error"
  event: string
  username: string | null
  details: Record<string, unknown>
}

export interface ActivityPage {
  entries: ActivityEntry[]
  hasMore: boolean
}

export interface CrmResponsible {
  name: string
  color: string
  users: string[]
  disabled: boolean
}

export interface CrmUser {
  username: string
  color: string | null
}

export interface WebResearchSource {
  url: string
  title: string
}

export interface WebResearch {
  id: string
  taxId: string
  requestedAt: string
  requestedBy: string
  status: "done" | "failed"
  summary: string
  sources: WebResearchSource[]
  model: string
  costUsd: number
  webSearches: number
  archivedAt: string | null
  archivedBy: string | null
}

export interface RecentWebResearch extends WebResearch {
  businessName: string
}

export type ArchivedWebResearch = RecentWebResearch

export interface ResearchBudget {
  monthlyLimitUsd: number
  spentThisMonthUsd: number
  researchCountThisMonth: number
}

export interface CrmCompany {
  taxId: string
  businessName: string
  crmBrand: string | null
  crmProduct: string | null
  crmOrigin: string | null
  originSource: string | null
  nosisPending: boolean
  addedAt: string | null
  addedBy: string | null
  lastActionDate: string | null
  nextDueDate: string | null
  openTaskCount: number
  closedAt: string | null
  closedReason: string | null
  closedBy: string | null
}

export interface CrmSource {
  name: string
  category: string
}

export interface CrmCloseResult {
  company: CrmCompany
  cancelledTaskCount: number
  inservible: boolean
}

export interface CrmContact {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  birthday: string | null
  cuil: string | null
  companyTaxIds: string[]
  createdAt: string
  archivedAt: string | null
}

export interface CrmAction {
  id: string
  companyTaxId: string
  date: string
  description: string
  doneBy: string
  recordedBy: string
  contactIds: string[]
  createdTaskId: string | null
  completedTaskIds: string[]
  createdAt: string
  archivedAt: string | null
}

export type CrmTaskStatus = "open" | "done" | "cancelled"

export interface CrmTask {
  id: string
  companyTaxId: string
  description: string
  dueDate: string
  status: CrmTaskStatus
  cancelReason: string | null
  assignee: string
  createdBy: string
  contactIds: string[]
  createdAt: string
  closedAt: string | null
  archivedAt: string | null
}

export interface CrmLastAction {
  date: string
  description: string
  doneBy: string
  contacts: string[]
}

export interface CrmAgendaItem extends CrmTask {
  businessName: string
  lastAction: CrmLastAction | null
  overdue: boolean
}

export interface CrmCompanyDetail {
  company: CrmCompany
  contacts: CrmContact[]
  actions: CrmAction[]
  tasks: CrmTask[]
}

export type CrmRemovalOutcome = "unlinked" | "archived" | "deleted"

export interface CrmRemovalResult {
  outcome: CrmRemovalOutcome
  cancelledTaskCount: number
  dryRun: boolean
}

export interface CrmChange {
  id: string
  at: string
  by: string
  entityType: string
  entityId: string
  operation: string
  before: Record<string, unknown>
  after: Record<string, unknown>
}

export interface NosisPendingItem {
  taxId: string
  businessName: string
  sources: string[]
  addedBy: string | null
  addedAt: string | null
}

export interface NosisPendingQueue {
  command: string
  items: NosisPendingItem[]
}

export interface CrmCompanyInput {
  taxId?: string
  businessName?: string | null
  crmBrand?: string | null
  crmProduct?: string | null
  crmOrigin?: string | null
  originSource?: string | null
}

export interface CrmContactInput {
  fullName?: string
  companyTaxIds?: string[]
  phone?: string | null
  email?: string | null
  birthday?: string | null
  cuil?: string | null
}

export interface CrmTaskInput {
  companyTaxId?: string
  description?: string
  dueDate?: string
  assignee?: string | null
  contactIds?: string[]
  status?: "done" | "cancelled"
  cancelReason?: string | null
}

export interface CrmActionInput {
  companyTaxId: string
  doneBy: string | null
  date: string
  description: string
  contactIds: string[]
  completesTaskIds: string[]
  nextTask: CrmTaskInput | null
}

export interface BirthdaySourceProgress {
  source: string
  people: number
  withBirthday: number
  missing: number
}

export interface BirthdaySweep {
  day: string | null
  consultedToday: number
  dailyLimit: number
  updatedAt: string | null
}

export interface BirthdayMiss {
  taxId: string
  businessName: string
  missedOn: string
}

export interface BirthdayPending {
  taxId: string
  businessName: string
  sources: string[]
}

export interface BirthdayProgress {
  knownPeople: number
  withBirthday: number
  missing: number
  bySource: BirthdaySourceProgress[]
  sweep: BirthdaySweep
  misses: BirthdayMiss[]
  pending: BirthdayPending[]
}
