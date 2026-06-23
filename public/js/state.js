import { fontSlider, themeBtn } from "./dom.js";

export const state = {
    bookId: 1,
    chapterId: 1,
    translationId: "ESV",
    verseId: 1,
    chapters: [],
    verses: [],
    theme: "Light",
    fontSizes: ["1.0rem", "1.5rem", "2.0rem"],
    fontSize: 1,
    inviteLink: null,
    isReady: false
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
