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
// Ordem:
// 1.º: Sexta + Quinta
// 2.º: Quarta + Terça
// 3.º: Segunda + Sexta
// 4.º: Quinta + Quarta
// 5.º: Terça + Segunda
// Depois repete.
//

const OUTGOING_POSITIONS = [
  [4, 3], // Sex + Qui
  [2, 1], // Qua + Ter
  [0, 4], // Seg + Sex
  [3, 2], // Qui + Qua
  [1, 0]  // Ter + Seg
];


// ============================================================
// 3. CALCULAR AS 5 CAMISAS DE UMA SEMANA
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

  // Estado inicial:
  // Letras:  A B C D E + reservas F G
  // Números: 1 2 3 4 5 + reservas 6 7
  const current = all.slice(0, 5);
  let reserves = all.slice(5, 7);

  // Aplicar todas as trocas anteriores.
  for (let i = 0; i < occurrence; i++) {

    const positions =
      OUTGOING_POSITIONS[i % OUTGOING_POSITIONS.length];

    // Guardar as 2 camisas que vão sair.
    const outgoing = [
      current[positions[0]],
      current[positions[1]]
    ];

    // As 2 reservas entram exatamente nos lugares
    // das 2 camisas que saíram.
    current[positions[0]] = reserves[0];
    current[positions[1]] = reserves[1];

    // As que saíram passam a ser as novas reservas.
    reserves = outgoing;
  }

  return current;
}


// ============================================================
// 4. CALCULAR AS CAMISAS QUE SAEM NO FIM DA SEMANA
// ============================================================

function getOutgoingShirts(week) {

  const occurrence = week % 2 === 1
    ? Math.floor((week - 1) / 2)
    : Math.floor((week - 2) / 2);

  const positions =
    OUTGOING_POSITIONS[occurrence % OUTGOING_POSITIONS.length];

  const current = shirtsForWeek(week);

  return [
    current[positions[0]],
    current[positions[1]]
  ];
}


// ============================================================
// 5. CALCULAR AS CAMISAS QUE ENTRAM NA SEMANA SEGUINTE
// ============================================================

function getIncomingShirts(week) {

  // A primeira semana é atípica.
  // A semana 2 começa com 1 2 3 4 5,
  // portanto não há camisas para trazer.
  if (week === 1) {
    return ["—", "—"];
  }

  const nextWeek = week + 1;

  // O circuito da próxima semana é o outro circuito.
  //
  // Precisamos descobrir quais 2 camisas desse circuito
  // estão fora na próxima ocorrência.
  const nextOccurrence = nextWeek % 2 === 1
    ? Math.floor((nextWeek - 1) / 2)
    : Math.floor((nextWeek - 2) / 2);

  const allNext = getAllShirts(nextWeek);

  const positions =
    OUTGOING_POSITIONS[
      nextOccurrence % OUTGOING_POSITIONS.length
    ];

  const nextCurrent = shirtsForWeek(nextWeek);

  // As 2 reservas da próxima semana são as camisas
  // que não aparecem nas 5 posições em uso.
  //
  // É precisamente aquilo que tens de trazer de casa.
  const reserves = allNext.filter(
    shirt => !nextCurrent.includes(shirt)
  );

  // Na primeira ocorrência do circuito, as reservas são
  // simplesmente as duas últimas camisas.
  if (reserves.length === 2) {
    return reserves;
  }

  return ["—", "—"];
}


// ============================================================
// 6. MEMÓRIA
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
// 7. DATAS
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
// 8. ESTADO ATUAL
// ============================================================

let state = loadState();

const $ = id =>
  document.getElementById(id);

const outgoingEl =
  $("outgoing");

const incomingEl =
  $("incoming");


// ============================================================
// 9. MOSTRAR A SEMANA
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
  [...outgoing].sort().join(" + ");

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
  [...incoming].sort().join(" + ");
  }
}


// ============================================================
// 10. CONFIGURAÇÃO
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
// 11. GUARDAR CONFIGURAÇÃO
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
// 12. PRÓXIMA SEMANA
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
// 13. CONFIRMAR PRÓXIMA SEMANA
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
// 14. SEMANA ANTERIOR
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
// 15. INSTALAÇÃO COMO APP
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
