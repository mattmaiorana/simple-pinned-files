const STYLE_ID = "simple-pinned-files-explorer-style";

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;

const PIN_SVG_URI = `data:image/svg+xml;utf8,${encodeURIComponent(PIN_SVG)}`;

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
  content: "";
  position: absolute;
  right: 6px;
  top: 50%;
  width: 13px;
  height: 13px;
  transform: translateY(-50%);
  background-color: var(--text-muted);
  opacity: 0.6;
  pointer-events: none;
  -webkit-mask-image: url("${PIN_SVG_URI}");
  mask-image: url("${PIN_SVG_URI}");
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
`;
}

export function removeExplorerStyles(): void {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}
