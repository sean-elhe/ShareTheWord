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

// export let selectedVerse = null;

// export function selectVerse(verseNumber, fromRemote = false) {

//     if (!fromRemote && selectedVerse === verseNumber) {
//         clearSelection();
//         selectedVerse = null;
//         state.verseId = null;
//         return;
//     }

//     clearSelection();

//     state.verseId = verseNumber;

//     const verse = document.getElementById(`verse-${verseNumber}`);
//     if (!verse) return;

//     verse.classList.add("selected");

//     document.querySelectorAll(".verse")
//         .forEach(el => {
//             if (el !== verse) {
//                 el.classList.add("dim");
//             }
//         });

//     jumpToVerse(verseNumber);
// }

export function selectVerse(verseNumber) {
    clearSelection();

    // if (!state.verseId) return;

    state.selectedVerse = verseNumber;

    const verse =
        document.getElementById(`verse-${state.verseId}`);

    if (!verse) return;

    verse.classList.add("selected");

    document.querySelectorAll(".verse").forEach(el => {
        if (el !== verse) {
            el.classList.add("dim");
        }
    });

    jumpToVerse(verseNumber);
}

export function clearSelection(){
    state.selectedVerse = null;

    document.querySelectorAll(".verse.selected")
        .forEach(el => el.classList.remove("selected"));
    document.querySelectorAll(".verse.dim")
        .forEach(el => el.classList.remove("dim"));
    console.log("CLEARING SELECTION");
}

export function handleVerseClick(e) {
    const verse = e.target.closest(".verse");
    if (!verse) return;

    const verseNumber =
        Number(verse.id.replace("verse-", ""));

    state.verseId = verseNumber;

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