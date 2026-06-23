import { state, uiFlags, isRemoteUpdate } from "./state.js";
import {
    chapterSelect,
    verseSelect
} from "./dom.js";

export function renderChapterOptions(bookId) {
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

export function renderVerseOptions(bookId, chapterId) {
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

export function jumpToVerse(verseNumber) {
    uiFlags.isRemoteScroll = true;

    const verse = document.getElementById(`verse-${verseNumber}`);
    if (!verse) return;

    verse.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {
        uiFlags.isRemoteScroll = false;
    }, 300);
}
