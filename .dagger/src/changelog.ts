export class Changelog {
  private static readonly HEADER = "# Changelog";
  private static readonly BLOCK_SPLIT = /(?=^## )/m;
  private static readonly REF_LINK = /^\[[^\]]+\]:\s*https?:\/\//;

  private blocks: string[];

  private constructor(blocks: string[]) {
    this.blocks = blocks;
  }

  static parse(raw: string): Changelog {
    const stripped = raw.startsWith(Changelog.HEADER)
      ? raw.slice(Changelog.HEADER.length).trim()
      : raw.trim();

    // Treat blank / whitespace-only content as empty
    if (!stripped) return Changelog.empty();

    const blocks = stripped
      .split(Changelog.BLOCK_SPLIT)
      .map((b) => b.trim())
      .filter((b) => b && /^##\s+/.test(b)); // must start with a version heading

    return new Changelog(blocks);
  }

  static empty(): Changelog {
    return new Changelog([]);
  }

  /**
   * Merge another Changelog into this one.
   * `incoming` blocks take precedence — existing blocks with the same
   * version header are silently dropped.
   */
  merge(incoming: Changelog): Changelog {
    const seen = new Set(incoming.blocks.map(Changelog.blockKey));
    const deduped = this.blocks.filter((b) => !seen.has(Changelog.blockKey(b)));
    return new Changelog([...incoming.blocks, ...deduped]);
  }

  /**
   * Extract the body of a version block matching `tag` (e.g. "v1.2.3").
   * Returns a fallback string if the tag isn't found.
   */
  section(tag: string): string {
    const version = tag.replace(/^v/, "");
    if (!version) return `Release ${tag}`;

    const escaped = Changelog.escapeRegex(version);
    const pattern = new RegExp(`^##\\s+\\[?v?${escaped}\\]?(?=\\s|$)`, "m");

    const block = this.blocks.find((b) => pattern.test(b));
    if (!block) return `Release ${tag}`;

    const lines = block.split("\n");
    const bodyLines: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) break;
      if (Changelog.REF_LINK.test(lines[i])) break;
      bodyLines.push(lines[i]);
    }

    return bodyLines.join("\n").trim() || `Release ${tag}`;
  }

  toString(): string {
    return [Changelog.HEADER, ...this.blocks].join("\n\n");
  }

  private static blockKey(block: string): string {
    return block.split("\n")[0].trim();
  }

  private static escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
