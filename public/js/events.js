import { state, saveState, applyFontSize, applySessionUI } from "./state.js";
import { selectVerse, handleVerseClick, clearSelection } from "./verse.js";
import { jumpToVerse, renderChapterOptions, renderVerseOptions } from "./render.js";
import { loadChapter, loadBooks, loadTranslations, renderVerses } from "./api.js";
import { setNavigation } from "./navigation.js";
import { socket } from "./socket.js";
import {
    bookSelect,
    chapterSelect,
    translationSelect,
    verseSelect,
    nextBtn,
    backBtn,
    headerBtn,
    menuClose,
    themeBtn,
    fontSlider,
    sessionBtn,
    overlayLink,
    copyBtn,
    overlayMenu,
    overlay,
    leaveModal,
    confirmLeaveBtn,
    cancelLeaveBtn,
    // searchBar
} from "./dom.js";

export function initEvents() {

    bookSelect.addEventListener("change", async (e) => {
        setNavigation({
            bookId: Number(e.target.value),
            chapterId: 1,
            verseId: 1,
            selectedVerses: new Set()
        }, "local");
    });

    chapterSelect.addEventListener("change", async (e) => {
        setNavigation({
            chapterId: Number(e.target.value),
            verseId: 1,
            selectedVerses: new Set()
        }, "local");
    });

    verseSelect.addEventListener("change", async (e) => {
        setNavigation({
            verseId: Number(e.target.value)
        }, "local");
    });

    translationSelect.addEventListener("change", async (e) => {
        setNavigation({
            translationId: e.target.value,
            verseId: 1
        }, "local");
    });

    function getNextChapter(bookId, chapterId, direction) {
        const currentIndex = state.chapters.findIndex(
            c => c.book_id === bookId &&
            c.chapter === chapterId
        );

        if (currentIndex === -1) return null;

        if (direction === 1) {
            return state.chapters[currentIndex + 1] || null;
        } else if (direction === 0) {
            return state.chapters[currentIndex - 1] || null;
        }
    }

    nextBtn.addEventListener("click", async () => {
        let direction = 1;

        const next = getNextChapter(
            state.bookId,
            state.chapterId,
            direction
        );

        if (!next) return;
        
        setNavigation({
            bookId: next.book_id,
            chapterId: next.chapter,
            verseId: 1,
            selectedVerses: new Set()
        }, "local");
    });

    backBtn.addEventListener("click", async () => {
        let direction = 0;

        const previous = getNextChapter(
            state.bookId,
            state.chapterId,
            direction
        );

        if (!previous) return;

        setNavigation({
            bookId: previous.book_id,
            chapterId: previous.chapter,
            verseId: 1,
            selectVerse: null
        }, "local");
    });

    headerBtn.addEventListener("click", () => {
        overlayMenu.classList.toggle("hidden");
    });

    menuClose.addEventListener("click", () => {
        overlayMenu.classList.add("hidden");
    });

    themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "Light" ? "Dark" : "Light";

        document.body.classList.toggle("dark-mode");

        saveState();
    });

    fontSlider.addEventListener("input", () => {
        state.fontSize = Number(fontSlider.value);
        applyFontSize();
        saveState();
    });

    sessionBtn.addEventListener("click", async () => {
        if (state.isHost === false && state.isGuest === false) {
            console.log("Started session")

            const res = await fetch("/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    bookId: state.bookId,
                    chapterId: state.chapterId,
                    verseId: state.verseId,
                    translationId: state.translationId
                })
            });

            const { sessionId } = await res.json();
            state.sessionId = sessionId;
            socket.emit("join-session", sessionId);

            state.inviteLink = `${location.origin}/link/${sessionId}`;
            console.log(state.inviteLink)
            overlayMenu.classList.add("hidden");
            overlayLink.classList.remove("hidden");
            
        } else if (state.isHost === true || state.isGuest) {
            overlayMenu.classList.add("hidden");
            leaveModal.classList.remove("hidden");
      } 
    });

    cancelLeaveBtn.addEventListener("click", () => {
        leaveModal.classList.add("hidden");
    });

    confirmLeaveBtn.addEventListener("click", () => {

        state.sessionId = null;
        state.isHost = false;
        state.isGuest = false;
        state.verseId = 1;

        socket.disconnect();

        leaveModal.classList.add("hidden");

        console.log("Left session");
        applySessionUI();
    });

    overlayLink.addEventListener("click", async () => {
        await navigator.clipboard.writeText(state.inviteLink);

        if (copyBtn.textContent === "Copied! Click to close~") {
            overlayLink.classList.add("hidden");
            copyBtn.textContent = "Click to copy link ~";
        } else {
            copyBtn.textContent = "Copied! Click to close~";
        }
    });

    // searchBar.addEventListener("input", (e) => {

    // })
}