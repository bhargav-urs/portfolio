export type Finish = "light" | "dark";

export function currentFinish(): Finish {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-finish") === "dark" ? "dark" : "light";
}

export function toggleFinish(): Finish {
  const next: Finish = currentFinish() === "dark" ? "light" : "dark";
  if (next === "dark") {
    document.documentElement.setAttribute("data-finish", "dark");
  } else {
    document.documentElement.removeAttribute("data-finish");
  }
  try {
    localStorage.setItem("finish", next);
  } catch {
    // Preference just will not persist.
  }
  return next;
}
