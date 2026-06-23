import { state, saveState, applyFontSize, applySessionUI } from "./state.js";
import { selectVerse, handleVerseClick, clearSelection } from "./verse.js";
import { renderChapterOptions, renderVerseOptions } from "./render.js";
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
    cancelLeaveBtn
} from "./dom.js";

export function initEvents() {

    bookSelect.addEventListener("change", async (e) => {
        setNavigation({
            bookId: Number(e.target.value),
            chapterId: 1,
            verseId: 1,
            selectedVerse: null
        }, "local");
    });

    chapterSelect.addEventListener("change", async (e) => {
        setNavigation({
            chapterId: Number(e.target.value),
            verseId: 1,
            selectedVerse: null
        }, "local");
    });

    translationSelect.addEventListener("change", async (e) => {
        setNavigation({
            translationId: e.target.value,
            verseId: 1
        }, "local");
    });

    nextBtn.addEventListener("click", async () => {
        setNavigation({
            chapterId: state.chapterId + 1,
            verseId: 1,
            selectedVerse: null
        }, "local");
    });

    backBtn.addEventListener("click", async () => {
        setNavigation({
            chapterId: state.chapterId - 1,
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

    verseSelect.addEventListener("change", () => {
        setNavigation({
            verseId: Number(e.target.value)
        }, "local");
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

            state.inviteLink = `${window.location.origin}?session=${sessionId}`;
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

}