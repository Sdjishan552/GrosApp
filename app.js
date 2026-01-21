document.addEventListener('DOMContentLoaded', function() {

/* ================= DATE FORMATTER ================= */

function formatDate(date = new Date()) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/* ================= BASIC STATE ================= */

let language = localStorage.getItem("lang") || "bn";

const defaultItems = [
  { id: "chini", bn: "চিনি", en: "Sugar" }
];

let items = JSON.parse(localStorage.getItem("items")) ||
  defaultItems.map(i => ({
    ...i,
    checked: false,
    quantity: 1,
    unit: "unit"
  }));

let comparisonMode = false;
/* ================= MASTER LIST ================= */

function getMasterList() {
  return JSON.parse(localStorage.getItem("masterList")) || [];
}

function saveMasterList(list) {
  localStorage.setItem("masterList", JSON.stringify(list));
}


/* ================= PAGE ELEMENTS ================= */

const homePage = document.getElementById("homePage");
const historyPage = document.getElementById("historyPage");
const historyDetailPage = document.getElementById("historyDetailPage");
const comparisonPage = document.getElementById("comparisonPage");
const masterPage = document.getElementById("masterPage");

const list = document.getElementById("itemList");

/* ================= PAGE SWITCHING ================= */

function showHome() {
  homePage.classList.remove("hidden");
  historyPage.classList.add("hidden");
  historyDetailPage.classList.add("hidden");
  comparisonPage.classList.add("hidden");
  masterPage.classList.add("hidden");
}

function showHistory() {
  homePage.classList.add("hidden");
  historyPage.classList.remove("hidden");
  historyDetailPage.classList.add("hidden");
  comparisonPage.classList.add("hidden");
  masterPage.classList.add("hidden");
}


function showHistoryDetail() {
  homePage.classList.add("hidden");
  historyPage.classList.add("hidden");
  historyDetailPage.classList.remove("hidden");
  comparisonPage.classList.add("hidden");
  masterPage.classList.add("hidden");
}
function showComparison() {
  homePage.classList.add("hidden");
  historyPage.classList.add("hidden");
  historyDetailPage.classList.add("hidden");
  comparisonPage.classList.remove("hidden");

  runComparison(); // 🔴 THIS WAS MISSING
}
function showMaster() {
  homePage.classList.add("hidden");
  historyPage.classList.add("hidden");
  historyDetailPage.classList.add("hidden");
  comparisonPage.classList.add("hidden");

  masterPage.classList.remove("hidden");
}


function backToHomeFromMaster() {
  masterPage.classList.add("hidden");
  homePage.classList.remove("hidden");
}

/* ================= ITEM RENDER ================= */

function render() {
  list.innerHTML = "";

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <label style="display:flex; justify-content:space-between; align-items:center;">
        <span>
          <input type="checkbox" ${item.checked ? "checked" : ""}>
${item.bn || item.en}
        </span>
        <button class="deleteBtn">🗑️</button>
      </label>

      ${item.checked ? `
        <div>
          <input type="number" value="${item.quantity}">
          <select>
            <option ${item.unit === "unit" ? "selected" : ""}>unit</option>
            <option ${item.unit === "kg" ? "selected" : ""}>kg</option>
            <option ${item.unit === "gram" ? "selected" : ""}>gram</option>
          </select>
        </div>
      ` : ""}
    `;

    div.querySelector("input[type=checkbox]").onchange = e => {
      item.checked = e.target.checked;
      save();
      render();
    };

    div.querySelector(".deleteBtn").onclick = () => {
      if (confirm(language === "bn" ? "এই জিনিসটি মুছে ফেলবেন?" : "Delete this item?")) {
        items.splice(index, 1);
        save();
        render();
      }
    };

    if (item.checked) {
      div.querySelector("input[type=number]").onchange = e => {
        item.quantity = Number(e.target.value);
        save();
      };
      div.querySelector("select").onchange = e => {
        item.unit = e.target.value;
        save();
      };
    }

    list.appendChild(div);
  });
}

function save() {
  localStorage.setItem("items", JSON.stringify(items));
}

render();




/* ================= ADD ITEM ================= */

const modal = document.getElementById("modal");

document.getElementById("addItemBtn").onclick = () =>
  modal.classList.remove("hidden");


document.getElementById("saveItem").onclick = () => {
  const name = bnName.value.trim();

  // ❌ Block empty or space-only input
  if (name.length < 1) {
    alert("⚠️ অন্তত একটি অক্ষর লিখুন");
    return;
  }

  items.push({
    id: Date.now(),
    bn: name,
    en: name,
    checked: true,
    quantity: Number(qty.value) || 1,
    unit: unit.value
  });

  bnName.value = ""; // clear input
  save();
  modal.classList.add("hidden");
  render();
};


/* ================= HISTORY STORAGE ================= */

function getHistory() {
  return JSON.parse(localStorage.getItem("history")) || [];
}

function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem("history", JSON.stringify(history));
}

function fillPdfTable(items) {
  const table = document.getElementById("pdfTable");
  table.innerHTML = "";

  let count = 1;

  items.filter(i => i.checked).forEach(item => {
    const tr = document.createElement("tr");

    const td1 = document.createElement("td");
    td1.innerText = count++;
    td1.style.border = "1px solid #000";
    td1.style.padding = "8px";
    td1.style.textAlign = "center";

    const td2 = document.createElement("td");
    td2.innerText = item.bn;
    td2.style.border = "1px solid #000";
    td2.style.padding = "8px";

    const td3 = document.createElement("td");
    td3.innerText = `${item.quantity} ${item.unit}`;
    td3.style.border = "1px solid #000";
    td3.style.padding = "8px";
    td3.style.textAlign = "center";

    const td4 = document.createElement("td");
    td4.innerText = "";
    td4.style.border = "1px solid #000";
    td4.style.padding = "8px";

    tr.append(td1, td2, td3, td4);
    table.appendChild(tr);
  });
}

function loadLastBill() {
  const history = getHistory();

  if (history.length === 0) {
    alert(language === "bn"
      ? "কোনো আগের তালিকা নেই"
      : "No previous list found");
    return;
  }

  const lastBill = history[0]; // latest PDF

  // Clear current selections
  items.forEach(item => {
    item.checked = false;
  });

  // Apply last bill items
  lastBill.items.forEach(billItem => {
    const found = items.find(i => i.bn === billItem.name);

    if (found) {
      found.checked = true;
      found.quantity = billItem.quantity;
      found.unit = billItem.unit;
    } else {
      // If item no longer exists, add it
      items.push({
        id: Date.now() + Math.random(),
        bn: billItem.name,
        en: billItem.name,
        checked: true,
        quantity: billItem.quantity,
        unit: billItem.unit
      });
    }
  });

  save();
  render();
  showHome(); // go back to home page
}
/* ================= LOAD MASTER LIST ================= */

document.getElementById("loadMaster").onclick = () => {
  const master = getMasterList();

  if (master.length === 0) {
    alert("মাস্টার তালিকা খালি");
    return;
  }

  items.forEach(i => i.checked = false);

  master.forEach(m => {
    let found = items.find(i => i.bn === m.bn);

    if (!found) {
      items.push({
        id: Date.now() + Math.random(),
        bn: m.bn,
        en: m.en,
        checked: true,
        quantity: 1,
        unit: "unit"
      });
    } else {
      found.checked = true;
      found.quantity = 1;
      found.unit = "unit";
    }
  });

  save();
  render();


};


/* ================= PDF + SAVE HISTORY ================= */

const previewModal = document.getElementById("pdfPreviewModal");
const previewTable = document.getElementById("previewTable");
const previewDate = document.getElementById("previewDate");

document.getElementById("generatePdfBtn").onclick = () => {
  previewTable.innerHTML = "";
  previewDate.innerText = "তারিখ: " + formatDate();

  let count = 1;

  items.filter(i => i.checked).forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="text-align: center;">${count++}</td>
      <td>${item.bn}</td>
      <td style="text-align: center;">${item.quantity} ${item.unit}</td>
      <td></td>
    `;
    previewTable.appendChild(row);
  });

  previewModal.classList.remove("hidden");
};
document.getElementById("cancelPreview").onclick = () => {
  previewModal.classList.add("hidden");
};

document.getElementById("confirmPdf").onclick = () => {
  previewModal.classList.add("hidden");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

/* ================= FONT ================= */
doc.setFont("NotoSansBengali", "bold");

/* ================= TITLE ================= */
doc.setFontSize(16);
doc.setTextColor(0);
doc.text("মাসিক বাজারের তালিকা", 105, 20, { align: "center" });

/* ================= DATE & META (TOP LEFT) ================= */
doc.setFontSize(10);
doc.setTextColor(80);
doc.text(`তারিখ: ${formatDate()}`, 14, 32);

doc.text(
  `তৈরি হয়েছে: ${new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  })}`,
  14,
  38
);

/* ================= SECTION TITLE ================= */
let startY = 48;
doc.setFontSize(12);
doc.setTextColor(0);
doc.text("পণ্যের তালিকা", 14, startY);

/* ================= TABLE BODY ================= */
const body = [];
let serial = 1;

items
  .filter(item => item.checked)
  .forEach(item => {
    body.push([
      serial++,
      item.bn,
      `${item.quantity} ${item.unit}`,
      ""
    ]);
  });

/* ================= TABLE ================= */
doc.autoTable({
  startY: startY + 5,

  head: [[ "ক্রম", "পণ্যের নাম", "পরিমাণ", "মূল্য (₹)" ]],
  body: body,

  theme: "grid",

  styles: {
    font: "NotoSansBengali",
    fontStyle: "bold",
    fontSize: 10,          // ⬇️ smaller font
    cellPadding: 3,        // ⬇️ MUCH smaller box height
    valign: "middle",
    lineColor: [190, 190, 190],
    lineWidth: 0.25
  },

  headStyles: {
    fillColor: [0, 100, 0],
    textColor: 255,
    fontSize: 10.5,        // ⬇️ smaller header text
    cellPadding: 3         // ⬇️ compact header
  },

  alternateRowStyles: {
    fillColor: [250, 250, 250]
  },

  columnStyles: {
    0: { cellWidth: 14, halign: "center" },  // ⬇️ narrower
    1: { cellWidth: 88, halign: "left" },    // ⬆️ name gets space
    2: { cellWidth: 36, halign: "center" },
    3: { cellWidth: 26, halign: "center" }
  }
});


/* ================= FOOTER ================= */
const pageHeight = doc.internal.pageSize.height;
doc.setFontSize(9);
doc.setTextColor(120);
doc.text(
  "This is a system generated report. No manual alterations.",
  105,
  pageHeight - 12,
  { align: "center" }
);


  /* ================= SAVE ================= */
  doc.save(`বাজার-তালিকা-${formatDate()}.pdf`);


/* ================= SAVE TO HISTORY ================= */
const historyEntry = {
  date: formatDate(),
  timestamp: Date.now(),
  items: items
    .filter(item => item.checked)
    .map(item => ({
      name: item.bn,
      quantity: item.quantity,
      unit: item.unit
    }))
};

saveHistory(historyEntry);

};
/* ================= HISTORY UI ================= */

document.getElementById("historyBtn").onclick = () => {
  comparisonMode = false;   // NORMAL MODE
  renderHistoryCards();
  showHistory();
};

let deleteTargetIndex = null;

const deleteModal = document.getElementById("deleteHistoryModal");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");
cancelDeleteBtn.onclick = () => {
  deleteTargetIndex = null;
  deleteModal.classList.add("hidden");
};

confirmDeleteBtn.onclick = () => {
  const history = getHistory();

  if (
    deleteTargetIndex === null ||
    deleteTargetIndex < 0 ||
    deleteTargetIndex >= history.length
  ) {
    deleteModal.classList.add("hidden");
    return;
  }

  history.splice(deleteTargetIndex, 1);
  localStorage.setItem("history", JSON.stringify(history));

  deleteTargetIndex = null;
  deleteModal.classList.add("hidden");

  renderHistoryCards();
};



function renderHistoryCards() {
  const history = getHistory();
  const container = document.getElementById("historyCards");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = "<p>কোনো ইতিহাস নেই</p>";
    return;
  }

  history.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "item";

    // NORMAL MODE
if (!comparisonMode) {
  card.style.cursor = "pointer";

card.innerHTML = `
  <div class="history-card-row">
    <div class="history-info">
      <strong>📅 ${entry.date}</strong>
      <p>${entry.items.length} টি জিনিস</p>
    </div>

    <button class="history-delete-btn" title="Delete">🗑️</button>
  </div>
`;

// FULL CARD CLICK (except delete)
card.onclick = () => {
  openHistoryDetail(index);
};

// DELETE BUTTON ONLY
card.querySelector(".history-delete-btn").onclick = (e) => {
  e.stopPropagation(); // 🔥 this saves everything
  deleteTargetIndex = index;
  deleteModal.classList.remove("hidden");
};

}


    // COMPARISON MODE
    else {
      card.innerHTML = `
        <label style="display:flex; align-items:center; gap:10px;">
          <input type="checkbox" class="compareCheckbox" data-index="${index}">
          <div>
            <strong>📅 ${entry.date}</strong>
            <p>${entry.items.length} টি জিনিস</p>
          </div>
        </label>
      `;
    }

    container.appendChild(card);
  });
}


function openHistoryDetail(index) {
  const entry = getHistory()[index];
  document.getElementById("historyDetailDate").innerText = "📅 " + entry.date;

  const ul = document.getElementById("historyDetailList");
  ul.innerHTML = "";

  entry.items.forEach(i => {
    ul.innerHTML += `<li>${i.name} – ${i.quantity} ${i.unit}</li>`;
  });

  showHistoryDetail();
}

/* ================= BACK BUTTONS ================= */

document.getElementById("backToHome").onclick = showHome;
document.getElementById("backToHistory").onclick = showHistory;
document.getElementById("manageMaster").onclick = () => {
  renderMasterList();
  showMaster();
};

document.getElementById("backFromMaster").onclick = backToHomeFromMaster;

function getAllHistoricalItems() {
  const history = getHistory();
  const map = {};

  history.forEach(entry => {
    entry.items.forEach(item => {
      const key = item.name.toLowerCase();
      if (!map[key]) {
        map[key] = {
          bn: item.name,
          en: item.name // we’ll improve later, safe for now
        };
      }
    });
  });

  return Object.values(map);
}
const bnInput = document.getElementById("bnName");
const suggestionBox = document.getElementById("itemSuggestions");

bnInput.oninput = () => {
  const text = bnInput.value.trim().toLowerCase();

  if (text.length === 0) {
    suggestionBox.classList.add("hidden");
    suggestionBox.innerHTML = "";
    return;
  }

  const allItems = getAllHistoricalItems();

  const matches = allItems.filter(item =>
    item.bn.toLowerCase().includes(text) ||
    item.en.toLowerCase().includes(text)
  );

  if (matches.length === 0) {
    suggestionBox.classList.add("hidden");
    suggestionBox.innerHTML = "";
    return;
  }

  suggestionBox.innerHTML = "";
  matches.forEach(item => {
    const div = document.createElement("div");
    div.innerText = `${item.bn}`;
    div.onclick = () => {
      bnInput.value = item.bn;
      suggestionBox.classList.add("hidden");
      suggestionBox.innerHTML = "";
    };
    suggestionBox.appendChild(div);
  });

  suggestionBox.classList.remove("hidden");
};
document.getElementById("closeModal").onclick = () => {
  modal.classList.add("hidden");
  suggestionBox.classList.add("hidden");
  suggestionBox.innerHTML = "";
};


document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-wrapper")) {
    suggestionBox.classList.add("hidden");
  }
});
document.getElementById("compareBtn").onclick = () => {

  // STEP 1: Enter comparison mode (show checkboxes)
  if (!comparisonMode) {
    comparisonMode = true;
    renderHistoryCards();
    return;
  }

  // STEP 2: Now perform comparison
  const checkedBoxes = document.querySelectorAll(".compareCheckbox:checked");

  if (checkedBoxes.length < 2 || checkedBoxes.length > 6) {
    alert("দয়া করে ২ থেকে ৬ মাস নির্বাচন করুন");
    return;
  }

  const selectedIndices = Array.from(checkedBoxes).map(cb =>
    Number(cb.dataset.index)
  );

  localStorage.setItem(
    "compareSelection",
    JSON.stringify(selectedIndices)
  );

  showComparison();
};

document.getElementById("backFromComparison").onclick = () => {
  comparisonMode = false;
  renderHistoryCards();
  showHistory();
};
/* ================= COMPARISON LOGIC ================= */

// Build map: item name -> quantity
function buildItemMap(items) {
  const map = {};
  items.forEach(item => {
    map[item.name] = item.quantity;
  });
  return map;
}

// Compare two months
function compareTwoMonths(prev, curr) {
  const increased = [];
  const decreased = [];
  const same = [];

  Object.keys(prev).forEach(name => {
    if (curr[name] !== undefined) {
      if (curr[name] > prev[name]) {
        increased.push(`${name}: ${prev[name]} → ${curr[name]}`);
      } else if (curr[name] < prev[name]) {
        decreased.push(`${name}: ${prev[name]} → ${curr[name]}`);
      } else {
        same.push(`${name}: ${curr[name]}`);
      }
    }
  });

  return { increased, decreased, same };
}

// MAIN comparison runner
function runComparison() {
  const selected = JSON.parse(localStorage.getItem("compareSelection"));
  const history = getHistory();

  const selectedMonths = selected
    .map(i => history[i])
    .sort((a, b) => a.timestamp - b.timestamp);

  const output = document.getElementById("comparisonContent");
  output.innerHTML = "";

  // Month-by-month comparison
  for (let i = 1; i < selectedMonths.length; i++) {
    const prev = buildItemMap(selectedMonths[i - 1].items);
    const curr = buildItemMap(selectedMonths[i].items);

    const result = compareTwoMonths(prev, curr);

    output.innerHTML += `
      <h3>▶ ${selectedMonths[i - 1].date} → ${selectedMonths[i].date}</h3>

      <p>⬆️ বেড়েছে</p>
      <ul>${result.increased.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>

      <p>⬇️ কমেছে</p>
      <ul>${result.decreased.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>

      <p>➖ অপরিবর্তিত</p>
      <ul>${result.same.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>
    `;
  }

  if (selectedMonths.length > 2) {
  const first = buildItemMap(selectedMonths[0].items);
  const last = buildItemMap(selectedMonths[selectedMonths.length - 1].items);
  const overall = compareTwoMonths(first, last);

  output.innerHTML += `
    <hr>
    <h3>🔹 মোট পরিবর্তন (${selectedMonths[0].date} → ${selectedMonths[selectedMonths.length - 1].date})</h3>

    <p>⬆️ মোট বেড়েছে</p>
    <ul>${overall.increased.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>

    <p>⬇️ মোট কমেছে</p>
    <ul>${overall.decreased.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>

    <p>➖ মোট অপরিবর্তিত</p>
    <ul>${overall.same.map(i => `<li>${i}</li>`).join("") || "<li>কিছু নেই</li>"}</ul>
  `;
}

}

/* ================= MASTER LIST (FINAL WORKING) ================= */

function getMasterList() {
  return JSON.parse(localStorage.getItem("masterList")) || [];
}

function saveMasterList(list) {
  localStorage.setItem("masterList", JSON.stringify(list));
}

function renderMasterList() {
  const container = document.getElementById("masterItems");
  container.innerHTML = "";

  const list = getMasterList();

  if (list.length === 0) {
    container.innerHTML = "<p>মাস্টার তালিকা খালি</p>";
    return;
  }

  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
  <span>${item.bn}</span>
  <button class="master-delete-btn">🗑️</button>
`;


    div.querySelector("button").onclick = () => {
      list.splice(index, 1);
      saveMasterList(list);
      renderMasterList();
    };

    container.appendChild(div);
  });
}

document.getElementById("addToMaster").onclick = () => {
  const input = document.getElementById("masterInput");
  const name = input.value.trim();
  if (!name) return;

  const list = getMasterList();
  list.push({ bn: name, en: name });

  saveMasterList(list);
  input.value = "";
  renderMasterList();
};
/* ================= VOICE INPUT ================= */

const voiceBtn = document.getElementById("voiceBtn");

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.lang = "bn-IN"; // Bengali
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.onclick = () => {
    try {
      recognition.start();
    } catch (e) {
      console.log("Mic already started");
    }
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();

    if (text.length < 1) {
      alert("কিছু শোনা যায়নি, আবার বলুন");
      return;
    }

    items.push({
      id: Date.now(),
      bn: text,
      en: text,
      checked: true,
      quantity: 1,
      unit: "unit"
    });

    save();
    render();
  };

  recognition.onerror = (event) => {
    alert("🎤 মাইক্রোফোন কাজ করছে না, অনুমতি চেক করুন");
    console.error(event.error);
  };

} else {
  voiceBtn.onclick = () => {
    alert("এই ফোনে ভয়েস ইনপুট সাপোর্ট নেই");
  };
}

}); // End of DOMContentLoaded
