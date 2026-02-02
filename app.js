const ui = {
  reset: document.querySelector("#resetDefaults"),
  output: document.querySelector("#utmOutput"),
  outputWrap: document.querySelector("#utmOutputWrap"),
  outputQuery: document.querySelector("#utmQuery"),
  copy: document.querySelector("#utmCopy"),
  copyParams: document.querySelector("#utmCopyParams"),
  open: document.querySelector("#utmOpen"),
  status: document.querySelector("#utmStatus"),
  error: document.querySelector("#utmError"),
  baseUrl: document.querySelector("#baseUrl"),
  keepQuery: document.querySelector("#keepQuery"),
  utmSource: document.querySelector("#utmSource"),
  utmMedium: document.querySelector("#utmMedium"),
  utmCampaign: document.querySelector("#utmCampaign"),
  utmTerm: document.querySelector("#utmTerm"),
  utmContent: document.querySelector("#utmContent"),
  lowercaseValues: document.querySelector("#lowercaseValues"),
};

const state = {
  messageTimers: new Map(),
};

const STORAGE_KEY = "utm-airat-top-settings-v1";

const DEFAULTS = {
  baseUrl: "https://example.com/landing",
  source: "newsletter",
  medium: "email",
  campaign: "spring_launch",
  term: "",
  content: "",
  keepQuery: true,
  lowercase: true,
};

function setStatus(target, message) {
  const existing = state.messageTimers.get(target);
  if (existing) {
    clearTimeout(existing);
  }
  target.textContent = message;
  if (!message) {
    return;
  }
  const timer = setTimeout(() => {
    target.textContent = "";
  }, 2400);
  state.messageTimers.set(target, timer);
}

function copyText(text, statusNode, label) {
  if (!text) {
    return;
  }
  const message = label ? `${label} copied.` : "Copied to clipboard.";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus(statusNode, message))
      .catch(() => setStatus(statusNode, "Copy failed."));
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "absolute";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.select();
  try {
    document.execCommand("copy");
    setStatus(statusNode, message);
  } catch (err) {
    setStatus(statusNode, "Copy failed.");
  }
  document.body.removeChild(fallback);
}

function normalizeSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  return {
    baseUrl: typeof safe.baseUrl === "string" ? safe.baseUrl : DEFAULTS.baseUrl,
    source: typeof safe.source === "string" ? safe.source : DEFAULTS.source,
    medium: typeof safe.medium === "string" ? safe.medium : DEFAULTS.medium,
    campaign: typeof safe.campaign === "string" ? safe.campaign : DEFAULTS.campaign,
    term: typeof safe.term === "string" ? safe.term : DEFAULTS.term,
    content: typeof safe.content === "string" ? safe.content : DEFAULTS.content,
    keepQuery: typeof safe.keepQuery === "boolean" ? safe.keepQuery : DEFAULTS.keepQuery,
    lowercase: typeof safe.lowercase === "boolean" ? safe.lowercase : DEFAULTS.lowercase,
  };
}

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

function setStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage errors (private mode, etc.)
  }
}

function applySettings(settings) {
  const normalized = normalizeSettings(settings || DEFAULTS);

  ui.baseUrl.value = normalized.baseUrl;
  ui.utmSource.value = normalized.source;
  ui.utmMedium.value = normalized.medium;
  ui.utmCampaign.value = normalized.campaign;
  ui.utmTerm.value = normalized.term;
  ui.utmContent.value = normalized.content;
  ui.keepQuery.checked = normalized.keepQuery;
  ui.lowercaseValues.checked = normalized.lowercase;
}

function getCurrentSettings() {
  return {
    baseUrl: ui.baseUrl.value,
    source: ui.utmSource.value,
    medium: ui.utmMedium.value,
    campaign: ui.utmCampaign.value,
    term: ui.utmTerm.value,
    content: ui.utmContent.value,
    keepQuery: ui.keepQuery.checked,
    lowercase: ui.lowercaseValues.checked,
  };
}

function storeSettings() {
  setStoredSettings(getCurrentSettings());
}

function sanitizeValue(value, lowercase) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return lowercase ? trimmed.toLowerCase() : trimmed;
}

function parseBaseUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { error: "Add a destination URL." };
  }
  try {
    return { url: new URL(trimmed) };
  } catch (error) {
    // try adding protocol
  }
  try {
    return { url: new URL(`https://${trimmed}`) };
  } catch (error) {
    return { error: "Enter a valid URL." };
  }
}

function buildUtmParams() {
  const lowercase = ui.lowercaseValues.checked;
  const entries = [
    ["utm_source", ui.utmSource.value],
    ["utm_medium", ui.utmMedium.value],
    ["utm_campaign", ui.utmCampaign.value],
    ["utm_term", ui.utmTerm.value],
    ["utm_content", ui.utmContent.value],
  ];

  const params = new URLSearchParams();
  const values = {};

  entries.forEach(([key, value]) => {
    const cleaned = sanitizeValue(value, lowercase);
    values[key] = cleaned;
    if (cleaned) {
      params.set(key, cleaned);
    }
  });

  return { params, values };
}

function buildUtmUrl() {
  const { url, error } = parseBaseUrl(ui.baseUrl.value);
  const { params, values } = buildUtmParams();

  const missing = [];
  if (!values.utm_source) {
    missing.push("utm_source");
  }
  if (!values.utm_medium) {
    missing.push("utm_medium");
  }
  if (!values.utm_campaign) {
    missing.push("utm_campaign");
  }

  if (!url) {
    return {
      fullUrl: "",
      utmQuery: params.toString(),
      error: error || "Enter a destination URL.",
      missing,
    };
  }

  const query = ui.keepQuery.checked ? new URLSearchParams(url.search) : new URLSearchParams();
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
    const value = values[key];
    if (value) {
      query.set(key, value);
    } else {
      query.delete(key);
    }
  });

  url.search = query.toString();

  return {
    fullUrl: url.toString(),
    utmQuery: params.toString(),
    error: "",
    missing,
  };
}

function updateOutputFit(value) {
  ui.output.classList.remove("is-compact", "is-extra-compact");
  if (!value) {
    return;
  }
  if (value.length >= 140) {
    ui.output.classList.add("is-extra-compact");
  } else if (value.length >= 110) {
    ui.output.classList.add("is-compact");
  }
}

function updateOutput() {
  const { fullUrl, utmQuery, error, missing } = buildUtmUrl();
  const hasRequired = missing.length === 0;

  let errorMessage = error;
  if (!errorMessage && missing.length) {
    errorMessage = `Missing required: ${missing.join(", ")}.`;
  }

  ui.error.textContent = errorMessage;
  ui.output.textContent = fullUrl;
  ui.outputQuery.textContent = utmQuery ? `?${utmQuery}` : "-";

  updateOutputFit(fullUrl);

  const urlReady = !error && hasRequired && Boolean(fullUrl);
  const paramsReady = hasRequired && Boolean(utmQuery);
  ui.copy.disabled = !urlReady;
  ui.open.disabled = !urlReady;
  ui.copyParams.disabled = !paramsReady;
}

function handleCopyUrl() {
  const { fullUrl, error, missing } = buildUtmUrl();
  if (error || missing.length) {
    setStatus(ui.status, "Fill in the required fields first.");
    return;
  }
  copyText(fullUrl, ui.status, "URL");
}

function handleCopyParams() {
  const { utmQuery, missing } = buildUtmUrl();
  if (missing.length) {
    setStatus(ui.status, "Fill in the required fields first.");
    return;
  }
  if (!utmQuery) {
    setStatus(ui.status, "Add UTM values first.");
    return;
  }
  copyText(`?${utmQuery}`, ui.status, "UTM tags");
}

function handleOpenUrl() {
  const { fullUrl, error, missing } = buildUtmUrl();
  if (error || missing.length) {
    setStatus(ui.status, "Fill in the required fields first.");
    return;
  }
  window.open(fullUrl, "_blank", "noopener,noreferrer");
}

function resetDefaults() {
  applySettings(DEFAULTS);
  updateOutput();
  storeSettings();
}

function bindEvents() {
  if (ui.reset) {
    ui.reset.addEventListener("click", resetDefaults);
  }

  ui.copy.addEventListener("click", handleCopyUrl);
  ui.copyParams.addEventListener("click", handleCopyParams);
  ui.open.addEventListener("click", handleOpenUrl);

  ui.outputWrap.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    handleCopyUrl();
  });

  const inputs = [
    ui.baseUrl,
    ui.utmSource,
    ui.utmMedium,
    ui.utmCampaign,
    ui.utmTerm,
    ui.utmContent,
    ui.keepQuery,
    ui.lowercaseValues,
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      updateOutput();
      storeSettings();
    });
  });
}

const storedSettings = getStoredSettings();
applySettings(storedSettings || DEFAULTS);

bindEvents();
updateOutput();
