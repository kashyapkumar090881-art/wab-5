"use strict";

let toastTimeoutId = null;
let toastAnimationFrameId = null;

function showToast(message, type = "info", duration = 3000) {
  const toastTypes = ["info", "success", "warning", "error"];
  const toastType = toastTypes.includes(type) ? type : "info";
  const toastDuration = Number.isFinite(duration) ? Math.max(0, duration) : 3000;
  // Reuse one live region so repeated messages replace the old toast.
  let toast = document.getElementById("toast-container");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-container";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.setAttribute("aria-hidden", "true");
    document.body.append(toast);
  }

  toast.textContent = String(message);
  toast.className = `toast-container toast-${toastType}`;
  toast.setAttribute("aria-hidden", "false");

  if (toastTimeoutId !== null) {
    window.clearTimeout(toastTimeoutId);
  }
  if (toastAnimationFrameId !== null) {
    window.cancelAnimationFrame(toastAnimationFrameId);
  }

  toast.classList.remove("is-visible");
  toastAnimationFrameId = window.requestAnimationFrame(() => {
    toast.classList.add("is-visible");
    toastAnimationFrameId = null;
  });

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.setAttribute("aria-hidden", "true");
    toastTimeoutId = null;
  }, toastDuration);
}

window.showToast = showToast;

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }

  const matchRow = link.closest("#matches tbody tr");
  if (matchRow && link.matches('a[href*="booking.html"]')) {
    event.preventDefault();

    // Pass this row's match details to booking.html for preselection and feedback.
    const destination = new URL(link.href, window.location.href);
    const matchNumber = matchRow.querySelector('th[scope="row"]')?.textContent.trim();

    if (link.dataset.matchId) {
      destination.searchParams.set("match", link.dataset.matchId);
    }
    if (matchNumber) {
      destination.searchParams.set("matchNumber", matchNumber);
    }
    destination.searchParams.set("source", "schedule");
    destination.hash = "booking-form";
    window.location.assign(destination.href);
    return;
  }

  const destination = new URL(link.href, window.location.href);
  const currentPage = new URL(window.location.href);
  if (
    destination.origin !== currentPage.origin
    || destination.pathname !== currentPage.pathname
    || !destination.hash
  ) {
    return;
  }

  const targetId = decodeURIComponent(destination.hash.slice(1));
  const scrollTarget = document.getElementById(targetId);
  if (!scrollTarget) {
    return;
  }

  event.preventDefault();
  scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });

  if (scrollTarget.id === "book-ticket" || scrollTarget.id === "booking-form") {
    if (scrollTarget instanceof HTMLFormElement) {
      scrollTarget.focus({ preventScroll: true });
    }
    showToast("Scrolling to the booking form...", "info");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  if (!(bookingForm instanceof HTMLFormElement)) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("match");
  const matchSelect = document.getElementById("match");
  if (
    matchId
    && matchSelect instanceof HTMLSelectElement
    && Array.from(matchSelect.options).some((option) => option.value === matchId)
  ) {
    matchSelect.value = matchId;
  }

  const isBookingLink = window.location.hash === "#booking-form";
  const cameFromSchedule = params.get("source") === "schedule";
  if (!isBookingLink && !cameFromSchedule) {
    return;
  }

  window.requestAnimationFrame(() => {
    bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
    bookingForm.focus({ preventScroll: true });
  });

  const matchNumber = params.get("matchNumber");
  const validMatchNumber = matchNumber && /^\d+$/.test(matchNumber);
  const message = validMatchNumber
    ? `Scrolling to booking form for Match #${matchNumber}...`
    : "Your booking form is ready.";
  showToast(message, "success");
});
