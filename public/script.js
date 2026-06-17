const state = {
    bookId: 1,
    chapterId: 1,
    translationId: "ESV",
    chapters: [],
    theme: "Light",
    fontSizes: ["1.0rem", "1.5rem", "2.0rem"],
    fontSize: 1
};

const bookSelect = document.getElementById("bookSelect");
const chapterSelect = document.getElementById("chapterSelect");
const translationSelect = document.getElementById("translationSelect");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const headerBtn = document.getElementById("headerBtn");
const chapterHeader = document.getElementById("chapterHeader");
const selectorsHeader = document.getElementById("selectorsHeader");
const overlayMenu = document.getElementById("overlayMenu");
const themeBtn = document.getElementById("themeBtn");
const fontSlider = document.getElementById("fontSizing");
const menuClose = document.getElementById("menuClose");

// cache
const chapterCache = {};
const key =
    `${state.translation}-${state.bookId}-${state.chapterId}`;

async function preloadChapters() {
    const res = await fetch("/chapters");
    state.chapters = await res.json();
}

async function loadBooks() {
    const res = await fetch("/books");
    const books = await res.json();

    bookSelect.innerHTML = "";

    books.forEach(book => {
        const option = document.createElement("option");
        option.value = book.book_id;
        option.textContent = book.book;
        bookSelect.appendChild(option);
    });
}

async function loadTranslations(){
    const res = await fetch("/translations")
    const translations = await res.json();
        console.log(translations);


    translationSelect.innerHTML = "";

    translations.forEach(t => {
        const option = document.createElement("option");

        option.value = t.translation;
        option.textContent = t.translation;

        translationSelect.appendChild(option);
    })
}

function renderChapterOptions(bookId) {
    chapterSelect.innerHTML = "";

    const chapters = state.chapters.filter(
        ch => ch.book_id == bookId
    );

    chapters.forEach(ch => {
        const option = document.createElement("option");
        option.value = ch.chapter;
        option.textContent = ch.chapter;
        chapterSelect.appendChild(option);
    });
}

async function renderVerses() {
    const res = await fetch(
        `/book/${state.bookId}/chapter/
        ${state.chapterId}/${state.translationId}`
    );

    const data = await res.json();

    if (!data.length) return;

    document.getElementById("headerBtn").textContent =
        `${data[0].book} ${data[0].chapter}`;

    document.getElementById("verses").innerHTML =
        data
            .map(v => `${v.verse}. ${v.text}`)
            .join("<br>");
}

function saveState(){
    localStorage.setItem("bibleState", JSON.stringify({
        bookId: state.bookId,
        chapterId: state.chapterId,
        translation: state.translationId,
        theme: state.theme,
        fontSize: state.fontSize
    }));
}

function loadState(){
    const saved = localStorage.getItem("bibleState");

    if (!saved) return;

    const data = JSON.parse(saved);

    state.bookId = data.bookId ?? 1;
    state.chapterId = data.chapterId ?? 1;
    state.translationId = data.translation ?? "ESV";
    state.theme = data.theme ?? "Light";
    state.fontSize = data.fontSize ?? 1;

    if (state.theme === "Dark") {
        document.body.classList.add("dark-mode");
        themeBtn.textContent = "Light mode";
    } else {
        document.body.classList.remove("dark-mode");  
        themeBtn.textContent = "Dark mode";
    }
}

function applyFontSize() {
    const size = state.fontSizes[state.fontSize];

    document.documentElement.style.setProperty(
        "--reading-font-size",
        size
    );

    fontSlider.value = state.fontSize;
}

bookSelect.addEventListener("change", async (e) => {
    state.bookId = Number(e.target.value);
    state.chapterId = 1;
    saveState();

    renderChapterOptions(state.bookId);
    chapterSelect.value = 1;

    await renderVerses();
});

chapterSelect.addEventListener("change", async (e) => {
    state.chapterId = Number(e.target.value);
    saveState();

    await renderVerses();
});

translationSelect.addEventListener("change", async (e) => {
    state.translationId = e.target.value;
    saveState();

    await renderVerses();
});

nextBtn.addEventListener("click", async () => {
    state.chapterId++;
    chapterSelect.value = state.chapterId;
    saveState();

    await renderVerses();
});

backBtn.addEventListener("click", async () => {
    state.chapterId--;
    chapterSelect.value = state.chapterId;
    saveState();

    await renderVerses();
});

headerBtn.addEventListener("click", () => {
    overlayMenu.classList.toggle("hidden");
    document.querySelector(".overlay").classList.add("show");
});

menuClose.addEventListener("click", () => {
    overlayMenu.classList.add("hidden")
})

themeBtn.addEventListener("click", () => {
    if (state.theme === "Light") {
        state.theme = "Dark"
        document.body.classList.add("dark-mode");
        themeBtn.textContent="Light mode"
        saveState();
    } else {
        state.theme = "Light"
        document.body.classList.remove("dark-mode");
        themeBtn.textContent="Dark mode"
        saveState();
    }
    console.log(state.theme);
});

fontSlider.addEventListener("input", () => {
    state.fontSize = Number(fontSlider.value);

    applyFontSize();
    saveState();
});

async function init() {
    loadState();
    applyFontSize();

    await Promise.all([
        loadBooks(),
        preloadChapters(),
        loadTranslations()
    ]);

    bookSelect.value = state.bookId;
    translationSelect.value = state.translationId;

    renderChapterOptions(state.bookId);
    chapterSelect.value = state.chapterId;

    await renderVerses();
}

init();