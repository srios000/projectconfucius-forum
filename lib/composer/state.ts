export type ComposerPhase = "closed" | "open" | "submitting";

export type ComposerState = {
  phase: ComposerPhase;
  title: string;
  body: string;
  error: string | null;
};

export const initialComposerState: ComposerState = {
  phase: "closed",
  title: "",
  body: "",
  error: null,
};

export type ComposerAction =
  | { type: "OPEN" }
  | { type: "CANCEL" }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_BODY"; body: string }
  | { type: "SUBMIT" }
  | { type: "SUBMIT_OK" }
  | { type: "SUBMIT_ERROR"; message: string };

export function composerReducer(s: ComposerState, a: ComposerAction): ComposerState {
  switch (a.type) {
    case "OPEN":         return { ...s, phase: "open", error: null };
    case "CANCEL":       return { ...initialComposerState };
    case "SET_TITLE":    return { ...s, title: a.title };
    case "SET_BODY":     return { ...s, body: a.body };
    case "SUBMIT":       return { ...s, phase: "submitting", error: null };
    case "SUBMIT_OK":    return { ...initialComposerState };
    case "SUBMIT_ERROR": return { ...s, phase: "open", error: a.message };
  }
}
