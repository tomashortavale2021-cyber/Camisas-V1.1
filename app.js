const STORAGE_KEY = "camisas_estado_v2";
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function getAllShirts(week) {
  return week % 2 === 1 ? ["A", "B", "C", "D", "E", "F"] : ["1", "2", "3", "4", "5", "6"];
}

function shirtsForWeek(week) {
  if (!Number.isInteger(week) || week < 1) throw new Error("Semana inválida.");

  const all = getAllShirts(week);
  const occurrence = week % 2 === 1
    ? Math.floor((week - 1) / 2)
    : Math.floor((week - 2) / 2);

  const step = occurrence % 26;
  const current = all.slice(0, 5);
  let reserve = all[5];

  for (let i = 0; i < step; i++) {
    const position = 4 - (i % 5);
    const old = current[position];
    current[position] = reserve;
    reserve = old;
  }
  return current;
}

function transitionInfo(week) {
  if (week <= 1) return { outgoing: "—", incoming: "—" };
  const previous = shirtsForWeek(week - 1);
  const current = shirtsForWeek(week);
  return {
    outgoing: previous.find(x => !current.includes(x)) ?? "—",
    incoming: current.find(x => !previous.includes(x)) ?? "—"
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDateRange(iso) {
  if (!iso) return "Sem data definida";
  const start = new Date(`${iso}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);

  const fmt = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

function addDays(iso, days) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

let state = loadState();

const $ = id => document.getElementById(id);

function render() {
  if (!state) {
    $("weekTitle").textContent = "Configurar";
    $("dateRange").textContent = "Escolhe a semana atual para começar.";
    $("shirts").innerHTML = "";
    $("outgoing").textContent = "—";
    $("incoming").textContent = "—";
    $("circuitBadge").textContent = "—";
    return;
  }

  const shirts = shirtsForWeek(state.week);

  $("weekTitle").textContent = `Semana ${state.week}`;
  $("dateRange").textContent = formatDateRange(state.date);
  $("circuitBadge").textContent =
    state.week % 2 ? "Circuito A–F" : "Circuito 1–6";

  $("shirts").innerHTML = shirts.map((shirt, i) => `
    <div class="shirt">
      <div class="value">${shirt}</div>
      <div class="day">${DAYS[i]}</div>
    </div>
  `).join("");

  const info = transitionInfo(state.week);
  $("outgoing").textContent = info.outgoing;
  $("incoming").textContent = info.incoming;
}

const setupDialog = $("setupDialog");
const advanceDialog = $("advanceDialog");

function openSetup() {
  $("setupWeek").value = state?.week ?? "";
  $("setupDate").value = state?.date ?? "";
  setupDialog.showModal();
}

$("settingsBtn").addEventListener("click", openSetup);

$("setupCancel").addEventListener("click", () => {
  setupDialog.close();
});

$("advanceCancel").addEventListener("click", () => {
  advanceDialog.close();
});

$("setupForm").addEventListener("submit", e => {
  e.preventDefault();

  const week = Number($("setupWeek").value);

  if (!Number.isInteger(week) || week < 1) return;

  state = {
    week,
    date: $("setupDate").value || ""
  };

  saveState();
  setupDialog.close();
  render();
});

$("nextBtn").addEventListener("click", () => {
  if (!state) {
    openSetup();
    return;
  }

  const next = state.week + 1;

  $("advanceText").textContent =
    `Passar da semana ${state.week} para a semana ${next}. A aplicação só avança se confirmares.`;

  $("advanceDate").value = addDays(state.date, 7);

  advanceDialog.showModal();
});

$("advanceForm").addEventListener("submit", e => {
  e.preventDefault();

  state = {
    week: state.week + 1,
    date: $("advanceDate").value || ""
  };

  saveState();
  advanceDialog.close();
  render();
});

$("prevBtn").addEventListener("click", () => {
  if (!state || state.week <= 1) return;

  state = {
    week: state.week - 1,
    date: addDays(state.date, -7)
  };

  saveState();
  render();
});

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

render();
