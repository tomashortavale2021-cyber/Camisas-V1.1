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
// 2. POSIÇÕES QUE SAEM EM CADA OCORRÊNCIA
// ============================================================
//
// Índices:
// 0 = Segunda
// 1 = Terça
// 2 = Quarta
// 3 = Quinta
// 4 = Sexta
//
// Ordem circular:
// Qui + Sex
// Ter + Qua
// Sex + Seg
// Qua + Qui
// Seg + Ter
//
// Depois repete.
//

const OUTGOING_POSITIONS = [
  [3, 4], // Qui + Sex
  [1, 2], // Ter + Qua
  [4, 0], // Sex + Seg
  [2, 3], // Qua + Qui
  [0, 1]  // Seg + Ter
];


// ============================================================
// 3. OCORRÊNCIA DO CIRCUITO
// ============================================================
//
// Cada circuito aparece de 2 em 2 semanas.
//
// Letras:
// Semana 1 = ocorrência 0
// Semana 3 = ocorrência 1
// Semana 5 = ocorrência 2
// ...
//
// Números:
// Semana 2 = ocorrência 0
// Semana 4 = ocorrência 1
// Semana 6 = ocorrência 2
// ...

function getOccurrence(week) {

  if (!Number.isInteger(week) || week < 1) {
    throw new Error("Semana inválida.");
  }

  return week % 2 === 1
    ? Math.floor((week - 1) / 2)
    : Math.floor((week - 2) / 2);
}


// ============================================================
// 4. CALCULAR O ESTADO DE UM CIRCUITO
// ============================================================
//
// Cada circuito tem:
// - 5 camisas em circulação
// - 2 camisas de reserva
//
// Quando ocorre uma troca:
// - saem 2 camisas
// - entram as 2 reservas
// - as 2 que saíram passam a ser as novas reservas
//
// Isto reproduz a lógica do circuito circular.
//

function circuitState(occurrence, all) {

  const current = all.slice(0, 5);
  let reserves = all.slice(5, 7);

  for (let i = 0; i < occurrence; i++) {

    const positions =
      OUTGOING_POSITIONS[i % OUTGOING_POSITIONS.length];

    // Camisas que vão sair
    const outgoing = [
      current[positions[0]],
      current[positions[1]]
    ];

    // As reservas entram exatamente
    // nos lugares das camisas que saíram
    current[positions[0]] = reserves[0];
    current[positions[1]] = reserves[1];

    // As que saíram passam a ser reservas
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
//
// Importante:
// estas são as camisas que estão atualmente nos dois
// lugares que serão substituídos.
//
// Não são simplesmente as duas reservas.
//

function getOutgoingShirts(week) {

  const all = getAllShirts(week);
  const occurrence = getOccurrence(week);

  const currentState =
    circuitState(occurrence, all);

  const positions =
    OUTGOING_POSITIONS[
      occurrence % OUTGOING_POSITIONS.length
    ];

  return [
    currentState.current[positions[0]],
    currentState.current[positions[1]]
  ];
}


// ============================================================
// 7. CAMISAS QUE VÃO ENTRAR NA SEMANA SEGUINTE
// ============================================================
//
// Há duas situações:
//
// A) A semana seguinte pertence ao mesmo circuito
//
// Nesse caso, entram as duas reservas atuais.
//
// B) A semana seguinte pertence ao outro circuito
//
// Nesse caso, precisamos de saber quais são as duas reservas
// desse outro circuito antes da sua próxima troca.
//
// Essas são precisamente as duas camisas que tens de trazer
// de casa.
//

function getIncomingShirts(week) {

  // Semana 1 é atípica:
  // a semana 2 começa diretamente com 1 2 3 4 5.
  if (week === 1) {
    return ["_"];
  }

  const nextWeek = week + 1;

  const currentCircuit = getAllShirts(week);
  const nextCircuit = getAllShirts(nextWeek);

  const currentOccurrence =
    getOccurrence(week);

  const nextOccurrence =
    getOccurrence(nextWeek);


  // ----------------------------------------------------------
  // CASO 1:
  // A próxima semana pertence ao MESMO circuito
  // ----------------------------------------------------------

  if (currentCircuit[0] === nextCircuit[0]) {

    const currentState =
      circuitState(
        currentOccurrence,
        currentCircuit
      );

    return currentState.reserves;
  }


  // ----------------------------------------------------------
  // CASO 2:
  // A próxima semana pertence ao OUTRO circuito
  // ----------------------------------------------------------
  //
  // Precisamos das reservas desse circuito no início
  // da ocorrência seguinte.
  //
  // Exemplo:
  //
  // Semana 6 = números
  // Semana 7 = letras
  //
  // Para saber o que entra na semana 7, calculamos
  // o estado das letras na ocorrência anterior.
  //
  // As reservas desse estado são as camisas que tens
  // de trazer de casa.
  //

  if (nextOccurrence === 0) {

    const nextState =
      circuitState(
        0,
        nextCircuit
      );

    return nextState.reserves;
  }

  const previousState =
    circuitState(
      nextOccurrence - 1,
      nextCircuit
    );

  return previousState.reserves;
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

  // ----------------------------------------------------------
  // APLICAÇÃO AINDA NÃO CONFIGURADA
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // CIRCUITO
  // ----------------------------------------------------------

  if ($("circuitBadge")) {

    $("circuitBadge").textContent =
      state.week % 2 === 1
        ? "Circuito A–G"
        : "Circuito 1–7";
  }


  // ----------------------------------------------------------
  // MOSTRAR AS 5 CAMISAS
  // ----------------------------------------------------------

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

  incomingEl.textContent =
    incoming.join(" + ");
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
