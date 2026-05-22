import { describe, it, expect } from "vitest";
import { composerReducer, initialComposerState } from "@/lib/composer/state";

describe("composerReducer", () => {
  it("starts closed", () => {
    expect(initialComposerState.phase).toBe("closed");
  });

  it("OPEN → open", () => {
    const s = composerReducer(initialComposerState, { type: "OPEN" });
    expect(s.phase).toBe("open");
  });

  it("CANCEL from open → closed and resets fields", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SET_TITLE", title: "Hi" });
    s = composerReducer(s, { type: "CANCEL" });
    expect(s.phase).toBe("closed");
    expect(s.title).toBe("");
  });

  it("SUBMIT → submitting; SUBMIT_OK → closed and reset", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SET_TITLE", title: "X" });
    s = composerReducer(s, { type: "SUBMIT" });
    expect(s.phase).toBe("submitting");
    s = composerReducer(s, { type: "SUBMIT_OK" });
    expect(s.phase).toBe("closed");
    expect(s.title).toBe("");
  });

  it("SUBMIT_ERROR returns to open with error message", () => {
    let s = composerReducer(initialComposerState, { type: "OPEN" });
    s = composerReducer(s, { type: "SUBMIT" });
    s = composerReducer(s, { type: "SUBMIT_ERROR", message: "nope" });
    expect(s.phase).toBe("open");
    expect(s.error).toBe("nope");
  });

  it("SET_BODY updates body", () => {
    const s = composerReducer(initialComposerState, { type: "SET_BODY", body: "**hi**" });
    expect(s.body).toBe("**hi**");
  });
});
