let overlayEl = null;
let onCloseCb = null;

export function initModal({ onClose } = {}) {
  onCloseCb = onClose ?? null;

  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay";
  overlayEl.innerHTML = `
    <div class="focus-panel" role="dialog" aria-modal="true" aria-label="Project details">
      <div class="focus-header">
        <div>
          <h2 class="focus-title" id="fpTitle"></h2>
          <div class="focus-meta" id="fpMeta"></div>
        </div>
        <button class="focus-close" id="fpClose">Close</button>
      </div>

      <div class="focus-tabs" role="tablist">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="moodboard">Moodboard</button>
        <button class="tab" data-tab="process">Process</button>
      </div>

      <div class="focus-body">
        <div class="focus-media">
          <img class="focus-image" id="fpImage" alt="" />
        </div>

        <div class="focus-text">
          <div class="focus-desc" id="fpDesc"></div>
          <div class="focus-tags" id="fpTags"></div>
          <div class="focus-gallery" id="fpGallery"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  overlayEl.querySelector("#fpClose").addEventListener("click", closeModal);

  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") closeModal();
  });

  overlayEl.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      overlayEl.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      renderTab(tab);
    });
  });
}

let currentProject = null;
let currentTab = "overview";

function getTabImages(project, tab) {
  const g = project.gallery ?? {};
  const arr = g[tab] ?? [];
  if (tab === "overview" && arr.length === 0) {
    // fallback
    if (project.asset) return [project.asset];
  }
  return arr;
}

function renderTab(tab) {
  if (!currentProject || !overlayEl) return;
  currentTab = tab;

  const images = getTabImages(currentProject, tab);
  const main = images[0] ?? "";

  const img = overlayEl.querySelector("#fpImage");
  img.src = main;
  img.alt = currentProject.title ?? "Project";

  const gallery = overlayEl.querySelector("#fpGallery");
  gallery.innerHTML = "";

  // Thumbnails for that tab (click to swap main image)
  images.slice(0, 12).forEach((src) => {
    const t = document.createElement("img");
    t.className = "focus-thumb";
    t.src = src;
    t.alt = "";
    t.addEventListener("click", () => {
      img.src = src;
    });
    gallery.appendChild(t);
  });

  // Description logic
  const desc = overlayEl.querySelector("#fpDesc");
  if (tab === "overview") {
    desc.textContent = currentProject.description ?? "";
  } else if (tab === "moodboard") {
    desc.textContent = currentProject.moodboardNotes ?? "Moodboard references and direction.";
  } else if (tab === "process") {
    desc.textContent = currentProject.processNotes ?? "Process highlights and iterations.";
  }
}

export function openModal(project) {
  if (!overlayEl) initModal();
  currentProject = project;

  overlayEl.querySelector("#fpTitle").textContent = project.title ?? "";
  overlayEl.querySelector("#fpMeta").textContent =
    `${project.year ?? ""} • ${project.role ?? ""}`.trim();

  const tags = overlayEl.querySelector("#fpTags");
  tags.innerHTML = "";
  (project.tools ?? []).forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    tags.appendChild(span);
  });

  // default tab
  overlayEl.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
  overlayEl.querySelector('.tab[data-tab="overview"]').classList.add("active");

  overlayEl.classList.add("open");
  renderTab("overview");
}

export function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove("open");
  currentProject = null;
  if (onCloseCb) onCloseCb();
}

export function isModalOpen() {
  return overlayEl?.classList.contains("open") ?? false;
}