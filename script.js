
const LS_KEY = "todo-demo-v1";
const $ = (sel, root = document) => root.querySelector(sel);

const listEl = $("#list");
const emptyEl = $("#empty");
const searchEl = $("#search");
const newTitleEl = $("#newTitle");
const newDateEl = $("#newDate");
const addBtn = $("#addBtn");

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || seed(); }
  catch { return seed(); }
};
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));

function seed() {
  const today = "2000-01-01";
  const later = "2000-01-05";
  return [
    { id: crypto.randomUUID(), title: "Obieranie ziemniaków",   done: false, date: today },
    { id: crypto.randomUUID(), title: "Wycieranie kurzów",     done: false, date: today },
    { id: crypto.randomUUID(), title: "Pilates", done: false, date: today },
  ];
}

let state = load();
let filter = "";

function render() {
  listEl.innerHTML = "";
  const tpl = $("#task-template");
  const items = state.filter(t => t.title.toLowerCase().includes(filter));
  emptyEl.hidden = items.length !== 0;

  for (const item of items) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id;
    if (item.done) node.classList.add("done");

    const check = $(".check", node);
    check.checked = item.done;
    check.addEventListener("change", () => {
      item.done = check.checked;
      node.classList.toggle("done", item.done);
      save();
    });

    const title = $(".title", node);
    title.textContent = item.title;
    title.addEventListener("click", () => enableTitleEdit(title));
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); title.blur(); }
      else if (e.key === "Escape") { title.textContent = item.title; title.blur(); }
    });
    title.addEventListener("blur", () => {
      const next = title.textContent.trim();
      if (next && next !== item.title) {
        item.title = next.slice(0, 255); 
        save();
        render();
      } else {
        title.textContent = item.title;
      }
    });

    const dateWrap = $(".date", node);
    dateWrap.textContent = item.date;
    dateWrap.title = "Kliknij, aby edytować";
    dateWrap.addEventListener("click", () => enableDateEdit(dateWrap, item));

    const trash = $(".trash", node);
    trash.addEventListener("click", () => {
      const idx = state.findIndex(t => t.id === item.id);
      if (idx !== -1) {
        state.splice(idx, 1);
        save();
        render();
      }
    });

    listEl.appendChild(node);
  }
}

function enableTitleEdit(el) {
  el.setAttribute("contenteditable", "true");
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
}

function enableDateEdit(wrapper, item) {
  if (wrapper.querySelector("input[type=date]")) return;

  const input = document.createElement("input");
  input.type = "date";
  input.value = item.date || "";
  wrapper.innerHTML = "";
  wrapper.appendChild(input);
  input.focus();

  const commit = () => {
    const val = input.value || item.date || "";
    item.date = val;
    save();
    wrapper.textContent = val || "—";
  };
  const cancel = () => { wrapper.textContent = item.date || "—"; };

  input.addEventListener("change", commit);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { commit(); input.blur(); }
    if (e.key === "Escape") { cancel(); input.blur(); }
  });
  input.addEventListener("blur", commit);
}

// ===== Validation helpers =====
const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10); 
};

function validateNewTask(title, dateStr) {
  newTitleEl.setCustomValidity("");
  newDateEl.setCustomValidity("");

  if (title.length < 3) {
    newTitleEl.setCustomValidity("Wpisz co najmniej 3 znaki.");
    newTitleEl.reportValidity();
    return false;
  }
  if (title.length > 255) {
    newTitleEl.setCustomValidity("Maksymalnie 255 znaków.");
    newTitleEl.reportValidity();
    return false;
  }

  if (dateStr) {
    const today = todayStr();
    if (dateStr <= today) {
      newDateEl.setCustomValidity("Data musi być pusta lub w przyszłości.");
      newDateEl.reportValidity();
      return false;
    }
  }
  return true;
}

function addTask() {
  const title = newTitleEl.value.trim();
  const date = newDateEl.value || "";

  if (!validateNewTask(title, date)) return;

  state.unshift({ id: crypto.randomUUID(), title, done: false, date });
  save();

  newTitleEl.value = "";
  render();
  newTitleEl.focus();
}

addBtn.addEventListener("click", addTask);
newTitleEl.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
[newTitleEl, newDateEl].forEach(el => el.addEventListener("input", () => el.setCustomValidity("")));

searchEl.addEventListener("input", () => {
  filter = searchEl.value.trim().toLowerCase();
  render();
});

render();
