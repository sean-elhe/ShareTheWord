import { state } from "./state.js";
import { renderChapterOptions, renderVerseOptions } from "./render.js";
import { saveState } from "./state.js"
import {
    bookSelect,
    translationSelect,
    headerBtn,
    verses
} from "./dom.js";

import { jumpToVerse } from "./render.js";

export async function preloadChapters() {
    const res = await fetch("/chapters");
    state.chapters = await res.json();
}

export async function preloadVerses(){
    const res = await fetch("/verses");
    state.verses = await res.json();
}

export async function loadBooks() {
    const res = await fetch("/books");
    const books = await res.json();

    bookSelect.innerHTML = "";

    books.forEach(book => {
        const option = document.createElement("option");
        option.value = book.book_id;
        option.textContent = book.book;
        bookSelect.appendChild(option);
    });
}

export async function loadTranslations(){
    const res = await fetch("/translations")
    const translations = await res.json();
        console.log(translations);


    translationSelect.innerHTML = "";

    translations.forEach(t => {
        const option = document.createElement("option");

        option.value = t.translation;
        option.textContent = t.translation;

        translationSelect.appendChild(option);
    })
}

export async function renderVerses(jumpVerse = null) {
    const res = await fetch(
        `/book/${state.bookId}/chapter/${state.chapterId}/${state.translationId}`
    );

    const data = await res.json();

    if (!data.length) return;

    headerBtn.textContent =
        `${data[0].book} ${data[0].chapter}`;

    verses.innerHTML =
        data.map(v => `
            <p class="verse" id="verse-${v.verse}">
                <sup>${v.verse}</sup> ${v.text}
            </p>
        `).join("");

    if (jumpVerse) {
        jumpToVerse(jumpVerse);
    }
}

export async function loadChapter() {
    renderVerseOptions(
        state.bookId,
        state.chapterId
    );

    await renderVerses();
    saveState();
}