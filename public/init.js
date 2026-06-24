import { state, loadState, applyFontSize } from "./js/state.js";
import { socket } from "./js/socket.js";
import { loadBooks, loadTranslations, preloadChapters, preloadVerses, loadChapter, renderVerses } from "./js/api.js";
import { renderChapterOptions, renderVerseOptions } from "./js/render.js";
import { applyState, handleVerseClick } from "./js/verse.js";
import {
    bookSelect,
    chapterSelect,
    translationSelect,
    verseSelect,
    fontSlider,
    verses
} from "./js/dom.js";
import { initEvents } from "./js/events.js";
import { setNavigation } from "./js/navigation.js";

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

    verses.addEventListener("click", handleVerseClick); 

    renderVerseOptions(state.bookId, state.chapterId);
    verseSelect.value = state.verseId;

    await renderVerses();
    state.isReady = true;
    initEvents();
}

init();
