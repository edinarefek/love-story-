// Логика сайта: счётчик, карточки, фоновый декор, музыка, просмотр фото

document.addEventListener("DOMContentLoaded", () => {
  initTimer();
  initEventsManager();
  initDecor();
  initRevealOnScroll();
  initNavScroll();
  initMusic();
  initModal();
  initWishesBoard();
  initWishlist();
});

/* ================= 1. СЧЁТЧИК ================= */
function initTimer() {
  const els = {
    d: document.getElementById("days"),
    h: document.getElementById("hours"),
    m: document.getElementById("minutes"),
    s: document.getElementById("seconds")
  };
  const start = typeof RELATIONSHIP_START_DATE !== "undefined"
    ? RELATIONSHIP_START_DATE
    : new Date("2023-07-23T00:00:00");

  function tick() {
    const diff = Math.max(0, Date.now() - start.getTime());
    const total = Math.floor(diff / 1000);
    els.d.textContent = Math.floor(total / 86400).toLocaleString("ru-RU");
    els.h.textContent = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
    els.m.textContent = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    els.s.textContent = String(total % 60).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ================= 2. МЕНЕДЖЕР СОБЫТИЙ (РЕНДЕР, ДОБАВЛЕНИЕ, РЕДАКТИРОВАНИЕ) ================= */
let currentEvents = [];

function initEventsManager() {
  const stored = localStorage.getItem("grishanya_events");
  if (stored) {
    try {
      currentEvents = JSON.parse(stored);
    } catch (e) {
      currentEvents = typeof EVENTS_DATA !== "undefined" ? [...EVENTS_DATA] : [];
    }
  } else {
    currentEvents = typeof EVENTS_DATA !== "undefined" ? [...EVENTS_DATA] : [];
  }

  renderMoments();
  setupEditModal();
}

function saveEvents() {
  localStorage.setItem("grishanya_events", JSON.stringify(currentEvents));
  renderMoments();
  // Переинициализируем наблюдатель анимаций
  initRevealOnScroll();
}

function renderMoments() {
  const grid = document.getElementById("events-list");
  if (!grid) return;

  const rotations = [-1.5, 1.8, -1.2, 1.5, -1, 1.2];

  grid.innerHTML = currentEvents.map((ev, i) => {
    const big = i < 2;
    const label = ev.label ? `<div class="card-label">${ev.label}</div>` : "";
    const bow = ev.tag === "Помолвка" ? `<svg class="card-bow" viewBox="0 0 40 28"><use href="#bow"/></svg>` : "";
    const titleTop = big ? "" : `<h3 class="card-title-top">${ev.title}</h3>`;
    const dateBadge = ev.displayDate ? `<span class="card-date">${ev.displayDate}</span>` : "";

    const caption = big
      ? `<div class="hand">${ev.title}</div>${dateBadge}<p class="card-desc">${ev.description}</p>`
      : `${dateBadge}<p class="card-desc">${ev.description}</p>`;

    let extraPhotoHtml = "";
    if (ev.extraImage) {
      extraPhotoHtml = `
        <div class="photo-extra-thumb" title="Посмотреть фото" data-src="${ev.extraImage}">
          <img src="${ev.extraImage}" alt="Фото">
          <span class="thumb-badge">Концерт</span>
        </div>
      `;
    }

    return `
      <article class="card ${big ? "card-big" : "card-small"}" style="--rot:${rotations[i % rotations.length]}deg"
               data-id="${ev.id}" data-title="${ev.title}" data-desc="${ev.displayDate ? ev.displayDate + ' — ' : ''}${ev.description}">
        <button class="card-edit-btn" data-id="${ev.id}" title="Редактировать событие">✎</button>
        ${label}${bow}${titleTop}
        <div class="photo">
          <img src="${ev.image}" alt="${ev.title}" onerror="showKittyPlaceholder(this, ${i})">
          ${extraPhotoHtml}
        </div>
        <div class="card-caption">${caption}</div>
      </article>`;
  }).join("");
}

function setupEditModal() {
  const modal = document.getElementById("event-edit-modal");
  const form = document.getElementById("event-edit-form");
  const addBtn = document.getElementById("add-event-btn");
  const closeBtn = document.getElementById("close-edit-modal-btn");
  const deleteBtn = document.getElementById("delete-event-btn");
  const modalHeading = document.getElementById("edit-modal-title");

  const idInput = document.getElementById("edit-event-id");
  const titleInput = document.getElementById("edit-title");
  const dateInput = document.getElementById("edit-date");
  const labelInput = document.getElementById("edit-label");
  const descInput = document.getElementById("edit-desc");
  const fileInput = document.getElementById("edit-image-file");
  const urlInput = document.getElementById("edit-image-url");

  if (!modal || !form) return;

  function openModal(ev = null) {
    if (ev) {
      modalHeading.textContent = "Редактировать событие";
      idInput.value = ev.id;
      titleInput.value = ev.title || "";
      dateInput.value = ev.displayDate || "";
      labelInput.value = ev.label || "";
      descInput.value = ev.description || "";
      urlInput.value = ev.image || "";
      deleteBtn.style.display = "block";
    } else {
      modalHeading.textContent = "Добавить новое событие";
      idInput.value = "";
      form.reset();
      urlInput.value = "";
      deleteBtn.style.display = "none";
    }
    fileInput.value = "";
    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  if (addBtn) addBtn.addEventListener("click", () => openModal(null));
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

  // Клик по кнопке ✎ на карточке
  document.getElementById("events-list").addEventListener("click", (e) => {
    const editBtn = e.target.closest(".card-edit-btn");
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.dataset.id;
      const found = currentEvents.find(item => String(item.id) === String(id));
      if (found) openModal(found);
    }
  });

  // Удаление события
  deleteBtn.addEventListener("click", () => {
    const id = idInput.value;
    if (confirm("Вы уверены, что хотите удалить это событие?")) {
      currentEvents = currentEvents.filter(item => String(item.id) !== String(id));
      saveEvents();
      closeModal();
    }
  });

  // Сохранение (новое или отредактированное)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = idInput.value;

    function applySave(imageSrc) {
      if (id) {
        // Редактирование
        const item = currentEvents.find(ev => String(ev.id) === String(id));
        if (item) {
          item.title = titleInput.value.trim();
          item.displayDate = dateInput.value.trim();
          item.label = labelInput.value.trim();
          item.description = descInput.value.trim();
          if (imageSrc) item.image = imageSrc;
        }
      } else {
        // Новое событие
        currentEvents.push({
          id: Date.now(),
          title: titleInput.value.trim(),
          displayDate: dateInput.value.trim(),
          label: labelInput.value.trim(),
          description: descInput.value.trim(),
          image: imageSrc || "assets/images/event-walk.jpg",
          tag: "Воспоминание"
        });
      }

      saveEvents();
      closeModal();
    }

    // Если прикреплен локальный файл с устройства
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        applySave(evt.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      applySave(urlInput.value.trim());
    }
  });
}

// Если фото ещё нет — показываем Hello Kitty
window.showKittyPlaceholder = function (img, i) {
  const colors = ["#f48fb1", "#8ab4f8", "#f48fb1", "#c3a6f5", "#ffffff"];
  const box = img.parentElement;
  box.classList.add("empty");
  box.innerHTML = `
    <svg viewBox="0 0 120 170"><use href="#kitty-full" color="${colors[i % colors.length]}"/></svg>
    <span>Здесь будет наше фото</span>`;
};

/* ================= 3. ФОНОВЫЙ ДЕКОР ================= */
function initDecor() {
  const layer = document.getElementById("decor-layer");
  if (!layer) return;

  const shapes = [
    { id: "kitty-outline", vb: "0 0 120 100", w: 46, h: 38 },
    { id: "bow-outline", vb: "0 0 40 28", w: 30, h: 21 },
    { id: "star-outline", vb: "0 0 24 24", w: 18, h: 18 },
    { id: "star-solid", vb: "0 0 24 24", w: 10, h: 10 },
    { id: "heart", vb: "0 0 24 24", w: 12, h: 12 },
    { id: "apple-outline", vb: "0 0 24 24", w: 20, h: 20 }
  ];
  const colors = ["#ff9fb2", "#b9a7ff", "#8fb8ff", "#ffd36b"];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < 35; i++) {
    const s = shapes[i % shapes.length];
    const scale = 0.8 + Math.random() * 0.6;
    const el = document.createElement("div");
    el.className = "decor";
    el.style.width = s.w * scale + "px";
    el.style.height = s.h * scale + "px";
    el.style.left = Math.random() * 94 + "%";
    el.style.top = Math.random() * 97 + "%";
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = 3 + Math.random() * 4 + "s";
    el.style.animationDelay = Math.random() * 4 + "s";
    el.innerHTML = `<svg viewBox="${s.vb}"><use href="#${s.id}"/></svg>`;
    frag.appendChild(el);
  }

  for (let i = 0; i < 60; i++) {
    const dot = document.createElement("div");
    dot.className = "decor-dot";
    const size = 1.5 + Math.random() * 2.5;
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = Math.random() * 99 + "%";
    dot.style.top = Math.random() * 99 + "%";
    dot.style.animationDuration = 2 + Math.random() * 3 + "s";
    dot.style.animationDelay = Math.random() * 4 + "s";
    frag.appendChild(dot);
  }

  layer.appendChild(frag);
}

/* ================= 4. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ (PREMIUM REVEAL) ================= */
function initRevealOnScroll() {
  // Анимация карточек воспоминаний с каскадным эффектом (stagger)
  const cards = document.querySelectorAll(".card");
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const card = e.target;
        const index = Array.from(cards).indexOf(card);
        // Небольшая задержка для соседних карточек
        setTimeout(() => {
          card.classList.add("visible");
        }, (index % 3) * 120);
        cardObserver.unobserve(card);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  cards.forEach((c) => cardObserver.observe(c));

  // Анимация остальных блоков (счётчик, вишлист, послание, записки)
  const revealElements = document.querySelectorAll(".scroll-reveal");
  const blockObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
        blockObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

  revealElements.forEach((el) => blockObserver.observe(el));
}

/* ================= 5. НАВИГАЦИЯ ================= */
function initNavScroll() {
  const nav = document.querySelector(".nav-bar");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 80);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ================= 6. МУЗЫКА И ЕЁ РЕДАКТИРОВАНИЕ ================= */
function initMusic() {
  const btn = document.getElementById("music-toggle");
  const gearBtn = document.getElementById("music-edit-btn");
  const audio = document.getElementById("bg-audio");
  const modal = document.getElementById("music-modal");
  const closeBtn = document.getElementById("close-music-modal-btn");
  const form = document.getElementById("music-form");
  const fileInput = document.getElementById("music-file-input");
  const urlInput = document.getElementById("music-url-input");
  const trackNameDisplay = document.getElementById("current-track-name");
  const volUpBtn = document.getElementById("vol-up-btn");
  const volDownBtn = document.getElementById("vol-down-btn");

  if (!btn || !audio) return;

  // Инициализация громкости (по умолчанию 0.7)
  let currentVol = parseFloat(localStorage.getItem("grishanya_music_vol") || "0.7");
  audio.volume = currentVol;

  if (volUpBtn) {
    volUpBtn.addEventListener("click", () => {
      currentVol = Math.min(1.0, currentVol + 0.15);
      audio.volume = currentVol;
      localStorage.setItem("grishanya_music_vol", currentVol.toFixed(2));
      volUpBtn.style.transform = "scale(1.2)";
      setTimeout(() => volUpBtn.style.transform = "", 150);
    });
  }

  if (volDownBtn) {
    volDownBtn.addEventListener("click", () => {
      currentVol = Math.max(0.0, currentVol - 0.15);
      audio.volume = currentVol;
      localStorage.setItem("grishanya_music_vol", currentVol.toFixed(2));
      volDownBtn.style.transform = "scale(1.2)";
      setTimeout(() => volDownBtn.style.transform = "", 150);
    });
  }

  // Загружаем сохранённый трек из localStorage
  const savedMusic = localStorage.getItem("grishanya_music");
  const savedTrackTitle = localStorage.getItem("grishanya_music_title");

  if (savedMusic) {
    audio.src = savedMusic;
    if (trackNameDisplay && savedTrackTitle) {
      trackNameDisplay.textContent = `Текущий трек: ${savedTrackTitle}`;
    }
  }

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play()
        .then(() => btn.classList.add("playing"))
        .catch(() => {
          alert("Музыкальный трек пока не выбран или заблокирован браузером. Нажмите на значок ⚙️ рядом с кнопкой музыки, чтобы загрузить вашу песню!");
        });
    } else {
      audio.pause();
      btn.classList.remove("playing");
    }
  });

  if (gearBtn && modal) {
    gearBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });

    const closeModal = () => modal.classList.remove("active");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Audio = evt.target.result;
          audio.src = base64Audio;
          localStorage.setItem("grishanya_music", base64Audio);
          localStorage.setItem("grishanya_music_title", file.name);
          if (trackNameDisplay) trackNameDisplay.textContent = `Текущий трек: ${file.name}`;
          closeModal();
          // Пробуем сразу включить
          audio.play().then(() => btn.classList.add("playing")).catch(() => {});
        };
        reader.readAsDataURL(file);
      } else if (urlInput.value.trim()) {
        const url = urlInput.value.trim();
        audio.src = url;
        localStorage.setItem("grishanya_music", url);
        localStorage.setItem("grishanya_music_title", url);
        if (trackNameDisplay) trackNameDisplay.textContent = `Текущий трек: ${url}`;
        closeModal();
        audio.play().then(() => btn.classList.add("playing")).catch(() => {});
      }
    });
  }
}

/* ================= 7. ПРОСМОТР ФОТО ================= */
function initModal() {
  const modal = document.getElementById("image-modal");
  const img = document.getElementById("modal-img");
  const title = document.getElementById("modal-title");
  const caption = document.getElementById("modal-caption");
  if (!modal) return;

  document.addEventListener("click", (e) => {
    // Если кликнули по мини-превью футболки с концерта
    const thumb = e.target.closest(".photo-extra-thumb");
    if (thumb) {
      e.stopPropagation();
      img.src = thumb.dataset.src;
      title.textContent = "Футболка на концерте";
      caption.textContent = "Та самая футболка, которую ты выбрала для меня";
      modal.classList.add("active");
      return;
    }

    const card = e.target.closest(".card");
    if (!card) return;
    const photo = card.querySelector(".photo > img");
    if (!photo) return;
    img.src = photo.src;
    title.textContent = card.dataset.title || "";
    caption.textContent = card.dataset.desc || "";
    modal.classList.add("active");
  });

  const close = () => modal.classList.remove("active");
  modal.querySelector(".modal-close").addEventListener("click", close);
  modal.querySelector(".modal-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/* ================= 8. ДОСКА ПОЖЕЛАНИЙ (WISHES BOARD) ================= */
function initWishesBoard() {
  const form = document.getElementById("wish-form");
  const list = document.getElementById("wishes-list");
  const textarea = document.getElementById("wish-text");
  if (!form || !list) return;

  // Загрузка сохранённых сообщений из памяти браузера
  const defaultWishes = [
    {
      id: 1,
      author: "Гриня",
      text: "Спасибо тебе за то, что ты всегда рядом и делаешь каждый мой день счастливее!",
      date: "04.11.2026"
    },
    {
      id: 2,
      author: "Нюта",
      text: "Очень люблю наши спонтанные поездки и то, как мы понимаем друг друга без слов.",
      date: "04.11.2026"
    }
  ];

  let wishes = JSON.parse(localStorage.getItem("grishanya_wishes") || "null") || defaultWishes;

  function renderWishes() {
    list.innerHTML = wishes.map((w, index) => `
      <div class="wish-note-item">
        <div class="wish-note-header">
          <span class="wish-note-author">${w.author}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="wish-note-date">${w.date}</span>
            <button class="delete-wish-btn" data-index="${index}" title="Удалить">&times;</button>
          </div>
        </div>
        <p class="wish-note-body">${escapeHtml(w.text)}</p>
      </div>
    `).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;

    const authorInput = form.querySelector('input[name="wish-author"]:checked');
    const author = authorInput ? authorInput.value : "Гриня";

    const now = new Date();
    const dateStr = String(now.getDate()).padStart(2, "0") + "." + 
                    String(now.getMonth() + 1).padStart(2, "0") + "." + 
                    now.getFullYear();

    wishes.unshift({
      id: Date.now(),
      author,
      text,
      date: dateStr
    });

    localStorage.setItem("grishanya_wishes", JSON.stringify(wishes));
    renderWishes();
    textarea.value = "";
  });

  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-wish-btn")) {
      const idx = parseInt(e.target.dataset.index, 10);
      wishes.splice(idx, 1);
      localStorage.setItem("grishanya_wishes", JSON.stringify(wishes));
      renderWishes();
    }
  });

  renderWishes();
}

/* ================= 9. СОВМЕСТНЫЙ ВИШЛИСТ (WISHLIST) ================= */
function initWishlist() {
  const form = document.getElementById("wishlist-form");
  const input = document.getElementById("wishlist-input");
  const list = document.getElementById("wishlist-items");
  if (!form || !list) return;

  const defaultWishlist = [
    { id: 1, text: "Встретить рассвет на высоте в горах", completed: true },
    { id: 2, text: "Поехать вместе на море и гулять по ночному пляжу", completed: true },
    { id: 3, text: "Сыграть самую красивую свадьбу 24 июля 2026", completed: false },
    { id: 4, text: "Устроить уютный вечер с просмотром всех любимых фильмов", completed: false }
  ];

  let items = JSON.parse(localStorage.getItem("grishanya_wishlist") || "null") || defaultWishlist;

  function renderWishlist() {
    list.innerHTML = items.map((item, index) => `
      <li class="wishlist-item ${item.completed ? 'completed' : ''}" data-index="${index}">
        <div class="wishlist-item-left">
          <span class="custom-checkbox"></span>
          <span class="wishlist-text">${escapeHtml(item.text)}</span>
        </div>
        <button class="delete-wishlist-btn" data-index="${index}" title="Удалить">&times;</button>
      </li>
    `).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    items.push({
      id: Date.now(),
      text,
      completed: false
    });

    localStorage.setItem("grishanya_wishlist", JSON.stringify(items));
    renderWishlist();
    input.value = "";
  });

  list.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".delete-wishlist-btn");
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.index, 10);
      items.splice(idx, 1);
      localStorage.setItem("grishanya_wishlist", JSON.stringify(items));
      renderWishlist();
      return;
    }

    const itemLeft = e.target.closest(".wishlist-item-left");
    if (itemLeft) {
      const itemEl = itemLeft.closest(".wishlist-item");
      const idx = parseInt(itemEl.dataset.index, 10);
      items[idx].completed = !items[idx].completed;
      localStorage.setItem("grishanya_wishlist", JSON.stringify(items));
      renderWishlist();
    }
  });

  renderWishlist();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
