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
  encodeValues: document.querySelector("#encodeValues"),
  spaceAsPlus: document.querySelector("#spaceAsPlus"),
  presetButtons: Array.from(document.querySelectorAll(".preset-button")),
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
  encode: true,
  spaceAsPlus: true,
  preset: "custom",
};

const PRESETS = {
  custom: {
    label: "Custom",
    values: null,
  },
  yandex: {
    label: "Yandex Direct",
    values: {
      source: "yandex",
      medium: "cpc",
      campaign: "{campaign_id}",
      term: "{keyword}",
      content: "{ad_id}",
    },
  },
  google: {
    label: "Google Ads",
    values: {
      source: "google",
      medium: "cpc",
      campaign: "{network}",
      term: "{keyword}",
      content: "{creative}",
    },
  },
  vk: {
    label: "VK Ads",
    values: {
      source: "vk",
      medium: "cpc",
      campaign: "{campaign_id}",
      term: "{keyword}",
      content: "{ad_id}",
    },
  },
  email: {
    label: "Email",
    values: {
      source: "newsletter",
      medium: "email",
      campaign: "welcome_series",
      term: "",
      content: "button",
    },
  },
  banner: {
    label: "Banner",
    values: {
      source: "display",
      medium: "banner",
      campaign: "brand_awareness",
      term: "",
      content: "{banner_id}",
    },
  },
  youtube: {
    label: "YouTube",
    values: {
      source: "youtube",
      medium: "cpc",
      campaign: "{campaign_id}",
      term: "{keyword}",
      content: "{video_id}",
    },
  },
  telegram: {
    label: "Telegram",
    values: {
      source: "telegram",
      medium: "cpc",
      campaign: "{campaign_id}",
      term: "{keyword}",
      content: "{ad_id}",
    },
  },
  social: {
    label: "Social",
    values: {
      source: "social",
      medium: "organic",
      campaign: "post",
      term: "",
      content: "{post_id}",
    },
  },
  partner: {
    label: "Partner",
    values: {
      source: "partner",
      medium: "referral",
      campaign: "partner_name",
      term: "",
      content: "placement",
    },
  },
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
  const preset = typeof safe.preset === "string" ? safe.preset : DEFAULTS.preset;
  const presetKey = PRESETS[preset] ? preset : DEFAULTS.preset;
  return {
    baseUrl: typeof safe.baseUrl === "string" ? safe.baseUrl : DEFAULTS.baseUrl,
    source: typeof safe.source === "string" ? safe.source : DEFAULTS.source,
    medium: typeof safe.medium === "string" ? safe.medium : DEFAULTS.medium,
    campaign: typeof safe.campaign === "string" ? safe.campaign : DEFAULTS.campaign,
    term: typeof safe.term === "string" ? safe.term : DEFAULTS.term,
    content: typeof safe.content === "string" ? safe.content : DEFAULTS.content,
    keepQuery: typeof safe.keepQuery === "boolean" ? safe.keepQuery : DEFAULTS.keepQuery,
    lowercase: typeof safe.lowercase === "boolean" ? safe.lowercase : DEFAULTS.lowercase,
    encode: typeof safe.encode === "boolean" ? safe.encode : DEFAULTS.encode,
    spaceAsPlus: typeof safe.spaceAsPlus === "boolean" ? safe.spaceAsPlus : DEFAULTS.spaceAsPlus,
    preset: presetKey,
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
  ui.encodeValues.checked = normalized.encode;
  ui.spaceAsPlus.checked = normalized.spaceAsPlus;
  setActivePreset(normalized.preset);
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
    encode: ui.encodeValues.checked,
    spaceAsPlus: ui.spaceAsPlus.checked,
    preset: getActivePreset(),
  };
}

function storeSettings() {
  setStoredSettings(getCurrentSettings());
}

function setActivePreset(key) {
  ui.presetButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === key);
  });
}

function getActivePreset() {
  const active = ui.presetButtons.find((button) => button.classList.contains("is-active"));
  return active ? active.dataset.preset : DEFAULTS.preset;
}

function applyPreset(key) {
  const preset = PRESETS[key];
  if (!preset) {
    return;
  }
  setActivePreset(key);
  if (!preset.values) {
    storeSettings();
    updateOutput();
    return;
  }

  ui.utmSource.value = preset.values.source;
  ui.utmMedium.value = preset.values.medium;
  ui.utmCampaign.value = preset.values.campaign;
  ui.utmTerm.value = preset.values.term;
  ui.utmContent.value = preset.values.content;

  storeSettings();
  updateOutput();
}

function markCustomPreset() {
  if (getActivePreset() !== "custom") {
    setActivePreset("custom");
  }
}

function sanitizeValue(value, lowercase) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return lowercase ? trimmed.toLowerCase() : trimmed;
}

function safeDecodeURI(value) {
  if (!value) {
    return value;
  }
  try {
    return decodeURI(value);
  } catch (error) {
    return value;
  }
}

function safeDecodeURIComponent(value) {
  if (!value) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function applySpaceEncodingToQuery(value, usePlus) {
  if (!value || usePlus) {
    return value;
  }
  return value.replace(/\+/g, "%20");
}

function applySpaceEncodingToUrl(value, usePlus) {
  if (!value || usePlus) {
    return value;
  }
  const hashIndex = value.indexOf("#");
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const queryIndex = base.indexOf("?");
  if (queryIndex === -1) {
    return value;
  }
  const path = base.slice(0, queryIndex);
  const query = base.slice(queryIndex + 1);
  return `${path}?${applySpaceEncodingToQuery(query, false)}${hash}`;
}

function renderHighlightedUrl(text) {
  ui.output.textContent = "";
  if (!text) {
    return;
  }
  const regex = /utm_[a-z0-9_]+(?==)/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      ui.output.append(document.createTextNode(before));
    }
    const span = document.createElement("span");
    span.className = "utm-highlight";
    span.textContent = match[0];
    ui.output.append(span);
    lastIndex = match.index + match[0].length;
  }

  const rest = text.slice(lastIndex);
  if (rest) {
    ui.output.append(document.createTextNode(rest));
  }
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
  const encode = ui.encodeValues.checked;
  const usePlus = ui.spaceAsPlus.checked;
  const encodedUrl = applySpaceEncodingToUrl(fullUrl, usePlus);
  const encodedQuery = applySpaceEncodingToQuery(utmQuery, usePlus);
  const displayUrl = encode ? encodedUrl : safeDecodeURI(fullUrl);
  const displayQuery = encode ? encodedQuery : safeDecodeURIComponent(utmQuery);
  const hasRequired = missing.length === 0;

  let errorMessage = error;
  if (!errorMessage && missing.length) {
    errorMessage = `Missing required: ${missing.join(", ")}.`;
  }

  ui.error.textContent = errorMessage;
  renderHighlightedUrl(displayUrl);
  ui.outputQuery.textContent = displayQuery ? `?${displayQuery}` : "-";

  updateOutputFit(displayUrl);

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
  const encode = ui.encodeValues.checked;
  const usePlus = ui.spaceAsPlus.checked;
  const output = encode ? applySpaceEncodingToUrl(fullUrl, usePlus) : safeDecodeURI(fullUrl);
  copyText(output, ui.status, "URL");
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
  const encode = ui.encodeValues.checked;
  const usePlus = ui.spaceAsPlus.checked;
  const output = encode ? applySpaceEncodingToQuery(utmQuery, usePlus) : safeDecodeURIComponent(utmQuery);
  copyText(`?${output}`, ui.status, "UTM tags");
}

function handleOpenUrl() {
  const { fullUrl, error, missing } = buildUtmUrl();
  if (error || missing.length) {
    setStatus(ui.status, "Fill in the required fields first.");
    return;
  }
  const usePlus = ui.spaceAsPlus.checked;
  const output = applySpaceEncodingToUrl(fullUrl, usePlus);
  window.open(output, "_blank", "noopener,noreferrer");
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
    ui.encodeValues,
    ui.spaceAsPlus,
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (
        input === ui.utmSource ||
        input === ui.utmMedium ||
        input === ui.utmCampaign ||
        input === ui.utmTerm ||
        input === ui.utmContent
      ) {
        markCustomPreset();
      }
      updateOutput();
      storeSettings();
    });
  });

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });
}

const storedSettings = getStoredSettings();
applySettings(storedSettings || DEFAULTS);

bindEvents();
updateOutput();
