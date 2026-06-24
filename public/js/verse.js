import { state, uiFlags, isRemoteUpdate } from "./state.js";
import { socket } from "./socket.js";
// import { syncNavigation } from "./socket.js";
import { setNavigation } from "./navigation.js";
import {
    renderChapterOptions,
    renderVerseOptions,
    jumpToVerse
} from "./render.js";

import {
    chapterSelect,
    bookSelect,
    translationSelect
} from "./dom.js";

import { loadChapter } from "./api.js";

export function selectVerse(verseNumber) {
    clearSelection();

    state.selectedVerse = verseNumber;

    const verse =
        document.getElementById(`verse-${verseNumber}`);

    if (!verse) return;

    verse.classList.add("selected");

    document.querySelectorAll(".verse").forEach(el => {
        if (el !== verse) {
            el.classList.add("dim");
        }
    });

    jumpToVerse(verseNumber);
}

export function clearSelection() {
    state.selectedVerse = null;

    document.querySelectorAll(".verse").forEach(el => {
        el.classList.remove("selected");
        el.classList.remove("dim");
    });
}

export function handleVerseClick(e) {
    const verse = e.target.closest(".verse");
    if (!verse) return;

    const verseNumber =
        Number(verse.id.replace("verse-", ""));

    if (state.selectedVerse === verseNumber) {
        clearSelection();

        setNavigation({
            selectedVerse: null
        }, "local");

        return;
    }

    setNavigation({
        verseId: verseNumber,
        selectedVerse: verseNumber
    }, "local");
}

export function applyState() {

    renderChapterOptions(state.bookId);
    renderVerseOptions(state.bookId, state.chapterId);

    chapterSelect.value = state.chapterId;
    bookSelect.value = state.bookId;
    translationSelect.value = state.translationId;

    loadChapter();
}