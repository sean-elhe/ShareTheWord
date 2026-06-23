import { state } from "./state.js";
import { setNavigation } from "./navigation.js";

export const socket = io();

socket.on("connect", () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");

    if (sessionId) {
        state.sessionId = sessionId;
        socket.emit("join-session", sessionId);
    }
});

socket.on("session-state", async (data) => {
    state.sessionId = data.sessionId;
    state.isHost = data.isHost;

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
});

socket.on("navigate", (data) => {
    if (!state.isReady) return; // 🔥 CRITICAL FIX

    if (data.source === socket.id) return;

    setNavigation(
        {
            bookId: data.bookId,
            chapterId: data.chapterId,
            verseId: data.verseId,
            translationId: data.translationId
        },
        "remote"
    );
});