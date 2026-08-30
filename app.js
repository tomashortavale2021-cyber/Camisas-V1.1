const STORAGE_KEY = "camisas_estado_v2";
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

// ============================================================
// 1. CAMISAS DE CADA CIRCUITO
// ============================================================

function getAllShirts(week) {
  return week % 2 === 1
    ? ["A", "B", "C", "D", "E", "F"]
    : ["1", "2", "3", "4", "5", "6"];
}


// ============================================================
// 2. CALCULAR AS 5 CAMISAS DE UMA SEMANA
// ============================================================

function shirtsForWeek(week) {
  if (!Number.isInteger(week) || week < 1) {
    throw new Error("Semana inválida.");
  }

  const all = getAllShirts(week);

  // Cada circuito aparece de 2 em 2 semanas.
  const occurrence = week % 2 === 1
    ? Math.floor((week - 1) / 2)
    : Math.floor((week - 2) / 2);

  // Cada circuito tem 26 estados antes de repetir.
  const step = occurrence % 26;

  // Estado inicial:
  // ABCDE + F em reserva
  // ou
  // 12345 + 6 em reserva
  const current = all.slice(0, 5);
  let reserve = all[5];

  // A camisa que muda de posição percorre:
  // Sex → Qui → Qua → Ter → Seg → Sex → ...
  for (let i = 0; i < step; i++) {
    const position = 4 - (i % 5);

    const old = current[position];
    current[position] = reserve;
    reserve = old;
  }

  return current;
}


// ============================================================
// 3. DESCOBRIR QUAL CAMISA SAI NO FIM DA SEMANA
// ============================================================

function getOutgoingShirt(week) {

  // A semana seguinte usa o mesmo circuito apenas
  // duas semanas depois.
  const nextSameCircuitWeek = week + 2;

  const current = shirtsForWeek(week);
  const nextSameCircuit = shirtsForWeek(nextSameCircuitWeek);

  // A camisa que desaparece da lista é a que vai para casa.
  return current.find(shirt => !nextSameCircuit.includes(shirt)) ?? "—";
}


// ============================================================
// 4. DESCOBRIR QUAL CAMISA ENTRA NA SEMANA SEGUINTE
// ============================================================

function getIncomingShirt(week) {

  const nextWeek = week + 1;

  // Na semana seguinte muda de circuito:
  // letras → números
  // números → letras
  const allNext = getAllShirts(nextWeek);
  const shirtsNextWeek = shirtsForWeek(nextWeek);

  // Das 6 camisas desse circuito, uma fica em casa.
  // É essa que tens de trazer para a próxima semana.
  return allNext.find(shirt => !shirtsNextWeek.includes(shirt)) ?? "—";
}


// ============================================================
// 5. MEMÓRIA
// ============================================================

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


// ============================================================
// 6. DATAS
// ============================================================

function formatDateRange(iso) {

  if (!iso) {
    return "Sem data definida";
  }

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

  if (!iso) {
    return "";
  }

  const d = new Date(`${iso}T12:00:00`);

  d.setDate(d.getDate() + days);

  return d.toISOString().slice(0, 10);
}


// ============================================================
// 7. ESTADO ATUAL
// ============================================================

let state = loadState();

const $ = id => document.getElementById(id);

const outgoingEl = $("outgoing");
const incomingEl = $("incoming");


// ============================================================
// 8. MOSTRAR A SEMANA
// ============================================================

function render() {

  // Ainda não configurado
  if (!state) {

    $("weekTitle").textContent = "Configurar";

    $("dateRange").textContent =
      "Escolhe a semana atual para começar.";

    $("shirts").innerHTML = "";

    outgoingEl.textContent = "—";
    incomingEl.textContent = "—";

    if ($("circuitBadge")) {
      $("circuitBadge").textContent = "—";
    }

    return;
  }


  // Camisas desta semana
  const shirts = shirtsForWeek(state.week);


  // Título
  $("weekTitle").textContent =
    `Semana ${state.week}`;


  // Datas
  $("dateRange").textContent =
    formatDateRange(state.date);


  // Circuito
  if ($("circuitBadge")) {

    $("circuitBadge").textContent =
      state.week % 2 === 1
        ? "Circuito A–F"
        : "Circuito 1–6";
  }


  // Camisas
  $("shirts").innerHTML = shirts.map((shirt, i) => `
    <div class="shirt">
      <div class="value">${shirt}</div>
      <div class="day">${DAYS[i]}</div>
    </div>
  `).join("");


  // ----------------------------------------------------------
  // O QUE SAI NO FINAL DESTA SEMANA
  // ----------------------------------------------------------

  outgoingEl.textContent = getOutgoingShirt(state.week);

// A primeira semana é atípica:
// a semana 2 já tem as 5 camisas numéricas normais,
// portanto não é necessário trazer nenhuma camisa.
if (state.week === 1) {
  incomingEl.textContent = "—";
} else {
  incomingEl.textContent = getIncomingShirt(state.week);
  }
}


// ============================================================
// 9. CONFIGURAÇÃO
// ============================================================

const setupDialog = $("setupDialog");
const advanceDialog = $("advanceDialog");


function openSetup() {

  $("setupWeek").value =
    state?.week ?? "";

  $("setupDate").value =
    state?.date ?? "";

  setupDialog.showModal();
}


$("settingsBtn").addEventListener("click", openSetup);


// Cancelar configuração
$("setupCancel").addEventListener("click", () => {
  setupDialog.close();
});


// Cancelar avanço
$("advanceCancel").addEventListener("click", () => {
  advanceDialog.close();
});


// Guardar configuração
$("setupForm").addEventListener("submit", e => {

  e.preventDefault();

  const week =
    Number($("setupWeek").value);

  if (!Number.isInteger(week) || week < 1) {
    return;
  }

  state = {
    week,
    date: $("setupDate").value || ""
  };

  saveState();

  setupDialog.close();

  render();
});


// ============================================================
// 10. PRÓXIMA SEMANA
// ============================================================

$("nextBtn").addEventListener("click", () => {

  if (!state) {

    openSetup();

    return;
  }


  const next =
    state.week + 1;


  $("advanceText").textContent =
    `Passar da semana ${state.week} para a semana ${next}. A aplicação só avança se confirmares.`;


  // Por defeito, a data avança 7 dias.
  // Mas continuas a poder alterá-la manualmente.
  $("advanceDate").value =
    addDays(state.date, 7);


  advanceDialog.showModal();
});


// Confirmar próxima semana
$("advanceForm").addEventListener("submit", e => {

  e.preventDefault();

  state = {

    week: state.week + 1,

    date:
      $("advanceDate").value || ""
  };

  saveState();

  advanceDialog.close();

  render();
});


// ============================================================
// 11. SEMANA ANTERIOR
// ============================================================

$("prevBtn").addEventListener("click", () => {

  if (!state || state.week <= 1) {
    return;
  }


  state = {

    week:
      state.week - 1,

    date:
      addDays(state.date, -7)
  };


  saveState();

  render();
});


// ============================================================
// 12. INSTALAÇÃO COMO APP
// ============================================================

window.addEventListener("beforeinstallprompt", e => {

  e.preventDefault();

  window.deferredInstallPrompt = e;
});


// ============================================================
// INICIAR
// ============================================================

render();
