import { state } from "./state.js";
import { socket } from "./socket.js";

import { loadChapter, renderVerses } from "./api.js";
import { renderChapterOptions, renderVerseOptions, jumpToVerse } from "./render.js";

import {
    bookSelect,
    chapterSelect,
    translationSelect
} from "./dom.js";

import { selectVerse, clearSelection } from "./verse.js";

export async function setNavigation(next, source = "local") {

    const chapterChanged =
        next.bookId !== state.bookId ||
        next.chapterId !== state.chapterId ||
        next.translationId !== state.translationId;

    // =====================
    // 1. STATE UPDATE
    // =====================

    if ("bookId" in next) state.bookId = next.bookId;
    if ("chapterId" in next) state.chapterId = next.chapterId;
    if ("translationId" in next) state.translationId = next.translationId;
    if ("verseId" in next) state.verseId = next.verseId;

    if ("selectedVerses" in next) {
        state.selectedVerses = new Set(next.selectedVerses ?? []);
    }

    // =====================
    // 2. RENDER
    // =====================

    if (chapterChanged) {
        renderChapterOptions(state.bookId);
        renderVerseOptions(state.bookId, state.chapterId);

        bookSelect.value = state.bookId;
        chapterSelect.value = state.chapterId;
        translationSelect.value = state.translationId;

        await loadChapter();
    } else {
        await renderVerses();
    }

    // =====================
    // 3. UI SYNC (AFTER DOM EXISTS)
    // =====================

    clearSelection();
    selectVerse();

    // IMPORTANT: jump ONLY ONCE, and ONLY here
    if (state.verseId) {
        jumpToVerse(state.verseId);
    }

    // =====================
    // 4. SOCKET SYNC
    // =====================

    if (source === "local" && state.isHost && state.sessionId) {
        socket.emit("navigate", {
            sessionId: state.sessionId,
            bookId: state.bookId,
            chapterId: state.chapterId,
            verseId: state.verseId,
            selectedVerses: [...state.selectedVerses],
            translationId: state.translationId,
            source: socket.id
        });
    }
}