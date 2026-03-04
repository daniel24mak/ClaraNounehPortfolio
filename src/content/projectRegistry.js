export async function loadProjects() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/projects.json`);
  if (!res.ok) throw new Error(`Failed to load projects.json: ${res.status}`);
  const data = await res.json();

  // Prefix asset paths with BASE_URL so GitHub Pages subpath works.
  const base = import.meta.env.BASE_URL;

  const projects = (data.projects ?? []).map((p) => {
    const fix = (path) => {
      if (!path) return path;
      // If it already starts with http(s), keep it
      if (/^https?:\/\//i.test(path)) return path;
      // If it already begins with BASE_URL, keep it
      if (path.startsWith(base)) return path;
      // Remove leading "/" then prefix with BASE_URL
      return `${base}${path.replace(/^\//, "")}`;
    };

    const out = { ...p };

    out.thumbnail = fix(out.thumbnail);
    out.asset = fix(out.asset);

    if (out.gallery) {
      out.gallery = {
        overview: (out.gallery.overview ?? []).map(fix),
        moodboard: (out.gallery.moodboard ?? []).map(fix),
        process: (out.gallery.process ?? []).map(fix),
      };
    }

    return out;
  });

  return projects;
}