import { state } from "./state.js";
import { socket } from "./socket.js";

import { loadChapter, renderVerses } from "./api.js";
import { renderChapterOptions, renderVerseOptions } from "./render.js";

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

    // 1. UPDATE STATE
    state.bookId = next.bookId ?? state.bookId;
    state.chapterId = next.chapterId ?? state.chapterId;
    state.translationId = next.translationId ?? state.translationId;
    state.verseId = next.verseId ?? null;

    // 2. UPDATE UI (chapter/book/translation)
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

    // 3. APPLY VERSE SELECTION
    if (state.verseId) {
        selectVerse(state.verseId, source === "remote");
    } else {
        clearSelection();
    }

    // 4. EMIT TO SOCKET ONLY IF LOCAL
    if (source === "local" && state.isHost && state.sessionId) {
        socket.emit("navigate", {
            sessionId: state.sessionId,
            bookId: state.bookId,
            chapterId: state.chapterId,
            verseId: state.verseId,
            translationId: state.translationId,
            source: socket.id
        });
    }
}