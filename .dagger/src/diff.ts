import type { ModelData, ModelDiff } from "./types"

/**
 * Diff two model arrays by id.
 * Returns added, removed, and field-level updated models.
 */
export function diffModels(before: ModelData[], after: ModelData[]): ModelDiff {
  const sortById = (a: ModelData, b: ModelData) => a.id.localeCompare(b.id)

  const sortedBefore = [...before].sort(sortById)
  const sortedAfter = [...after].sort(sortById)

  const beforeMap = new Map(sortedBefore.map((m) => [m.id, m]))
  const afterMap = new Map(sortedAfter.map((m) => [m.id, m]))

  const added = after
    .filter((m) => !beforeMap.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const removed = before
    .filter((m) => !afterMap.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const updated: ModelDiff["updated"] = []

  for (const [id, newModel] of afterMap) {
    const oldModel = beforeMap.get(id)
    if (!oldModel) continue

    const changes = (Object.keys(newModel) as (keyof ModelData)[]).reduce(
      (acc, field) => {
        const oldVal = JSON.stringify(oldModel[field])
        const newVal = JSON.stringify(newModel[field])
        if (oldVal !== newVal) acc[field] = { before: oldModel[field], after: newModel[field] }
        return acc
      },
      {} as Record<string, { before: unknown; after: unknown }>,
    )

    if (Object.keys(changes).length > 0) updated.push({ id, changes })
  }

  updated.sort((a, b) => a.id.localeCompare(b.id))

  return { added, removed, updated }
}

/**
 * Render a markdown CHANGELOG entry for a given diff and version.
 */
export function renderChangelog(diff: ModelDiff, version: string, date: string): string {
  const sections: string[] = [`# Changelog\n`, `## v${version} — ${date}\n`]

  const renderSection = (title: string, items: string[]) => {
    if (items.length === 0) return
    sections.push(`### ${title}\n`, ...items, "")
  }

  renderSection("Added", diff.added.map((m) => `- **${m.name}** (\`${m.id}\`)`))
  renderSection("Removed", diff.removed.map((m) => `- **${m.name}** (\`${m.id}\`)`))
  renderSection("Updated", diff.updated.map((u) => `- \`${u.id}\` — changed: ${Object.keys(u.changes).join(", ")}`))

  return sections.join("\n")
}