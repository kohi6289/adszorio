// Tiny, safe Markdown subset for admin-edited text (legal pages, descriptions, FAQ answers).
// Supports: ## / ### headings, paragraphs, "- " lists, **bold**, *italic*, [text](https://… | /path | mailto:).
// All input is HTML-escaped first, so admins cannot inject markup or scripts.

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
      const safe = /^(https?:\/\/|\/|mailto:)/i.test(href) && !/^javascript:/i.test(href);
      if (!safe) return text;
      const ext = /^https?:\/\//i.test(href);
      return `<a href="${href}"${ext ? ' rel="noopener noreferrer" target="_blank"' : ""}>${text}</a>`;
    });
}

export function renderMarkdown(src: string): string {
  const blocks = src.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      if (/^###\s/.test(block)) return `<h3>${inline(block.replace(/^###\s+/, ""))}</h3>`;
      if (/^##\s/.test(block)) return `<h2>${inline(block.replace(/^##\s+/, ""))}</h2>`;
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*-\s+/, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("\n");
}
