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

export function selectVerse() {
    const hasSelection = state.selectedVerses.size > 0;

    document.querySelectorAll(".verse").forEach(el => {
        const vid = el.id.replace("verse-", "");
        const selected = state.selectedVerses.has(vid);

        el.classList.toggle("selected", selected);
        el.classList.toggle("dim", hasSelection && !selected);
    });
}

export function clearSelection() {
    document.querySelectorAll(".verse").forEach(el => {
        el.classList.remove("selected");
        el.classList.remove("dim");
    });
}

export function handleVerseClick(e) {
    const verse = e.target.closest(".verse");
    if (!verse) return;

    const verseNumber = Number(verse.id.replace("verse-", ""));
    const id = String(verseNumber);

    state.verseId = verseNumber;

    if (state.selectedVerses.has(id)) {
        state.selectedVerses.clear();
        // state.anchorVerse = null;
    } else if (state.selectedVerses.size === 0) {
        state.selectedVerses.add(id);
        state.anchorVerse = verseNumber;
    } else {
        const start = Math.min(state.anchorVerse, verseNumber);
        const end = Math.max(state.anchorVerse, verseNumber);

        for (let i = start; i <=end; i++) {
            state.selectedVerses.add(String(i));
        }
    }

    selectVerse();

    setNavigation({
        verseId: verseNumber,
        selectedVerses: [...state.selectedVerses]
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