import { state, saveState, applyFontSize } from "./state.js";
import { selectVerse, handleVerseClick, clearSelection } from "./verse.js";
import { renderChapterOptions, renderVerseOptions } from "./render.js";
import { loadChapter, loadBooks, loadTranslations, renderVerses } from "./api.js";
import { setNavigation } from "./navigation.js";
import {
    socket,
} from "./socket.js";
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
    overlay
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
            selectedVerse: null
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
        if (!state.sessionId) {
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
            
            sessionBtn.textContent = "Share link"
        } else if (state.isHost === true) {
            overlayMenu.classList.add("hidden");
            overlayLink.classList.remove("hidden"); 
            linkHeader.textContent = "Session ongoing!"
            
        } else if (state.sessionId === true && !state.isHost) {
            linkHeader.textContent = "Click to disconnect"
        }
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

// bookSelect.addEventListener("change", async (e) => {
//     state.bookId = Number(e.target.value);
//     state.chapterId = 1;
//     saveState();

//     renderChapterOptions(state.bookId);
//     renderVerseOptions(state.bookId, state.chapterId);

//     chapterSelect.value = 1;

//     await renderVerses();
//     syncNavigation();
// });

// chapterSelect.addEventListener("change", async (e) => {
//     state.chapterId = Number(e.target.value);
//     state.verseId = null;

//     await loadChapter();

//     clearSelection();
//     syncNavigation();
// });

// translationSelect.addEventListener("change", async (e) => {
//     state.translationId = e.target.value;
//     saveState();

//     await renderVerses();
//     syncNavigation();
// });

// nextBtn.addEventListener("click", async () => {
//     state.chapterId++;
//     state.verseId = 1;

//     await loadChapter();
// });

// backBtn.addEventListener("click", async () => {
//     state.chapterId--;
//     chapterSelect.value = state.chapterId;
//     saveState();

//     await renderVerses();
// });

// headerBtn.addEventListener("click", () => {
//     overlayMenu.classList.toggle("hidden");
//     document.querySelector(".overlay").classList.add("show");
// });

// menuClose.addEventListener("click", () => {
//     overlayMenu.classList.add("hidden")
// })

// themeBtn.addEventListener("click", () => {
//     if (state.theme === "Light") {
//         state.theme = "Dark"
//         document.body.classList.add("dark-mode");
//         themeBtn.textContent="Light mode"
//         saveState();
//     } else {
//         state.theme = "Light"
//         document.body.classList.remove("dark-mode");
//         themeBtn.textContent="Dark mode"
//         saveState();
//     }
//     console.log(state.theme);
// });

// fontSlider.addEventListener("input", () => {
//     state.fontSize = Number(fontSlider.value);

//     applyFontSize();
//     saveState();
// });

// verseSelect.addEventListener("change", () => {
//     const verseNumber = Number(verseSelect.value);
//     state.verseId = verseNumber;
//     selectVerse(verseNumber);
    
//     if (state.isHost) {
//         syncNavigation();
//     }
//     saveState();
// });

// sessionBtn.addEventListener("click", async () => {

//     if (!state.sessionId) {
//         console.log("Started session")

//         const res = await fetch("/session", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 bookId: state.bookId,
//                 chapterId: state.chapterId,
//                 verseId: state.verseId,
//                 translationId: state.translationId
//             })
//         });

//         const { sessionId } = await res.json();

//         state.sessionId = sessionId;

//         socket.emit("join-session", sessionId);

//         inviteLink = `${window.location.origin}?session=${sessionId}`;

//         console.log(inviteLink)

//         overlayMenu.classList.add("hidden");
//         overlayLink.classList.remove("hidden");
        
//         sessionBtn.textContent = "Share link"
//     } else if (state.isHost === true) {
//         overlayMenu.classList.add("hidden");
//         overlayLink.classList.remove("hidden"); 
//         linkHeader.textContent = "Session ongoing!"
        
//     } 
//     // else if (state.sessionId === true && !state.isHost) {
//     //     linkHeader.textContent = "Click to disconnect"
//     // }

// });

// overlayLink.addEventListener("click", async () => {

//     await navigator.clipboard.writeText(inviteLink);

//     if (copyBtn.textContent === "Copied! Click to close~") {
//         overlayLink.classList.add("hidden");
//         copyBtn.textContent = "Click to copy link ~";
//     } else {
//         copyBtn.textContent = "Copied! Click to close~";
//     }
// });