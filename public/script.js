const params = new URLSearchParams(window.location.search);
const sessionIdFromUrl = params.get("session");

const socket = io();

socket.on("connect", () => {

    if (sessionIdFromUrl) {

        state.sessionId = sessionIdFromUrl;

        socket.emit("join-session", sessionIdFromUrl);

        console.log("Joined session from URL:", sessionIdFromUrl);
    }
});

const state = {
    bookId: 1,
    chapterId: 1,
    translationId: "ESV",
    verseId: 1,
    chapters: [],
    verses: [],
    theme: "Light",
    fontSizes: ["1.0rem", "1.5rem", "2.0rem"],
    fontSize: 1,
};

let selectedVerse = null;
let inviteLink = null;
let isRemoteScroll = false;
let isRemoteUpdate = false;


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
const verseSelect = document.getElementById("verseSelect")
const sessionBtn = document.getElementById("sessionBtn");
const overlayLink = document.getElementById("overlayLink");
const copyBtn = document.getElementById("copyBtn");
const linkHeader = document.getElementById("linkHeader");


// cache
const chapterCache = {};
const key =
    `${state.translation}-${state.bookId}-${state.chapterId}`;

async function preloadChapters() {
    const res = await fetch("/chapters");
    state.chapters = await res.json();
}

async function preloadVerses(){
    const res = await fetch("/verses");
    state.verses = await res.json();
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

async function loadChapter() {
    renderVerseOptions(
        state.bookId,
        state.chapterId
    );

    await renderVerses();
    saveState();
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

function renderVerseOptions(bookId, chapterId) {
    verseSelect.innerHTML = "";

    const verses = state.verses.filter(
        v => v.book_id == bookId &&
         v.chapter == chapterId
    );

    verses.forEach(v => {
        const option = document.createElement("option");
        option.value = v.verse;
        option.textContent = v.verse;
        verseSelect.appendChild(option);
    })

}

async function renderVerses(jumpVerse = null) {
    const res = await fetch(
        `/book/${state.bookId}/chapter/${state.chapterId}/${state.translationId}`
    );

    const data = await res.json();

    if (!data.length) return;

    headerBtn.textContent =
        `${data[0].book} ${data[0].chapter}`;

    verses.innerHTML =
        data.map(v => `
            <p class="verse" id="verse-${v.verse}">
                <sup>${v.verse}</sup> ${v.text}
            </p>
        `).join("");

    if (jumpVerse) {
        jumpToVerse(jumpVerse);
    }
}

function jumpToVerse(verseNumber) {
    isRemoteScroll - true;

    const verse = document.getElementById(`verse-${verseNumber}`);
    if (!verse) return;

    verse.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {
        isRemoteScroll = false;
    }, 300);
}

function selectVerse(verseNumber, fromRemote = false) {

    if (!fromRemote && selectedVerse === verseNumber) {
        clearSelection();
        selectedVerse = null;
        state.verseId = null;
        syncNavigation();
        return;
    }

    clearSelection();

    selectedVerse = verseNumber;
    state.verseId = verseNumber;

    const verse = document.getElementById(`verse-${verseNumber}`);
    if (!verse) return;

    verse.classList.add("selected");

    document.querySelectorAll(".verse")
        .forEach(el => {
            if (el !== verse) {
                el.classList.add("dim");
            }
        });
    
    // if (scroll) {
    //     jumpToVerse(verseNumber);
    // }

    jumpToVerse(verseNumber);

    if (state.isHost) {
        syncNavigation();
    }

    if (!fromRemote) {
        syncNavigation();
    }

    console.log("Selecting verse:", verseNumber, document.getElementById(`verse-${verseNumber}`));
}

function clearSelection(){
    selectedVerse = null;
    document.querySelectorAll(".verse.selected")
        .forEach(el => el.classList.remove("selected"));
    document.querySelectorAll(".verse.dim")
        .forEach(el => el.classList.remove("dim"));
    console.log("CLEARING SELECTION");
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

function handleVerseClick(e) {
    const verse = e.target.closest(".verse");
    if (!verse) return;

    const verseNumber =
        Number(verse.id.replace("verse-", ""));

    state.verseId = verseNumber;

    selectVerse(verseNumber);
    jumpToVerse(verseNumber);
    syncNavigation();
}

function syncNavigation() {
    if (!state.sessionId || !state.isHost) return;
    if (!state.verseId) return; // 🔥 CRITICAL FIX
    if (!state.isHost) return;

    socket.emit("navigate", {
        sessionId: state.sessionId,
        bookId: state.bookId,
        chapterId: state.chapterId,
        verseId: state.verseId ?? null,
        translationId: state.translationId,

        source: socket.id   // 🔥 ADD THIS
    });

    console.log("isHost:", state.isHost);
}



bookSelect.addEventListener("change", async (e) => {
    state.bookId = Number(e.target.value);
    state.chapterId = 1;
    saveState();

    renderChapterOptions(state.bookId);
    renderVerseOptions(state.bookId, state.chapterId);

    chapterSelect.value = 1;

    await renderVerses();
    syncNavigation();
});

chapterSelect.addEventListener("change", async (e) => {
    state.chapterId = Number(e.target.value);
    state.verseId = null;

    await loadChapter();

    clearSelection();
    syncNavigation();
});

translationSelect.addEventListener("change", async (e) => {
    state.translationId = e.target.value;
    saveState();

    await renderVerses();
    syncNavigation();
});

nextBtn.addEventListener("click", async () => {
    state.chapterId++;
    state.verseId = 1;

    await loadChapter();
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

verseSelect.addEventListener("change", () => {
    const verseNumber = Number(verseSelect.value);
    state.verseId = verseNumber;
    selectVerse(verseNumber);
    
    if (state.isHost) {
        syncNavigation();
    }
    saveState();
});

sessionBtn.addEventListener("click", async () => {

    if (!state.sessionId) {
        console.log("Started session")

        const res = await fetch("/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bookId: state.bookId,
                chapterId: state.chapterId,
                verseId: state.verseId,
                translationId: state.translationId
            })
        });

        const { sessionId } = await res.json();

        state.sessionId = sessionId;

        socket.emit("join-session", sessionId);

        inviteLink = `${window.location.origin}?session=${sessionId}`;

        console.log(inviteLink)

        overlayMenu.classList.add("hidden");
        overlayLink.classList.remove("hidden");
        
        sessionBtn.textContent = "Share link"
    } else if (state.isHost === true) {
        overlayMenu.classList.add("hidden");
        overlayLink.classList.remove("hidden"); 
        linkHeader.textContent = "Session ongoing!"
        
    } else if (state.sessionId === true && !state.isHost) {
        linkHeader.textContent = "Click to disconnect"
    }

});

overlayLink.addEventListener("click", async () => {

    await navigator.clipboard.writeText(inviteLink);

    if (copyBtn.textContent === "Copied! Click to close~") {
        overlayLink.classList.add("hidden");
        copyBtn.textContent = "Click to copy link ~";
    } else {
        copyBtn.textContent = "Copied! Click to close~";
    }
});

async function init() {
    loadState();
    applyFontSize();

    await Promise.all([
        loadBooks(),
        preloadChapters(),
        preloadVerses(),
        loadTranslations()
    ]);

    bookSelect.value = state.bookId;
    translationSelect.value = state.translationId;

    renderChapterOptions(state.bookId);
    chapterSelect.value = state.chapterId;

    document.getElementById("verses")
        .addEventListener("click", handleVerseClick);

    renderVerseOptions(state.bookId, state.chapterId);
    verseSelect.value = state.verseId;

    await renderVerses();
}


function applyState() {

    renderChapterOptions(state.bookId);
    renderVerseOptions(state.bookId, state.chapterId);

    chapterSelect.value = state.chapterId;
    bookSelect.value = state.bookId;
    translationSelect.value = state.translationId;

    loadChapter();

}

socket.on("navigate", (data) => {

    // 🚫 ignore echo back to sender
    if (data.source === socket.id) return;

    console.log("NAVIGATE RECEIVED:", data);

    const chapterChanged =
        data.bookId !== state.bookId ||
        data.chapterId !== state.chapterId ||
        data.translationId !== state.translationId;

    state.bookId = data.bookId;
    state.chapterId = data.chapterId;
    state.translationId = data.translationId;
    state.verseId = data.verseId;

    // const applyVerse = () => {
    //     if (state.verseId) {
    //         selectVerse(state.verseId);
    //         jumpToVerse(state.verseId);
    //     } else {
    //         clearSelection();
    //     }
    // }

    if (chapterChanged) {
        renderChapterOptions(state.bookId);
        renderVerseOptions(state.bookId, state.chapterId);

        bookSelect.value = state.bookId;
        chapterSelect.value = state.chapterId;
        translationSelect.value = state.translationId;

        loadChapter().then(() => {
            if (state.verseId) {
                selectVerse(state.verseId, true); // 🔥 IMPORTANT
            }
        });

        return;
    }

    if (state.verseId) {
        selectVerse(state.verseId, true); // 🔥 IMPORTANT
    } else {
        clearSelection();
    }});

socket.on("session-state", data => {

    state.sessionId = data.sessionId;
    state.isHost = data.isHost;

    state.bookId = data.bookId;
    state.chapterId = data.chapterId;
    state.verseId = data.verseId;
    state.translationId = data.translationId;

    applyState({ preserveVerse: false });
});

init();
