import { fontSlider, sessionBtn, themeBtn } from "./dom.js";
import { selectVerse } from "./verse.js";

export const state = {
    bookId: 1,
    chapterId: 1,
    translationId: "ESV",
    verseId: 1,
    chapters: [],
    verses: [],
    theme: "Light",
    fontSizes: ["1.0rem", "1.2rem", "1.4rem", "1.6rem", "1.8rem"],
    fontSize: 1,
    inviteLink: null,
    isReady: false,
    isHost: false,
    isGuest: false,
    selectedVerses: new Set(),
    anchorVerse: null
};

export const uiFlags = {
    isRemoteScroll: false
};

export let isRemoteUpdate = false;

export function saveState(){
    localStorage.setItem("bibleState", JSON.stringify({
        bookId: state.bookId,
        chapterId: state.chapterId,
        translation: state.translationId,
        theme: state.theme,
        fontSize: state.fontSize
    }));
}

export function loadState(){
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

export function applyFontSize() {
    const size = state.fontSizes[state.fontSize];

    document.documentElement.style.setProperty(
        "--reading-font-size",
        size
    );

    fontSlider.value = state.fontSize;
}

export function applySessionUI() {
    if (state.isHost === false && state.isGuest === false) {
        console.log("local mode")
        sessionBtn.textContent = "Start session"
    }

    if (state.isHost) {
        console.log("host mode")
        // banner.textContent = "You are hosting this session!";
        sessionBtn.textContent = "Exit session"
    } else if (state.isGuest) {
        console.log("guest mode")
        // banner.textContent = "You are following the host!";
        sessionBtn.textContent = "Exit session"
    }
}