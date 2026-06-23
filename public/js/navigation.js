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

    if ("bookId" in next)
        state.bookId = next.bookId;

    if ("chapterId" in next)
        state.chapterId = next.chapterId;

    if ("translationId" in next)
        state.translationId = next.translationId;

    if ("verseId" in next)
        state.verseId = next.verseId;

    if ("selectedVerse" in next)
        state.selectedVerse = next.selectedVerse;

    // 2. UPDATE UI (chapter/book/translation)
    if (chapterChanged) {
        renderChapterOptions(state.bookId);
        renderVerseOptions(state.bookId, state.chapterId);

        bookSelect.value = state.bookId;
        chapterSelect.value = state.chapterId;
        translationSelect.value = state.translationId;

        // state.selectedVerse: null;

        await loadChapter();
    } else {
        await renderVerses();
    }

    // 3. APPLY VERSE SELECTION
    if (state.selectedVerse) {
        selectVerse(state.selectedVerse);
    } else {
        clearSelection();
    }

    console.log("OUTGOING NAV:", {
        bookId: state.bookId,
        chapterId: state.chapterId,
        verseId: state.verseId,
        selectedVerse: state.selectedVerse
    });
    // 4. EMIT TO SOCKET ONLY IF LOCAL
    if (source === "local" && state.isHost && state.sessionId) {
        socket.emit("navigate", {
            sessionId: state.sessionId,
            bookId: state.bookId,
            chapterId: state.chapterId,
            verseId: state.verseId,
            selectedVerse: state.selectedVerse,
            translationId: state.translationId,
            source: socket.id
        });
    }

}