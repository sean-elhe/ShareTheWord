import { applySessionUI, state } from "./state.js";
import { setNavigation } from "./navigation.js";
import { selectVerse } from "./verse.js";

export const socket = io();

socket.on("connect", () => {
    const sessionId = location.pathname.split("/")[2];

    if (sessionId) {
        state.sessionId = sessionId;
        socket.emit("join-session", sessionId);
    }
});

// socket.on("connect", () => {
//     // const params = new URLSearchParams(window.location.search);
//     // const sessionId = params.get("session");
//     const match = location.pathname.match(/^\/s\/(.+)$/);

//     if (match) {
//         const sessionId = match[1];

//         state.sessionId = sessionId;
//         socket.emit("join-session", sessionId);
//     }

//     // if (sessionId) {
//     //     state.sessionId = sessionId;
//     //     socket.emit("join-session", sessionId);
//     // }
// });

socket.on("session-state", async (data) => {
    state.sessionId = data.sessionId;
    state.isHost = data.isHost;
    state.isGuest = state.sessionId && !state.isHost;

    // 1. restore state
    state.bookId = data.bookId;
    state.chapterId = data.chapterId;
    state.translationId = data.translationId;
    state.verseId = data.verseId;

    // 2. FORCE FULL UI REBUILD FIRST
    await setNavigation({
        bookId: state.bookId,
        chapterId: state.chapterId,
        translationId: state.translationId,
        verseId: state.verseId
    }, "remote");

    applySessionUI();
});

socket.on("navigate", (data) => {
    if (!state.isReady) return; // 🔥 CRITICAL FIX

    if (data.source === socket.id) return;

    setNavigation(
        {
            bookId: data.bookId,
            chapterId: data.chapterId,
            verseId: data.verseId,
            selectedVerse: data.selectedVerse,
            translationId: data.translationId
        },
        "remote"
    );
    console.log("RECEIVED NAV:", data);

});