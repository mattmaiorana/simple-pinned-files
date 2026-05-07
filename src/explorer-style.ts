const STYLE_ID = "simple-pinned-files-explorer-style";

function escapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function updateExplorerStyles(paths: string[]): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }

  if (paths.length === 0) {
    el.textContent = "";
    return;
  }

  const baseSelectors = paths
    .map((p) => `.nav-file-title[data-path="${escapeAttr(p)}"]`)
    .join(",\n");

  const afterSelectors = paths
    .map((p) => `.nav-file-title[data-path="${escapeAttr(p)}"]::after`)
    .join(",\n");

  el.textContent = `
${baseSelectors} {
  position: relative;
  padding-right: 22px;
}
${afterSelectors} {
  content: "📌";
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75em;
  opacity: 0.6;
  pointer-events: none;
}
`;
}

export function removeExplorerStyles(): void {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}
