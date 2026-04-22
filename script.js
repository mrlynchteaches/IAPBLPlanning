const STORAGE_KEY = "pbl-semester-planner-v3";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "into", "that", "this", "these", "those", "their", "there", "then",
  "about", "through", "during", "within", "using", "use", "students", "student", "will", "can", "may",
  "should", "able", "across", "among", "under", "over", "between", "after", "before", "each", "other",
  "than", "into", "onto", "upon", "your", "our", "them", "they", "are", "were", "been", "being",
  "what", "when", "where", "which", "whose", "while", "because", "also", "such", "including", "include",
  "standard", "standards", "priority", "level", "grade", "course", "pbl", "project", "projects", "learning"
]);

const DEVALUED_VERBS = new Set([
  "describe", "explain", "explore", "create", "identify", "analyze", "compare", "contrast", "evaluate", "summarize",
  "define", "understand", "demonstrate", "apply", "investigate", "interpret", "develop", "construct", "solve",
  "make", "show", "determine", "discuss", "recognize", "use", "write", "read", "listen", "speak", "collaborate",
  "plan", "design", "present", "argue", "support", "model", "calculate", "estimate", "observe", "communicate",
  "justify", "trace", "classify", "examine", "ask", "answer", "research", "reflect", "organize"
]);

const FIXED_GRADES = ["9", "10", "11", "12"];

const SUBJECT_DEFINITIONS = [
  { key: "math", label: "Math", colorVar: "var(--subject-math)", matches: ["algebra", "geometry", "calculus", "statistics", "stat", "math", "mathematics", "precalculus", "quantitative"] },
  { key: "english", label: "English / ELA", colorVar: "var(--subject-english)", matches: ["english", "ela", "language arts", "literature", "composition", "reading", "writing", "rhetoric"] },
  { key: "science", label: "Science", colorVar: "var(--subject-science)", matches: ["biology", "chemistry", "physics", "science", "environmental", "anatomy", "earth science", "geology", "astronomy"] },
  { key: "social-studies", label: "Social Studies", colorVar: "var(--subject-social-studies)", matches: ["history", "government", "economics", "civics", "social studies", "geography", "world history", "us history", "psychology", "sociology"] },
  { key: "arts", label: "Arts", colorVar: "var(--subject-arts)", matches: ["art", "music", "band", "chorus", "theatre", "theater", "drama", "dance", "visual art", "media arts"] },
  { key: "world-language", label: "World Language", colorVar: "var(--subject-world-language)", matches: ["spanish", "french", "latin", "german", "japanese", "chinese", "language", "esol", "ell"] },
  { key: "cte", label: "CTE / Career Pathways", colorVar: "var(--subject-cte)", matches: ["engineering", "business", "marketing", "computer", "technology", "robotics", "career", "pathway", "cte", "healthcare", "culinary", "agriculture"] },
  { key: "pe-health", label: "PE / Health", colorVar: "var(--subject-pe-health)", matches: ["health", "physical education", "pe", "wellness", "fitness", "sports medicine"] },
  { key: "support-elective", label: "Support / Elective", colorVar: "var(--subject-support-elective)", matches: ["advisory", "seminar", "homeroom", "support", "intervention", "study skills", "elective"] },
  { key: "other", label: "Other", colorVar: "var(--subject-other)", matches: [] }
];

const SAMPLE_ENTRIES = [
  {
    id: crypto.randomUUID(),
    teacher: "Ms. Alvarez",
    course: "Biology",
    grades: ["9"],
    standards: "ecosystems, biodiversity, populations, human impact, energy flow, matter cycles",
    title: "Restoring the School Habitat",
    startDate: "2026-08-17",
    endDate: "2026-09-25"
  },
  {
    id: crypto.randomUUID(),
    teacher: "Mr. Grant",
    course: "English I",
    grades: ["9", "10"],
    standards: "argument, evidence, research, environment, community, audience, claims",
    title: "Community Climate Advocacy",
    startDate: "2026-09-01",
    endDate: "2026-10-02"
  },
  {
    id: crypto.randomUUID(),
    teacher: "Dr. Kim",
    course: "World History",
    grades: ["10"],
    standards: "industrialization, migration, labor, technology, resources, economic systems",
    title: "Industrial Change and Human Cost",
    startDate: "2026-10-05",
    endDate: "2026-11-13"
  }
];

const state = {
  year: new Date().getFullYear(),
  entries: [],
  search: "",
  gradeFilter: "all",
  monthFilter: "semester",
  editingId: null
};

const els = {
  schoolYear: document.getElementById("schoolYear"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  pblForm: document.getElementById("pblForm"),
  teacher: document.getElementById("teacher"),
  course: document.getElementById("course"),
  title: document.getElementById("title"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  standards: document.getElementById("standards"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  clearBtn: document.getElementById("clearBtn"),
  editBanner: document.getElementById("editBanner"),
  metricTotal: document.getElementById("metricTotal"),
  metricSemester: document.getElementById("metricSemester"),
  metricLoaded: document.getElementById("metricLoaded"),
  metricIntensity: document.getElementById("metricIntensity"),
  timelineDescription: document.getElementById("timelineDescription"),
  searchInput: document.getElementById("searchInput"),
  gradeFilter: document.getElementById("gradeFilter"),
  monthFilter: document.getElementById("monthFilter"),
  subjectLegend: document.getElementById("subjectLegend"),
  monthHeader: document.getElementById("monthHeader"),
  timelineList: document.getElementById("timelineList"),
  overlapList: document.getElementById("overlapList"),
  entryList: document.getElementById("entryList"),
  entryActionsTemplate: document.getElementById("entryActionsTemplate")
};

init();

function init() {
  loadState();
  bindEvents();
  render();
}

function bindEvents() {
  els.schoolYear.addEventListener("change", handleYearChange);
  els.pblForm.addEventListener("submit", handleSubmit);
  els.resetBtn.addEventListener("click", resetForm);
  els.clearBtn.addEventListener("click", clearAll);
  els.exportBtn.addEventListener("click", exportJSON);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importJSON);
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });
  els.gradeFilter.addEventListener("change", (event) => {
    state.gradeFilter = event.target.value;
    render();
  });
  els.monthFilter.addEventListener("change", (event) => {
    state.monthFilter = event.target.value;
    render();
  });
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.entries = normalizeEntries(SAMPLE_ENTRIES, state.year);
    setDefaultDates();
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    state.year = Number.isFinite(parsed.year) ? parsed.year : state.year;
    state.entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(sanitizeEntry).filter(Boolean)
      : normalizeEntries(SAMPLE_ENTRIES, state.year);
  } catch (error) {
    console.error("Could not parse saved PBL data", error);
    state.entries = normalizeEntries(SAMPLE_ENTRIES, state.year);
  }

  setDefaultDates();
}

function normalizeEntries(entries, year) {
  return entries.map((entry) => ({
    ...entry,
    startDate: String(entry.startDate).replace(/^\d{4}/, String(year)),
    endDate: String(entry.endDate).replace(/^\d{4}/, String(year))
  })).map(sanitizeEntry).filter(Boolean);
}

function sanitizeEntry(entry) {
  if (!entry) return null;
  const grades = Array.isArray(entry.grades)
    ? entry.grades.map(String)
    : entry.grade
      ? String(entry.grade).split(",").map((value) => value.trim())
      : [];

  const cleanGrades = [...new Set(grades.filter((grade) => FIXED_GRADES.includes(String(grade))))].sort((a, b) => Number(a) - Number(b));

  const clean = {
    id: entry.id || crypto.randomUUID(),
    teacher: String(entry.teacher || "").trim(),
    course: String(entry.course || "").trim(),
    grades: cleanGrades,
    standards: String(entry.standards || "").trim(),
    title: String(entry.title || "").trim(),
    startDate: String(entry.startDate || "").trim(),
    endDate: String(entry.endDate || "").trim()
  };

  if (!clean.teacher || !clean.course || clean.grades.length === 0 || !clean.standards || !clean.title || !clean.startDate || !clean.endDate) {
    return null;
  }
  return clean;
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ year: state.year, entries: state.entries }));
}

function setDefaultDates() {
  els.schoolYear.value = String(state.year);
  els.startDate.value = `${state.year}-08-03`;
  els.endDate.value = `${state.year}-08-21`;
  setSelectedGrades([]);
}

function getSelectedGrades() {
  return [...document.querySelectorAll('input[name="gradeLevels"]:checked')].map((input) => input.value).sort((a, b) => Number(a) - Number(b));
}

function setSelectedGrades(grades) {
  const selected = new Set(grades || []);
  document.querySelectorAll('input[name="gradeLevels"]').forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function handleYearChange() {
  const parsed = Number.parseInt(els.schoolYear.value, 10);
  if (!Number.isFinite(parsed)) return;
  const previousYear = state.year;
  state.year = parsed;

  if (previousYear !== state.year) {
    state.entries = state.entries.map((entry) => ({
      ...entry,
      startDate: shiftDateToYear(entry.startDate, state.year),
      endDate: shiftDateToYear(entry.endDate, state.year)
    }));
  }

  if (!state.editingId) setDefaultDates();

  persistState();
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const entry = sanitizeEntry({
    id: state.editingId || crypto.randomUUID(),
    teacher: els.teacher.value,
    course: els.course.value,
    grades: getSelectedGrades(),
    standards: els.standards.value,
    title: els.title.value,
    startDate: els.startDate.value,
    endDate: els.endDate.value
  });

  if (!entry) {
    alert("Please complete all fields and select at least one grade level before saving this PBL.");
    return;
  }

  const start = toDate(entry.startDate);
  const end = toDate(entry.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    alert("Please enter valid dates.");
    return;
  }
  if (end < start) {
    alert("End date must be on or after the start date.");
    return;
  }

  if (state.editingId) {
    state.entries = state.entries.map((item) => item.id === state.editingId ? entry : item);
  } else {
    state.entries = [...state.entries, entry];
  }

  persistState();
  resetForm();
  render();
}

function resetForm() {
  els.pblForm.reset();
  setDefaultDates();
  state.editingId = null;
  els.submitBtn.textContent = "Add PBL";
  els.editBanner.classList.add("hidden");
}

function clearAll() {
  if (!window.confirm("Delete all saved PBL entries from this browser?")) return;
  state.entries = [];
  state.editingId = null;
  localStorage.removeItem(STORAGE_KEY);
  resetForm();
  render();
}

function exportJSON() {
  const payload = JSON.stringify({ year: state.year, entries: state.entries }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pbl-semester-planner-${state.year}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importJSON(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (Number.isFinite(parsed.year)) {
        state.year = parsed.year;
        els.schoolYear.value = String(state.year);
      }
      if (Array.isArray(parsed.entries)) {
        state.entries = parsed.entries.map(sanitizeEntry).filter(Boolean);
      }
      persistState();
      resetForm();
      render();
    } catch (error) {
      console.error(error);
      alert("That file could not be imported. Please upload a valid JSON export.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function render() {
  const { viewStart, viewEnd, label } = getCurrentViewRange();
  const filteredEntries = getFilteredEntries();
  const activeEntries = filteredEntries
    .filter((entry) => rangesOverlap(toDate(entry.startDate), toDate(entry.endDate), viewStart, viewEnd))
    .sort((a, b) => toDate(a.startDate) - toDate(b.startDate));

  renderMetrics(activeEntries, viewStart, viewEnd, label);
  renderTimelineDescription(viewStart, viewEnd, label);
  renderLegend();
  renderMonthHeader(viewStart, viewEnd);
  renderTimeline(activeEntries, viewStart, viewEnd);
  renderOverlaps(filteredEntries);
  renderEntries();
}

function getCurrentViewRange() {
  if (state.monthFilter === "semester") {
    const viewStart = new Date(state.year, 7, 3, 12);
    const viewEnd = new Date(state.year, 11, 18, 12);
    return { viewStart, viewEnd, label: "semester" };
  }

  const month = Number.parseInt(state.monthFilter, 10);
  const start = new Date(state.year, month - 1, 1, 12);
  const end = new Date(state.year, month, 0, 12);
  const clampedStart = month === 8 ? new Date(state.year, 7, 3, 12) : start;
  const clampedEnd = month === 12 ? new Date(state.year, 11, 18, 12) : end;
  return { viewStart: clampedStart, viewEnd: clampedEnd, label: clampedStart.toLocaleDateString(undefined, { month: "long" }) };
}

function getFilteredEntries() {
  return state.entries.filter((entry) => {
    const searchPass = !state.search || [entry.teacher, entry.course, entry.title, entry.standards, formatGrades(entry.grades)]
      .join(" ")
      .toLowerCase()
      .includes(state.search);

    let gradePass = true;
    if (state.gradeFilter === "multiple") gradePass = entry.grades.length > 1;
    else if (state.gradeFilter !== "all") gradePass = entry.grades.includes(state.gradeFilter);

    return searchPass && gradePass;
  });
}

function renderMetrics(activeEntries, viewStart, viewEnd, label) {
  const totalDays = dayDiff(viewStart, viewEnd) + 1;
  const scheduledDays = new Set();

  activeEntries.forEach((entry) => {
    const start = new Date(Math.max(toDate(entry.startDate), viewStart));
    const end = new Date(Math.min(toDate(entry.endDate), viewEnd));
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      scheduledDays.add(cursor.toISOString().slice(0, 10));
    }
  });

  els.metricTotal.textContent = String(state.entries.length);
  els.metricSemester.textContent = String(activeEntries.length);
  els.metricLoaded.textContent = String(scheduledDays.size);
  els.metricIntensity.textContent = `Coverage intensity: ${Math.round((scheduledDays.size / totalDays) * 100) || 0}% of the current ${label}`;
}

function renderTimelineDescription(viewStart, viewEnd, label) {
  const prefix = label === "semester" ? "Visualize PBL timing across the full Fall semester" : `Month view: ${label}`;
  els.timelineDescription.textContent = `${prefix} from ${formatDate(viewStart)} to ${formatDate(viewEnd)}.`;
}

function renderLegend() {
  els.subjectLegend.innerHTML = "";
  SUBJECT_DEFINITIONS.forEach((subject) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-dot" style="background:${subject.colorVar}"></span><span>${subject.label}</span>`;
    els.subjectLegend.append(item);
  });
}

function renderMonthHeader(viewStart, viewEnd) {
  const segments = monthSegments(viewStart, viewEnd);
  els.monthHeader.innerHTML = "";
  segments.forEach((segment) => {
    const cell = document.createElement("div");
    cell.className = "month-segment";
    cell.style.width = `${segment.width}%`;
    cell.textContent = segment.label;
    els.monthHeader.append(cell);
  });
}

function renderTimeline(entries, viewStart, viewEnd) {
  els.timelineList.innerHTML = "";

  if (!entries.length) {
    els.timelineList.innerHTML = '<div class="empty-state">No PBLs match the current filters.</div>';
    return;
  }

  entries.forEach((entry) => {
    const subject = inferSubject(entry.course);
    const bar = barStyle(entry, viewStart, viewEnd);
    const row = document.createElement("article");
    row.className = "timeline-row";
    const concepts = extractConcepts(entry.standards).slice(0, 2);

    row.innerHTML = `
      <div class="timeline-meta">
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.course)} • ${escapeHtml(entry.teacher)}</p>
        <div class="meta-line">
          <span class="subject-pill subject-${subject.key}">${subject.label}</span>
          <span class="grade-pill">${escapeHtml(formatGrades(entry.grades))}</span>
        </div>
      </div>
      <div class="timeline-track">
        <div class="track-grid">${Array.from({ length: 20 }, () => '<span></span>').join("")}</div>
        <div class="timeline-bar bar-${subject.key}" style="left:${bar.left}%; width:${bar.width}%;"></div>
        <div class="track-footer">
          <span class="tag">${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}</span>
          ${concepts.length ? `<span class="tag">Focus: ${escapeHtml(concepts.join(", "))}</span>` : ""}
        </div>
      </div>
    `;

    els.timelineList.append(row);
  });
}

function renderOverlaps(filteredEntries) {
  const overlaps = [];

  for (let i = 0; i < filteredEntries.length; i += 1) {
    for (let j = i + 1; j < filteredEntries.length; j += 1) {
      const a = filteredEntries[i];
      const b = filteredEntries[j];
      const timeOverlap = rangesOverlap(toDate(a.startDate), toDate(a.endDate), toDate(b.startDate), toDate(b.endDate));
      if (!timeOverlap) continue;

      const overlap = scoreOverlap(a, b);
      if (overlap.shared.length > 0) overlaps.push({ a, b, ...overlap });
    }
  }

  overlaps.sort((x, y) => y.shared.length - x.shared.length || y.score - x.score);
  els.overlapList.innerHTML = "";

  if (!overlaps.length) {
    els.overlapList.innerHTML = '<div class="empty-state">No likely overlaps have been identified yet.</div>';
    return;
  }

  overlaps.forEach((item) => {
    const dateOverlap = getDateOverlapRange(item.a, item.b);
    const sharedGrades = item.a.grades.filter((grade) => item.b.grades.includes(grade));

    const card = document.createElement("article");
    card.className = "overlap-item";
    card.innerHTML = `
      <div class="overlap-summary">
        <div>
          <h3>${item.label} overlap • ${escapeHtml(item.a.title)} ↔ ${escapeHtml(item.b.title)}</h3>
          <p>${escapeHtml(item.a.course)} (${escapeHtml(item.a.teacher)}) and ${escapeHtml(item.b.course)} (${escapeHtml(item.b.teacher)})</p>
          <div class="overlap-badges">
            <span class="badge badge-warning">${item.shared.length} shared concept${item.shared.length === 1 ? "" : "s"}</span>
            <span class="tag">Time overlap: ${formatDate(dateOverlap.start)} – ${formatDate(dateOverlap.end)}</span>
            ${sharedGrades.length ? `<span class="tag">Shared grades: ${escapeHtml(formatGrades(sharedGrades))}</span>` : `<span class="tag">Grades: ${escapeHtml(formatGrades(item.a.grades))} / ${escapeHtml(formatGrades(item.b.grades))}</span>`}
          </div>
        </div>
      </div>
      <details class="overlap-details">
        <summary>View potential overlap details</summary>
        <div class="overlap-concepts-box chip-row">
          ${item.shared.map((concept) => `<span class="tag">${escapeHtml(concept)}</span>`).join("")}
        </div>
        <div class="overlap-detail-grid">
          <div class="overlap-detail-box">
            <h4>${escapeHtml(item.a.title)}</h4>
            <p><strong>Teacher:</strong> ${escapeHtml(item.a.teacher)}</p>
            <p><strong>Course:</strong> ${escapeHtml(item.a.course)}</p>
            <p><strong>Standards:</strong> ${escapeHtml(item.a.standards)}</p>
          </div>
          <div class="overlap-detail-box">
            <h4>${escapeHtml(item.b.title)}</h4>
            <p><strong>Teacher:</strong> ${escapeHtml(item.b.teacher)}</p>
            <p><strong>Course:</strong> ${escapeHtml(item.b.course)}</p>
            <p><strong>Standards:</strong> ${escapeHtml(item.b.standards)}</p>
          </div>
        </div>
      </details>
    `;
    els.overlapList.append(card);
  });
}

function renderEntries() {
  const entries = [...state.entries].sort((a, b) => toDate(a.startDate) - toDate(b.startDate));
  els.entryList.innerHTML = "";

  if (!entries.length) {
    els.entryList.innerHTML = '<div class="empty-state">No entries yet.</div>';
    return;
  }

  entries.forEach((entry) => {
    const subject = inferSubject(entry.course);
    const article = document.createElement("article");
    article.className = "entry-card";
    article.innerHTML = `
      <div class="entry-row">
        <div>
          <h3>${escapeHtml(entry.title)}</h3>
          <div class="entry-subline">
            <span>${escapeHtml(entry.teacher)}</span>
            <span>•</span>
            <span>${escapeHtml(entry.course)}</span>
            <span>•</span>
            <span>${escapeHtml(formatGrades(entry.grades))}</span>
            <span>•</span>
            <span>${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}</span>
          </div>
        </div>
        <div class="entry-actions-wrap">
          <div class="chip-row"><span class="subject-pill subject-${subject.key}">${subject.label}</span></div>
        </div>
      </div>
    `;

    const actionNode = els.entryActionsTemplate.content.cloneNode(true);
    actionNode.querySelector('.edit-entry').addEventListener('click', () => startEditing(entry.id));
    actionNode.querySelector('.delete-entry').addEventListener('click', () => deleteEntry(entry.id));
    article.append(actionNode);
    els.entryList.append(article);
  });
}

function startEditing(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;

  state.editingId = id;
  els.teacher.value = entry.teacher;
  els.course.value = entry.course;
  els.title.value = entry.title;
  els.startDate.value = entry.startDate;
  els.endDate.value = entry.endDate;
  els.standards.value = entry.standards;
  setSelectedGrades(entry.grades);
  els.submitBtn.textContent = "Save Changes";
  els.editBanner.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  if (!window.confirm(`Delete "${entry.title}" from this browser?`)) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  if (state.editingId === id) resetForm();
  persistState();
  render();
}

function inferSubject(courseText = "") {
  const normalized = courseText.toLowerCase();
  return SUBJECT_DEFINITIONS.find((subject) => subject.matches.some((term) => normalized.includes(term))) || SUBJECT_DEFINITIONS.at(-1);
}

function getDateOverlapRange(a, b) {
  return {
    start: new Date(Math.max(toDate(a.startDate), toDate(b.startDate))),
    end: new Date(Math.min(toDate(a.endDate), toDate(b.endDate)))
  };
}

function formatGrades(grades) {
  const list = [...new Set((grades || []).map(String))].sort((a, b) => Number(a) - Number(b));
  if (!list.length) return "No grades";
  if (list.length === 1) return `Grade ${list[0]}`;
  return `Grades ${list.join(', ')}`;
}

function monthSegments(viewStart, viewEnd) {
  const segments = [];
  let cursor = new Date(viewStart);
  cursor.setDate(1);
  while (cursor <= viewEnd) {
    const start = new Date(Math.max(cursor, viewStart));
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const end = new Date(Math.min(new Date(nextMonth - 1), viewEnd));
    const totalDays = dayDiff(viewStart, viewEnd) + 1;
    segments.push({
      label: cursor.toLocaleDateString(undefined, { month: "short" }),
      width: ((dayDiff(start, end) + 1) / totalDays) * 100
    });
    cursor = nextMonth;
  }
  return segments;
}

function scoreOverlap(entryA, entryB) {
  const conceptsA = extractConcepts(entryA.standards);
  const conceptsB = extractConcepts(entryB.standards);
  const shared = conceptsA.filter((concept) => conceptsB.includes(concept));
  const overlapRatio = shared.length / Math.max(1, Math.min(conceptsA.length, conceptsB.length));
  let label = "Low";
  if (shared.length >= 4 || overlapRatio >= 0.5) label = "High";
  else if (shared.length >= 2 || overlapRatio >= 0.25) label = "Medium";
  return { shared, label, score: overlapRatio };
}

function extractConcepts(text) {
  const normalized = normalizeText(text);
  const tokens = normalized
    .split(/[\s,;-]+/)
    .map((token) => singularize(token.trim()))
    .filter(Boolean)
    .filter((token) => token.length >= 4)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !DEVALUED_VERBS.has(token))
    .filter((token) => !/^\d+$/.test(token));

  const frequencies = new Map();
  tokens.forEach((token) => frequencies.set(token, (frequencies.get(token) || 0) + 1));
  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([token]) => token)
    .slice(0, 12);
}

function normalizeText(text = "") {
  return text.toLowerCase().replace(/[\u2018\u2019']/g, "").replace(/[^a-z0-9\s,-]/g, " ").replace(/\s+/g, " ").trim();
}

function singularize(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ses") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function barStyle(entry, viewStart, viewEnd) {
  const totalDays = dayDiff(viewStart, viewEnd) + 1;
  const start = toDate(entry.startDate);
  const end = toDate(entry.endDate);
  const clampedStart = new Date(Math.max(start, viewStart));
  const clampedEnd = new Date(Math.min(end, viewEnd));
  const left = clamp((dayDiff(viewStart, clampedStart) / totalDays) * 100, 0, 100);
  const width = clamp(((dayDiff(clampedStart, clampedEnd) + 1) / totalDays) * 100, 1, 100);
  return { left, width };
}

function formatDate(value) {
  const date = typeof value === "string" ? toDate(value) : value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toDate(value) { return new Date(`${value}T12:00:00`); }
function dayDiff(a, b) { return Math.round((b - a) / (1000 * 60 * 60 * 24)); }
function rangesOverlap(aStart, aEnd, bStart, bEnd) { return aStart <= bEnd && bStart <= aEnd; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function shiftDateToYear(dateString, year) {
  const [_, month = '08', day = '03'] = String(dateString).match(/^(?:\d{4})-(\d{2})-(\d{2})$/) || [];
  return `${year}-${month}-${day}`;
}
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
