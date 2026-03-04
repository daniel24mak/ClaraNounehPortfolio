export async function loadProjects() {
  const res = await fetch("/data/projects.json");
  if (!res.ok) throw new Error("Failed to load projects.json");
  const data = await res.json();
  return data.projects ?? [];
}