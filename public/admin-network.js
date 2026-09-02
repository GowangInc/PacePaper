const NETWORK_ENDPOINT = "/api/admin/network";

/**
 * Minimal network-management state contract.
 *
 * GET /api/admin/network and POST /api/admin/network return:
 * {
 *   managed: boolean,
 *   addresses: Array<{ name: string, address: string }>,
 *   address: string | null,
 *   selectedAddress?: string | null,
 *   studentUrl: string,
 *   liveExam: boolean,
 * }
 *
 * POST accepts { address: string | null }. When `managed` is false the
 * installation does not expose network controls, so this component is empty.
 */

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function networkState(value) {
  if (!value || typeof value !== "object") throw new TypeError("Network sharing returned an invalid state");
  if (value.managed !== true) {
    return {
      managed: false,
      addresses: [],
      address: null,
      selectedAddress: null,
      studentUrl: "",
      liveExam: false,
    };
  }

  const addresses = Array.isArray(value.addresses)
    ? value.addresses
      .map((item, index) => ({
        name: text(item?.name) || `Network ${index + 1}`,
        address: text(item?.address),
      }))
      .filter((item) => item.address)
    : [];
  const uniqueAddresses = addresses.filter((item, index) => addresses.findIndex((other) => other.address === item.address) === index);

  return {
    managed: true,
    addresses: uniqueAddresses,
    address: text(value.address) || null,
    selectedAddress: text(value.selectedAddress) || text(value.address) || null,
    studentUrl: text(value.studentUrl),
    liveExam: value.liveExam === true,
  };
}

function element(documentRef, tag, className = "") {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  return node;
}

function feedbackMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return "Please try again.";
}

function safeStudentUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

async function browserRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  let body = options.body;
  if (body !== undefined && typeof body !== "string" && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  const response = await fetch(path, { ...options, headers, body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? `Request failed (${response.status})`);
  return payload;
}

function addressChoice(documentRef, { address, name }, index, checked, onChange) {
  const label = element(documentRef, "label", "network-share-choice");
  const input = element(documentRef, "input");
  input.type = "radio";
  input.name = "admin-network-address";
  input.id = `admin-network-address-${index}`;
  input.value = address ?? "";
  input.checked = checked;
  input.addEventListener("change", () => onChange(address));
  const copy = element(documentRef, "span");
  copy.textContent = address ? `${name} · ${address}` : name;
  label.append(input, copy);
  return label;
}

/**
 * Mounts the teacher's classroom-sharing control in `root`.
 *
 * `request` follows the same `(path, options) => Promise<json>` shape as the
 * dashboard API helper, which keeps this component independent of the shell
 * and straightforward to test.
 */
export function mountAdminNetwork(root, {
  request = browserRequest,
  documentRef = root?.ownerDocument ?? globalThis.document,
} = {}) {
  if (!root || typeof root.replaceChildren !== "function") {
    throw new TypeError("Admin network controls need a mount element");
  }
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("Admin network controls need a document");
  }

  let state = null;
  let selectedAddress = null;
  let stopped = false;
  let requestNumber = 0;

  function renderLoading() {
    const loading = element(documentRef, "p", "network-share-loading");
    loading.textContent = "Checking classroom sharing…";
    loading.setAttribute("role", "status");
    root.replaceChildren(loading);
  }

  function renderError(error) {
    const panel = element(documentRef, "section", "network-share-panel");
    const heading = element(documentRef, "h3");
    heading.textContent = "Classroom sharing";
    const message = element(documentRef, "p", "status-message");
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    message.dataset.tone = "error";
    message.textContent = `Network sharing could not be loaded. ${feedbackMessage(error)}`;
    const retry = element(documentRef, "button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", () => { void refresh(); });
    panel.append(heading, message, retry);
    root.replaceChildren(panel);
  }

  function render(rawState, confirmation = "") {
    state = networkState(rawState);
    selectedAddress = state.selectedAddress;
    if (!state.managed) {
      root.replaceChildren();
      return;
    }

    const panel = element(documentRef, "section", "network-share-panel");
    const heading = element(documentRef, "h3");
    heading.textContent = "Classroom sharing";
    const description = element(documentRef, "p");
    description.textContent = "Choose where students can open the waiting room. Classroom sharing is for a trusted private school network.";
    panel.append(heading, description);

    const current = element(documentRef, "p", "network-share-current");
    current.dataset.tone = state.address ? "success" : "info";
    current.textContent = state.address
      ? `Classroom sharing is on at ${state.address}.`
      : "This computer only. Students on other devices cannot connect.";
    panel.append(current);

    const studentUrl = safeStudentUrl(state.studentUrl);
    const studentAddress = element(documentRef, "p", "network-share-student-url");
    studentAddress.append(documentRef.createTextNode("Student sign-in address: "));
    if (studentUrl) {
      const link = element(documentRef, "a");
      link.href = studentUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = studentUrl;
      studentAddress.append(link);
    } else {
      studentAddress.append(documentRef.createTextNode("Unavailable"));
    }
    panel.append(studentAddress);

    if (state.liveExam) {
      const warning = element(documentRef, "p", "network-share-warning");
      warning.dataset.tone = "warning";
      warning.textContent = "A live examination is in progress. End it before changing classroom sharing.";
      panel.append(warning);
    }

    const form = element(documentRef, "form", "network-share-form");
    const fieldset = element(documentRef, "fieldset");
    fieldset.disabled = state.liveExam;
    const legend = element(documentRef, "legend");
    legend.textContent = "Student connection";
    const choices = element(documentRef, "div", "network-share-choices");
    const choiceItems = [{ name: "This computer only", address: null }, ...state.addresses];
    for (const address of [state.address, state.selectedAddress]) {
      if (address && !choiceItems.some((item) => item.address === address)) {
        choiceItems.push({
          name: address === state.address ? "Current address (not detected)" : "Selected address (not detected)",
          address,
        });
      }
    }
    choiceItems.forEach((choice, index) => {
      choices.append(addressChoice(documentRef, choice, index, choice.address === selectedAddress, (address) => {
        selectedAddress = address;
      }));
    });
    const save = element(documentRef, "button");
    save.type = "submit";
    save.textContent = "Apply classroom sharing";
    save.disabled = state.liveExam;
    fieldset.append(legend, choices, save);
    form.append(fieldset);

    const feedback = element(documentRef, "p", "status-message network-share-feedback");
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");
    feedback.hidden = !confirmation;
    if (confirmation) {
      feedback.dataset.tone = "success";
      feedback.textContent = confirmation;
    }
    form.append(feedback);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state || state.liveExam) {
        feedback.hidden = false;
        feedback.dataset.tone = "warning";
        feedback.textContent = "Classroom sharing cannot change while an examination is live.";
        return;
      }

      save.disabled = true;
      feedback.hidden = false;
      feedback.dataset.tone = "info";
      feedback.textContent = "Updating classroom sharing…";
      const thisRequest = ++requestNumber;
      try {
        const nextState = await request(NETWORK_ENDPOINT, { method: "POST", body: { address: selectedAddress } });
        if (stopped || thisRequest !== requestNumber) return;
        render(nextState, "Classroom sharing updated.");
      } catch (error) {
        if (stopped || thisRequest !== requestNumber) return;
        save.disabled = false;
        feedback.dataset.tone = "error";
        feedback.textContent = `Classroom sharing could not be updated. ${feedbackMessage(error)}`;
      }
    });

    panel.append(form);
    root.replaceChildren(panel);
  }

  async function refresh() {
    const thisRequest = ++requestNumber;
    renderLoading();
    try {
      const nextState = await request(NETWORK_ENDPOINT, { method: "GET" });
      if (stopped || thisRequest !== requestNumber) return null;
      render(nextState);
      return state;
    } catch (error) {
      if (!stopped && thisRequest === requestNumber) renderError(error);
      return null;
    }
  }

  return {
    ready: refresh(),
    refresh,
    destroy() {
      stopped = true;
      requestNumber += 1;
    },
  };
}
