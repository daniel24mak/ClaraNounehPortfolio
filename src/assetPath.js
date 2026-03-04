// src/assetPath.js
export function assetPath(p) {
  // JSON has "/images/..." and "/models/..."
  // We want "<BASE_URL>images/..." (BASE_URL is "/" locally, "/repo/" on GitHub Pages)
  const clean = String(p || "").replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${clean}`;
}