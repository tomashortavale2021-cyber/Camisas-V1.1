const STORAGE_KEY = "camisas_estado_v3";
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

// ============================================================
// 1. CAMISAS DE CADA CIRCUITO
// ============================================================

function getAllShirts(week) {
  return week % 2 === 1
    ? ["A", "B", "C", "D", "E", "F", "G"]
    : ["1", "2", "3", "4", "5", "6", "7"];
}


// ============================================================
// 2. POSIÇÕES QUE SAEM EM CADA OCORRÊNCIA DO CIRCUITO
// ============================================================
//
// Índices:
// 0 = Segunda
// 1 = Terça
// 2 = Quarta
// 3 = Quinta
// 4 = Sexta
//
// Ordem das duplas que vão lavar:
// 1. Quinta + Sexta
// 2. Terça + Quarta
// 3. Segunda + Sexta
// 4. Quarta + Quinta
// 5. Segunda + Terça
//
// Depois repete.
//

const OUTGOING_POSITIONS = [
  [3, 4], // Qui + Sex
  [1, 2], // Ter + Qua
  [0, 4], // Seg + Sex
  [2, 3], // Qua + Qui
  [0, 1]  // Seg + Ter
];


// ============================================================
// 3. OCORRÊNCIA DO CIRCUITO
// ============================================================

function getOccurrence(week) {
  if (!Number.isInteger(week) || week < 1) {
    throw new Error("Semana inválida.");
  }

  return week % 2 === 1
    ? Math.floor((week - 1) / 2)
    : Math.floor((week - 2) / 2);
}


// ============================================================
// 4. CALCULAR O ESTADO COMPLETO DE UM CIRCUITO
// ============================================================
//
// Cada circuito tem 7 camisas:
// - 5 em uso
// - 2 de reserva
//
// Em cada ocorrência:
// - saem 2 camisas
// - entram as 2 reservas
// - as 2 que saíram tornam-se as novas reservas
//

function circuitState(occurrence, all) {

  const current = all.slice(0, 5);
  let reserves = all.slice(5, 7);

  for (let i = 0; i < occurrence; i++) {

    const positions =
      OUTGOING_POSITIONS[i % OUTGOING_POSITIONS.length];

    // Guardar as duas que vão sair
    const outgoing = [
      current[positions[0]],
      current[positions[1]]
    ];

    // As duas reservas entram nos lugares das que saíram
    current[positions[0]] = reserves[0];
    current[positions[1]] = reserves[1];

    // As que saíram passam a ser as novas reservas
    reserves = outgoing;
  }

  return {
    current,
    reserves
  };
}


// ============================================================
// 5. CAMISAS DA SEMANA
// ============================================================

function shirtsForWeek(week) {

  const all = getAllShirts(week);
  const occurrence = getOccurrence(week);

  return circuitState(occurrence, all).current;
}


// ============================================================
// 6. CAMISAS QUE VÃO SAIR NO FIM DA SEMANA
// ============================================================

function getOutgoingShirts(week) {

  const all = getAllShirts(week);
  const occurrence = getOccurrence(week);

  const state = circuitState(occurrence, all);

  const positions =
    OUTGOING_POSITIONS[
      occurrence % OUTGOING_POSITIONS.length
    ];

  return [
    state.current[positions[0]],
    state.current[positions[1]]
  ];
}


// ============================================================
// 7. CAMISAS QUE VÃO ENTRAR NA SEMANA SEGUINTE
// ============================================================
//
// A semana seguinte pertence ao outro circuito.
//
// Portanto:
// - semana 1 → procura as reservas do circuito numérico
// - semana 2 → procura as reservas do circuito das letras
// - etc.
//
// A exceção é a semana 1, porque é a semana inicial:
// a semana 2 já começa com 1 2 3 4 5.
// Não precisas de trazer nada para ela.
//

function getIncomingShirts(week) {

  // A primeira semana é especial:
  // a semana 2 já começa com 1 2 3 4 5.
  if (week === 1) {
    return ["—", "—"];
  }

  // O circuito da próxima semana é o circuito oposto.
  const nextWeek = week + 1;

  // A ocorrência do circuito que está atualmente em casa
  // é a ocorrência imediatamente anterior à próxima semana.
  const currentOccurrenceOfNextCircuit =
    getOccurrence(nextWeek) - 1;

  // Se for a primeira ocorrência desse circuito,
  // as duas reservas iniciais são as duas últimas camisas.
  if (currentOccurrenceOfNextCircuit < 0) {
    const all = getAllShirts(nextWeek);
    return all.slice(5, 7);
  }

  const all = getAllShirts(nextWeek);

  const nextCircuitState =
    circuitState(
      currentOccurrenceOfNextCircuit,
      all
    );

  // Estas são as 2 camisas que estão em casa
  // e que vão entrar na próxima semana.
  return nextCircuitState.reserves;
}


// ============================================================
// 8. MEMÓRIA
// ============================================================

function loadState() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    return raw
      ? JSON.parse(raw)
      : null;

  } catch {

    return null;
  }
}


function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


// ============================================================
// 9. DATAS
// ============================================================

function formatDateRange(iso) {

  if (!iso) {
    return "Sem data definida";
  }

  const start =
    new Date(`${iso}T12:00:00`);

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 4
  );

  const fmt =
    new Intl.DateTimeFormat("pt-PT", {
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

  const d =
    new Date(`${iso}T12:00:00`);

  d.setDate(
    d.getDate() + days
  );

  return d.toISOString().slice(0, 10);
}


// ============================================================
// 10. ESTADO ATUAL
// ============================================================

let state = loadState();

const $ = id =>
  document.getElementById(id);

const outgoingEl =
  $("outgoing");

const incomingEl =
  $("incoming");


// ============================================================
// 11. MOSTRAR A SEMANA
// ============================================================

function render() {

  if (!state) {

    $("weekTitle").textContent =
      "Configurar";

    $("dateRange").textContent =
      "Escolhe a semana atual para começar.";

    $("shirts").innerHTML =
      "";

    outgoingEl.textContent =
      "—";

    incomingEl.textContent =
      "—";

    if ($("circuitBadge")) {
      $("circuitBadge").textContent =
        "—";
    }

    return;
  }


  // ----------------------------------------------------------
  // CAMISAS DA SEMANA
  // ----------------------------------------------------------

  const shirts =
    shirtsForWeek(state.week);


  $("weekTitle").textContent =
    `Semana ${state.week}`;


  $("dateRange").textContent =
    formatDateRange(state.date);


  if ($("circuitBadge")) {

    $("circuitBadge").textContent =
      state.week % 2 === 1
        ? "Circuito A–G"
        : "Circuito 1–7";
  }


  $("shirts").innerHTML =
    shirts.map((shirt, i) => `
      <div class="shirt">
        <div class="value">${shirt}</div>
        <div class="day">${DAYS[i]}</div>
      </div>
    `).join("");


  // ----------------------------------------------------------
  // CAMISAS QUE VÃO SAIR
  // ----------------------------------------------------------

  const outgoing =
    getOutgoingShirts(state.week);

  outgoingEl.textContent =
    outgoing.join(" + ");


  // ----------------------------------------------------------
  // CAMISAS QUE VÃO ENTRAR
  // ----------------------------------------------------------

  const incoming =
    getIncomingShirts(state.week);

  if (state.week === 1) {

    incomingEl.textContent =
      "—";

  } else {

    incomingEl.textContent =
      incoming.join(" + ");
  }
}


// ============================================================
// 12. CONFIGURAÇÃO
// ============================================================

const setupDialog =
  $("setupDialog");

const advanceDialog =
  $("advanceDialog");


function openSetup() {

  $("setupWeek").value =
    state?.week ?? "";

  $("setupDate").value =
    state?.date ?? "";

  setupDialog.showModal();
}


$("settingsBtn")
  .addEventListener(
    "click",
    openSetup
  );


$("setupCancel")
  .addEventListener(
    "click",
    () => {
      setupDialog.close();
    }
  );


$("advanceCancel")
  .addEventListener(
    "click",
    () => {
      advanceDialog.close();
    }
  );


// ============================================================
// 13. GUARDAR CONFIGURAÇÃO
// ============================================================

$("setupForm")
  .addEventListener(
    "submit",
    e => {

      e.preventDefault();

      const week =
        Number(
          $("setupWeek").value
        );

      if (
        !Number.isInteger(week) ||
        week < 1
      ) {
        return;
      }

      state = {
        week,
        date:
          $("setupDate").value || ""
      };

      saveState();

      setupDialog.close();

      render();
    }
  );


// ============================================================
// 14. PRÓXIMA SEMANA
// ============================================================

$("nextBtn")
  .addEventListener(
    "click",
    () => {

      if (!state) {

        openSetup();

        return;
      }

      const next =
        state.week + 1;

      $("advanceText").textContent =
        `Passar da semana ${state.week} para a semana ${next}. A aplicação só avança se confirmares.`;

      $("advanceDate").value =
        addDays(
          state.date,
          7
        );

      advanceDialog.showModal();
    }
  );


// ============================================================
// 15. CONFIRMAR PRÓXIMA SEMANA
// ============================================================

$("advanceForm")
  .addEventListener(
    "submit",
    e => {

      e.preventDefault();

      state = {

        week:
          state.week + 1,

        date:
          $("advanceDate").value || ""
      };

      saveState();

      advanceDialog.close();

      render();
    }
  );


// ============================================================
// 16. SEMANA ANTERIOR
// ============================================================

$("prevBtn")
  .addEventListener(
    "click",
    () => {

      if (
        !state ||
        state.week <= 1
      ) {
        return;
      }

      state = {

        week:
          state.week - 1,

        date:
          addDays(
            state.date,
            -7
          )
      };

      saveState();

      render();
    }
  );


// ============================================================
// 17. INSTALAÇÃO COMO APP
// ============================================================

window.addEventListener(
  "beforeinstallprompt",
  e => {

    e.preventDefault();

    window.deferredInstallPrompt =
      e;
  }
);


// ============================================================
// INICIAR
// ============================================================

render();
