/* ─────────────────────────────────────────────────────────────────────────
   The Corporate — Supplier Sustainability Portal 2026
   Questionnaire flow logic (v3.2)

   Flow (both doors):
     Door Picker → Contact Step → [questionnaire] → Declaration → Review → Submit
       Door 1: [questionnaire] = S2–S7 guided stepper
       Door 2: [questionnaire] = download workbook → upload/parse
     Submit → write to Supabase `submissions` (direct browser insert, insert-only
     anon key served at runtime by the /config Netlify Function) → fire a
     confirmation email (Netlify Function, independent of the write) → Confirmation.

   EcoVadis path (v3.2): Landing "Submit EcoVadis Scorecard" → EcoVadis Contact &
   Scorecard intake (6 contact fields + scorecard link + GDPR consent) → Submit →
   write to Supabase `ecovadis_submissions` (same insert-only anon key, shared
   tracking_id sequence) → fire the same confirmation email → open ecovadis.com in
   a new tab. No confirmation screen on the portal itself.

   No API key, URL, or secret is hardcoded here. The public Supabase URL + anon
   key are fetched at runtime from /.netlify/functions/config.

   The S2–S7 field model is extracted verbatim from
   /public/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx. Each field id is
   the source workbook cell in the SUPPLIER RESPONSE column (E); "row" is the source
   Excel row, used by the Door 2 parser to locate each answer.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var YESNO = ["Yes", "No"];
  var SECTIONS = [
    { code: "S2", title: "Climate & Decarbonisation", esrs: "ESRS E1", questions: [
      { id: "E6", row: 6, esrs: "E1-4", type: "Quantitative", input: "text",
        q: "Total Scope 1 emissions for last fiscal year (metric tonnes CO₂e). Include verification method." },
      { id: "E7", row: 7, esrs: "E1-4", type: "Quantitative", input: "select",
        options: ["Verified by Third Party", "Internally Calculated", "Estimated", "Not Tracked"],
        q: "Total Scope 2 emissions for last fiscal year — market-based (metric tonnes CO₂e)." },
      { id: "E8", row: 8, esrs: "E1-4", type: "Quantitative", input: "text",
        q: "Total Scope 3 emissions for last fiscal year (metric tonnes CO₂e). Specify categories included." },
      { id: "E9", row: 9, esrs: "E1-3", type: "Dropdown", input: "select", options: YESNO,
        q: "Does your organisation have a Science-Based Target (SBTi) validated decarbonisation target?" },
      { id: "E10", row: 10, esrs: "E1-2", type: "Open-Ended", input: "textarea",
        q: "Describe your top three decarbonisation projects currently in progress or planned for the next 24 months. Include estimated tCO₂e reduction and the specific technology being utilised (e.g., electrification of heat, on-site renewables)." },
      { id: "E11", row: 11, esrs: "E1-2", type: "Open-Ended", input: "textarea",
        q: "What are the primary technical or financial barriers preventing you from reaching a 50% reduction in Scope 1 and 2 emissions by 2030?" }
    ]},
    { code: "S3", title: "Pollution & PFAS", esrs: "ESRS E2", questions: [
      { id: "E13", row: 13, esrs: "E2-3", type: "Quantitative", input: "text",
        q: "Total weight of substances of concern (REACH, SVHC list) used in production last fiscal year (kg)." },
      { id: "E14", row: 14, esrs: "E2-3", type: "Dropdown", input: "select", options: YESNO,
        q: "Do any of your products or production processes contain or utilise PFAS compounds (\"Forever Chemicals\")?" },
      { id: "E15", row: 15, esrs: "E2-3", type: "Open-Ended", input: "textarea",
        q: "If your products contain PFAS, detail your substitution roadmap. Have you identified viable non-PFAS alternatives? Provide your target date for a complete phase-out." },
      { id: "E16", row: 16, esrs: "E2-2", type: "Open-Ended", input: "textarea",
        q: "Describe your industrial wastewater treatment process. What specific measures are in place to ensure zero leakage of hazardous chemicals into local water systems?" }
    ]},
    { code: "S4", title: "Water & Marine Resources", esrs: "ESRS E3", questions: [
      { id: "E18", row: 18, esrs: "E3-1", type: "Quantitative", input: "text",
        q: "Total water withdrawal last fiscal year (m³). Specify source (municipal, groundwater, surface)." },
      { id: "E19", row: 19, esrs: "E3-1", type: "Dropdown", input: "select", options: YESNO,
        q: "Is your primary production facility located in a high-water-stress region (WRI Aqueduct score ≥3)?" },
      { id: "E20", row: 20, esrs: "E3-2", type: "Open-Ended", input: "textarea",
        q: "Provide details on any water-saving or closed-loop recycling projects implemented at your facility. How has your total water intensity (litres per unit produced) changed over the last three years?" },
      { id: "E21", row: 21, esrs: "E3-2", type: "Open-Ended", input: "textarea",
        q: "If your facility is in a high-water-stress region, what is your operational contingency plan for severe drought conditions to ensure supply continuity to The Corporate?" }
    ]},
    { code: "S5", title: "Circular Economy & Waste", esrs: "ESRS E5", questions: [
      { id: "E23", row: 23, esrs: "E5-2", type: "Quantitative", input: "text",
        q: "Total waste generated last fiscal year (tonnes). Breakdown: landfill / recycled / energy recovery / hazardous." },
      { id: "E24", row: 24, esrs: "E5-4", type: "Quantitative", input: "text",
        q: "Percentage of post-consumer recycled (PCR) content in the components supplied to The Corporate (%)." },
      { id: "E25", row: 25, esrs: "E5-3", type: "Open-Ended", input: "textarea",
        q: "How are you incorporating circularity into the specific components you supply to The Corporate? Examples: design for disassembly, modularity, or increasing PCR content." },
      { id: "E26", row: 26, esrs: "E5-2", type: "Open-Ended", input: "textarea",
        q: "Detail your strategy for achieving Zero Waste to Landfill. What are your primary waste streams, and what innovative recycling or upcycling initiatives have you launched recently?" }
    ]},
    { code: "S6", title: "Biodiversity & Ecosystems", esrs: "ESRS E4", questions: [
      { id: "E28", row: 28, esrs: "E4-2", type: "Dropdown", input: "select", options: YESNO,
        q: "Are any of your production sites located within or adjacent to (within 1 km) a protected area or biodiversity hotspot?" },
      { id: "E29", row: 29, esrs: "E4-3", type: "Open-Ended", input: "textarea",
        q: "Describe any initiatives taken to minimise the impact of your operations on local biodiversity. Include land-use management, native planting schemes, or light/noise pollution reduction." },
      { id: "E30", row: 30, esrs: "E4-5", type: "Open-Ended", input: "textarea",
        q: "Have you undertaken a biodiversity impact assessment (TNFD or equivalent) for your primary production sites? If yes, share key findings. If no, provide your target assessment date." }
    ]},
    { code: "S7", title: "Social, Labour & Governance", esrs: "ESRS S2 · G1", questions: [
      { id: "E32", row: 32, esrs: "S2-1", type: "Dropdown", input: "select", options: YESNO,
        q: "Does your organisation have a formal Human Rights and Labour Rights Policy, aligned with the UN Guiding Principles on Business and Human Rights?" },
      { id: "E33", row: 33, esrs: "S2-2", type: "Dropdown", input: "select", options: YESNO,
        q: "Have you conducted a human rights due diligence assessment of your Tier 1 and Tier 2 supply chains in the last 24 months?" },
      { id: "E34", row: 34, esrs: "S2-4", type: "Open-Ended", input: "textarea",
        q: "Describe the grievance mechanism available to workers in your supply chain. How many grievances were filed and resolved in the last 12 months?" },
      { id: "E35", row: 35, esrs: "G1-1", type: "Dropdown", input: "select", options: YESNO,
        q: "Does your organisation have a verified conflict minerals policy (3TG — tin, tantalum, tungsten, gold) in place, including OECD Due Diligence guidance compliance?" },
      { id: "E36", row: 36, esrs: "G1-2", type: "Open-Ended", input: "textarea",
        q: "Describe your supplier code of conduct and how compliance is monitored across your own supply chain. Include details of any third-party audits conducted in the last 24 months." }
    ]}
  ];

  var EXPECTED_HEADERS = ["section", "esrs ref", "type", "question metric", "supplier response", "notes evidence", "status"];
  var DECLARATION_MATCH = "declaration i confirm that the information provided";

  // Shared Contact Step (Door 1 + Door 2). Department (v3.2) is now required on
  // all three paths.
  var CONTACT_FIELDS = [
    { key: "company_name",     id: "c-company",    label: "Company name" },
    { key: "contact_name",     id: "c-name",       label: "Contact name" },
    { key: "contact_job_title",id: "c-job",        label: "Job title / role" },
    { key: "contact_email",    id: "c-email",      label: "Contact email" },
    { key: "contact_phone",    id: "c-phone",      label: "Contact phone" },
    { key: "department",       id: "c-department", label: "Department" }
  ];
  // EcoVadis intake (v3.2) — same six contact fields plus the scorecard link.
  var ECOVADIS_FIELDS = [
    { key: "company_name",     id: "ev-company",    label: "Company name" },
    { key: "contact_name",     id: "ev-name",       label: "Contact full name" },
    { key: "contact_job_title",id: "ev-job",        label: "Job title" },
    { key: "contact_email",    id: "ev-email",      label: "Contact email" },
    { key: "contact_phone",    id: "ev-phone",      label: "Contact phone" },
    { key: "department",       id: "ev-department", label: "Department" },
    { key: "ecovadis_link",    id: "ev-link",       label: "EcoVadis Scorecard Link" }
  ];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validUrl(v) {
    try { var u = new URL(String(v).trim()); return u.protocol === "http:" || u.protocol === "https:"; }
    catch (e) { return false; }
  }

  /* ── State (session only; in-progress data never persisted until Submit) ─── */
  var state = {
    door: null,
    section: 0,
    answers: {},
    contact: { company_name: "", contact_name: "", contact_job_title: "", contact_email: "", contact_phone: "", department: "", consent: false },
    declaration: { signatory: "", confirmed: false },
    ecovadis: { company_name: "", contact_name: "", contact_job_title: "", contact_email: "", contact_phone: "", department: "", ecovadis_link: "", consent: false }
  };

  function allQuestions() {
    var out = [];
    SECTIONS.forEach(function (s) {
      s.questions.forEach(function (q) { q.section = s.code; out.push(q); });
    });
    return out;
  }
  function getAnswer(id) { return state.answers[id] || { response: "", notes: "" }; }

  /* ── Utilities ──────────────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }
  function val(id) { var n = el(id); return n ? String(n.value).trim() : ""; }
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // Normalise for structural matching: lowercase, keep only [a-z0-9 ], collapse spaces.
  function norm(v) {
    return String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function showFormAlert(id, msg) { var a = el(id); if (a) { a.textContent = msg; a.classList.add("is-visible"); } }
  function hideFormAlert(id) { var a = el(id); if (a) { a.classList.remove("is-visible"); a.textContent = ""; } }

  /* ── View switching ─────────────────────────────────────────────────────── */
  var VIEWS = ["view-landing", "view-ecovadis", "view-doorpicker", "view-contact",
               "view-door1", "view-declaration", "view-door1review", "view-door2",
               "view-door2review", "view-confirm"];
  function showView(id) {
    VIEWS.forEach(function (v) {
      var node = el(v);
      if (!node) return;
      if (v === id) { node.hidden = false; node.classList.add("is-active"); }
      else { node.hidden = true; node.classList.remove("is-active"); }
    });
    window.scrollTo(0, 0);
  }
  window.showView = showView;

  /* ── Navigation entry points ────────────────────────────────────────────── */
  window.goHome = function (evt) {
    if (evt && evt.preventDefault) evt.preventDefault();
    showView("view-landing");
  };
  window.startQuestionnaire = function () { showView("view-doorpicker"); };
  window.backToPicker = function () { showView("view-doorpicker"); };

  window.startDoor1 = function () { state.door = 1; showContactStep(); };
  window.startDoor2 = function () { state.door = 2; showContactStep(); };

  /* ── Contact Step (shared by both doors) ────────────────────────────────── */
  function showContactStep() {
    el("contact-eyebrow").textContent = (state.door === 2 ? "Door 2" : "Door 1") + " — Your details";
    CONTACT_FIELDS.forEach(function (f) { var n = el(f.id); if (n) n.value = state.contact[f.key]; });
    el("c-consent").checked = !!state.contact.consent;
    hideFormAlert("contact-alert");
    updateContactContinue();
    showView("view-contact");
  }
  window.showContactStep = showContactStep;

  function readContactForm() {
    CONTACT_FIELDS.forEach(function (f) { state.contact[f.key] = val(f.id); });
    state.contact.consent = !!(el("c-consent") && el("c-consent").checked);
  }
  function contactComplete() {
    var c = state.contact;
    return !!(c.company_name && c.contact_name && c.contact_job_title &&
              c.contact_email && EMAIL_RE.test(c.contact_email) && c.contact_phone &&
              c.department && c.consent);
  }
  function updateContactContinue() {
    readContactForm();
    var btn = el("contact-continue");
    if (btn) btn.disabled = !contactComplete();
  }
  function contactContinue() {
    readContactForm();
    if (!contactComplete()) {
      showFormAlert("contact-alert", "Please complete all fields with a valid email and tick the consent box to continue.");
      return;
    }
    hideFormAlert("contact-alert");
    if (state.door === 1) { openDoor1(0); }
    else { showView("view-door2"); }
  }

  /* ── EcoVadis Contact & Scorecard intake (v3.2, its own path) ───────────── */
  function showEcoVadis() {
    ECOVADIS_FIELDS.forEach(function (f) { var n = el(f.id); if (n) n.value = state.ecovadis[f.key]; });
    var cb = el("ev-consent"); if (cb) cb.checked = !!state.ecovadis.consent;
    hideFormAlert("ecovadis-alert");
    updateEcoVadisSubmit();
    showView("view-ecovadis");
  }
  window.showEcoVadis = showEcoVadis;

  function readEcoVadisForm() {
    ECOVADIS_FIELDS.forEach(function (f) { state.ecovadis[f.key] = val(f.id); });
    state.ecovadis.consent = !!(el("ev-consent") && el("ev-consent").checked);
  }
  function ecovadisComplete() {
    var e = state.ecovadis;
    return !!(e.company_name && e.contact_name && e.contact_job_title &&
              e.contact_email && EMAIL_RE.test(e.contact_email) && e.contact_phone &&
              e.department && e.ecovadis_link && validUrl(e.ecovadis_link) && e.consent);
  }
  function updateEcoVadisSubmit() {
    readEcoVadisForm();
    var btn = el("ev-submit");
    if (btn) btn.disabled = !ecovadisComplete();
  }
  function buildEcoRow() {
    var e = state.ecovadis;
    return {
      company_name: e.company_name,
      contact_name: e.contact_name,
      contact_email: e.contact_email,
      contact_phone: e.contact_phone,
      contact_job_title: e.contact_job_title,
      department: e.department,
      ecovadis_link: e.ecovadis_link
    };
  }
  function setEcoSubmitting(on) {
    var btn = el("ev-submit");
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? "Submitting…" : "Submit & Continue to EcoVadis";
  }
  function resetEcoVadis() {
    state.ecovadis = { company_name: "", contact_name: "", contact_job_title: "", contact_email: "", contact_phone: "", department: "", ecovadis_link: "", consent: false };
    ECOVADIS_FIELDS.forEach(function (f) { var n = el(f.id); if (n) n.value = ""; });
    var cb = el("ev-consent"); if (cb) cb.checked = false;
    setEcoSubmitting(false);
  }
  function submitEcoVadis() {
    readEcoVadisForm();
    hideFormAlert("ecovadis-alert");
    if (!ecovadisComplete()) {
      showFormAlert("ecovadis-alert", "Please complete all fields with a valid email and scorecard URL, and tick the consent box.");
      return;
    }
    // Open the destination tab now, inside the click gesture, so the popup blocker
    // does not block it after the async write. Keep the handle (no "noopener" in the
    // feature string) to navigate it once the write lands, then sever the opener.
    var win = window.open("about:blank", "_blank");
    if (win) { try { win.opener = null; } catch (e) {} }

    var row = buildEcoRow();
    setEcoSubmitting(true);
    insertRow("ecovadis_submissions", row).then(function () {
      sendConfirmationEmail(row);          // independent of the write (fire-and-forget)
      if (win) { win.location = "https://ecovadis.com"; }
      else { window.open("https://ecovadis.com", "_blank", "noopener,noreferrer"); }
      resetEcoVadis();
      showView("view-landing");            // no confirmation screen on the portal itself
    }).catch(function (err) {
      if (win) { try { win.close(); } catch (e) {} }
      setEcoSubmitting(false);
      showFormAlert("ecovadis-alert", "We could not save your details just now. Please check your connection and try again. Your details are still here.");
      if (window.console) console.error("EcoVadis submission failed:", err);
    });
  }

  /* ── DOOR 1 — guided stepper ────────────────────────────────────────────── */
  function openDoor1(sectionIndex) {
    state.door = 1;
    if (typeof sectionIndex === "number") state.section = sectionIndex;
    if (state.section < 0 || state.section >= SECTIONS.length) state.section = 0;
    renderSection(state.section);
    showView("view-door1");
  }
  window.openDoor1 = openDoor1;

  function renderStepper() {
    var wrap = el("door1-stepper");
    wrap.innerHTML = SECTIONS.map(function (s, i) {
      var cls = "stepper-item" + (i === state.section ? " is-current" : (i < state.section ? " is-done" : ""));
      return '<button type="button" class="' + cls + '" role="tab" aria-selected="' + (i === state.section) +
        '" onclick="jumpSection(' + i + ')">' +
        '<span class="stepper-code">' + esc(s.code) + '</span>' +
        '<span class="stepper-name">' + esc(s.title) + '</span></button>';
    }).join("");
    el("door1-count").textContent = "Section " + (state.section + 1) + " of " + SECTIONS.length;
  }

  function fieldMarkup(qn) {
    var a = getAnswer(qn.id);
    var control;
    if (qn.input === "select") {
      var opts = ['<option value="">Select…</option>'].concat(qn.options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (a.response === o ? " selected" : "") + ">" + esc(o) + "</option>";
      })).join("");
      control = '<select class="field-select" id="f-' + qn.id + '" data-qid="' + qn.id + '">' + opts + "</select>";
    } else if (qn.input === "textarea") {
      control = '<textarea class="field-textarea" id="f-' + qn.id + '" data-qid="' + qn.id + '" rows="3">' + esc(a.response) + "</textarea>";
    } else {
      control = '<input type="text" class="field-input" id="f-' + qn.id + '" data-qid="' + qn.id + '" value="' + esc(a.response) + '">';
    }
    return '<div class="field" id="field-' + qn.id + '">' +
      '<div class="field-meta">' +
        (qn.esrs && qn.esrs !== "—" ? '<span class="field-ref">' + esc(qn.esrs) + "</span>" : "") +
        '<span class="field-type">' + esc(qn.type) + "</span>" +
      "</div>" +
      '<label class="field-label" for="f-' + qn.id + '">' + esc(qn.q) + "</label>" +
      control +
      '<label class="field-notes-label" for="n-' + qn.id + '">Notes / Evidence (optional)</label>' +
      '<textarea class="field-textarea" id="n-' + qn.id + '" data-nid="' + qn.id + '" rows="2" style="min-height:60px;">' + esc(a.notes) + "</textarea>" +
      "</div>";
  }

  function renderSection(idx) {
    var s = SECTIONS[idx];
    renderStepper();
    el("door1-section").innerHTML =
      '<div class="form-section">' +
        '<div class="form-section-head">' +
          '<div class="form-section-esrs"><span>' + esc(s.esrs) + "</span></div>" +
          '<div class="form-section-title">' + esc(s.code) + " · " + esc(s.title) + "</div>" +
        "</div>" +
        s.questions.map(fieldMarkup).join("") +
      "</div>";
    hideFormAlert("door1-alert");
    el("door1-back").textContent = idx === 0 ? "Back to details" : "Back";
    el("door1-next").textContent = idx === SECTIONS.length - 1 ? "Continue to declaration" : "Next";
  }

  function saveCurrentSection() {
    var s = SECTIONS[state.section];
    if (!s) return;
    s.questions.forEach(function (qn) {
      var f = el("f-" + qn.id), n = el("n-" + qn.id);
      if (f || n) {
        state.answers[qn.id] = {
          response: f ? String(f.value).trim() : getAnswer(qn.id).response,
          notes: n ? String(n.value).trim() : getAnswer(qn.id).notes
        };
      }
    });
  }

  window.jumpSection = function (i) {
    saveCurrentSection();
    state.section = i;
    renderSection(i);
    window.scrollTo(0, 0);
  };

  function goNext() {
    saveCurrentSection();
    if (state.section < SECTIONS.length - 1) {
      state.section++;
      renderSection(state.section);
      window.scrollTo(0, 0);
    } else {
      openDeclaration();
    }
  }
  function goBack() {
    saveCurrentSection();
    if (state.section === 0) { showContactStep(); return; }
    state.section--;
    renderSection(state.section);
    window.scrollTo(0, 0);
  }

  // All S2–S7 questions are optional per the workbook — only the Contact Step and
  // Declaration gate submission. Kept for safety and future required fields.
  function validateAll() { return []; }

  /* ── Declaration Step (shared by both doors) ────────────────────────────── */
  function openDeclaration() {
    el("declaration-eyebrow").textContent = (state.door === 2 ? "Door 2" : "Door 1") + " — Declaration";
    el("decl-name").value = state.declaration.signatory;
    el("decl-confirm").checked = !!state.declaration.confirmed;
    hideFormAlert("declaration-alert");
    updateDeclarationContinue();
    showView("view-declaration");
  }
  window.openDeclaration = openDeclaration;

  function readDeclaration() {
    state.declaration.signatory = val("decl-name");
    state.declaration.confirmed = !!(el("decl-confirm") && el("decl-confirm").checked);
  }
  function declarationComplete() {
    return !!(state.declaration.signatory && state.declaration.confirmed);
  }
  function updateDeclarationContinue() {
    readDeclaration();
    var btn = el("declaration-continue");
    if (btn) btn.disabled = !declarationComplete();
  }
  function declarationBack() {
    readDeclaration();
    if (state.door === 1) { openDoor1(SECTIONS.length - 1); }
    else { showView("view-door2"); }
  }
  function declarationContinue() {
    readDeclaration();
    if (!declarationComplete()) {
      showFormAlert("declaration-alert", "Enter the authorised signatory name and tick the declaration box to continue.");
      return;
    }
    hideFormAlert("declaration-alert");
    if (state.door === 1) {
      renderReview("door1-review", true, true);
      showView("view-door1review");
    } else {
      renderReview("door2-review", false, true);
      showView("view-door2review");
    }
  }

  /* ── Shared review / summary renderer ───────────────────────────────────── */
  function summaryBlock(title, rows) {
    var body = rows.map(function (r) {
      var answered = r.value !== "" && r.value != null;
      return '<div class="review-row">' +
        '<div class="review-q">' + esc(r.label) + "</div>" +
        '<div class="review-a' + (answered ? "" : " is-empty") + '">' +
          (answered ? esc(r.value) : "Not provided") + "</div>" +
        "</div>";
    }).join("");
    return '<div class="review-group">' +
      '<div class="review-group-head"><div class="review-group-title">' + esc(title) + "</div></div>" +
      body + "</div>";
  }

  function contactSummaryHtml() {
    var c = state.contact;
    return summaryBlock("Contact Details", [
      { label: "Company name", value: c.company_name },
      { label: "Contact name", value: c.contact_name },
      { label: "Job title / role", value: c.contact_job_title },
      { label: "Contact email", value: c.contact_email },
      { label: "Contact phone", value: c.contact_phone },
      { label: "Department", value: c.department },
      { label: "GDPR consent", value: c.consent ? "Consent given" : "" }
    ]);
  }
  function declarationSummaryHtml() {
    var d = state.declaration;
    return summaryBlock("Declaration", [
      { label: "Authorised Signatory Name", value: d.signatory },
      { label: "Declaration", value: d.confirmed ? "Confirmed — information accurate and complete to the best of my knowledge" : "" },
      { label: "Submission date", value: "Recorded automatically on submit" }
    ]);
  }

  function renderReview(containerId, editable, includeContactDecl) {
    var head = includeContactDecl ? (contactSummaryHtml() + declarationSummaryHtml()) : "";
    var sections = SECTIONS.map(function (s, i) {
      var rows = s.questions.map(function (qn) {
        var a = getAnswer(qn.id);
        var answered = a.response !== "";
        return '<div class="review-row">' +
          '<div class="review-q">' + esc(qn.q) + "</div>" +
          '<div class="review-a' + (answered ? "" : " is-empty") + '">' +
            (answered ? esc(a.response) : "Not answered") + "</div>" +
          (a.notes ? '<div class="review-notes"><b>Notes / Evidence</b><br>' + esc(a.notes) + "</div>" : "") +
          "</div>";
      }).join("");
      var edit = editable
        ? '<button type="button" class="review-edit" onclick="editSection(' + i + ')">Edit</button>'
        : "";
      return '<div class="review-group">' +
        '<div class="review-group-head">' +
          '<div class="review-group-title">' + esc(s.code) + " · " + esc(s.title) + "</div>" +
          edit +
        "</div>" + rows + "</div>";
    }).join("");
    el(containerId).innerHTML = head + sections;
  }

  window.editSection = function (i) { openDoor1(i); };

  /* ── DOOR 2 — download & upload ─────────────────────────────────────────── */
  window.clearUpload = function () {
    var input = el("upload-input");
    if (input) input.value = "";
    var f = el("upload-file"); if (f) f.hidden = true;
    var rej = el("upload-reject"); if (rej) rej.classList.remove("is-visible");
  };

  function showReject(title, bodyHtml) {
    var rej = el("upload-reject");
    rej.querySelector(".upload-reject-title").textContent = title;
    el("upload-reject-body").innerHTML = bodyHtml;
    rej.classList.add("is-visible");
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error("read")); };
      r.readAsArrayBuffer(file);
    });
  }

  function handleFile(file) {
    if (!file) return;
    el("upload-reject").classList.remove("is-visible");
    el("upload-file").hidden = false;
    el("upload-file-name").textContent = file.name;

    var ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      showReject("Unsupported file type",
        "Upload the <code>.xlsx</code> workbook or its <code>.csv</code> export. The file you chose is <code>." +
        esc(ext || "unknown") + "</code>. Nothing was imported.");
      return;
    }
    if (file.size === 0) {
      showReject("The file is empty", "This file has no content. Complete the downloaded workbook, then upload it again.");
      return;
    }

    readFile(file).then(function (buf) {
      var wb;
      try {
        wb = XLSX.read(new Uint8Array(buf), { type: "array" });
      } catch (e) {
        showReject("Could not read this file",
          "The tool could not open this as a workbook or CSV export. Re-download the assessment, complete it, and upload the .xlsx or its CSV export. Nothing was imported.");
        return;
      }
      if (!wb.SheetNames.length) { showReject("Empty workbook", "This workbook has no sheets. Nothing was imported."); return; }
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      var res = validateAndParse(rows);
      if (!res.ok) {
        showReject("This file does not match the 2026 template", res.message + " No partial data has been imported — the whole file was rejected.");
        return;
      }
      state.door = 2;
      state.answers = res.answers;
      openDeclaration();
    }).catch(function () {
      showReject("Could not read this file", "Something went wrong reading the file. Please try again. Nothing was imported.");
    });
  }

  function validateAndParse(rows) {
    if (!rows || !rows.length) return { ok: false, message: "The file has no rows." };
    // Locate the header row.
    var h = -1;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i] || [];
      if (norm(r[0]) === "section" && norm(r[4]).indexOf("supplier response") === 0) { h = i; break; }
    }
    if (h === -1) {
      return { ok: false, message: "The header row (SECTION · ESRS REF · TYPE · QUESTION / METRIC · SUPPLIER RESPONSE · NOTES / EVIDENCE · STATUS) could not be found." };
    }
    var hdr = rows[h];
    for (var c = 0; c < EXPECTED_HEADERS.length; c++) {
      if (norm(hdr[c]) !== EXPECTED_HEADERS[c]) {
        return { ok: false, message: "Column " + String.fromCharCode(65 + c) + " header does not match the template (expected “" + EXPECTED_HEADERS[c].toUpperCase() + "”)." };
      }
    }
    // In the S2–S7 template the header sits on Excel row 3 (array index 2); compute any shift.
    var offset = h - 2;
    var answers = {};
    var qs = allQuestions();
    for (var k = 0; k < qs.length; k++) {
      var qn = qs[k];
      var idx = (qn.row - 1) + offset;
      var row = rows[idx] || [];
      var got = norm(row[3]);
      var want = norm(qn.q);
      var key = want.slice(0, 24);
      if (got.indexOf(key) !== 0 && got !== want) {
        return { ok: false, message: "The question at section " + qn.section + " (row for " + qn.esrs + ") does not match the template. This may be a different version of the questionnaire." };
      }
      answers[qn.id] = { response: String(row[4] == null ? "" : row[4]).trim(), notes: String(row[5] == null ? "" : row[5]).trim() };
    }
    // The S2–S7 + Declaration template must also carry the closing Declaration row.
    var hasDecl = rows.some(function (r) {
      return (r || []).some(function (cell) { return norm(cell).indexOf(DECLARATION_MATCH) === 0; });
    });
    if (!hasDecl) {
      return { ok: false, message: "The closing Declaration section could not be found. This may be a different version of the questionnaire." };
    }
    return { ok: true, answers: answers };
  }

  /* ── Runtime config + submission write ──────────────────────────────────── */
  var _cfg = null;
  function getConfig() {
    if (_cfg) return Promise.resolve(_cfg);
    return fetch("/.netlify/functions/config", { headers: { "Accept": "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("config " + res.status);
        return res.json();
      })
      .then(function (cfg) {
        if (!cfg || !cfg.url || !cfg.anonKey) throw new Error("config incomplete");
        _cfg = cfg;
        return cfg;
      });
  }

  function buildRow(door) {
    var answers = {};
    allQuestions().forEach(function (qn) {
      var a = getAnswer(qn.id);
      answers[qn.id] = { response: a.response || "", notes: a.notes || "" };
    });
    var c = state.contact;
    return {
      company_name: c.company_name,
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      contact_phone: c.contact_phone,
      contact_job_title: c.contact_job_title,
      department: c.department,
      submission_door: door === 1 ? "Door 1" : "Door 2",
      questionnaire_answers: answers,
      authorised_signatory_name: state.declaration.signatory,
      declaration_confirmed: true
    };
  }

  // Direct PostgREST insert with the insert-only anon key. `Prefer: return=minimal`
  // because anon has no read policy — we never read the row back. Used by both the
  // `submissions` and `ecovadis_submissions` writes.
  function insertRow(table, row) {
    return getConfig().then(function (cfg) {
      var base = cfg.url.replace(/\/+$/, "");
      return fetch(base + "/rest/v1/" + table, {
        method: "POST",
        headers: {
          "apikey": cfg.anonKey,
          "Authorization": "Bearer " + cfg.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(row)
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { throw new Error("insert " + res.status + " " + t); });
        }
        return true;
      });
    });
  }
  function insertSubmission(row) { return insertRow("submissions", row); }

  // Fire-and-forget. The confirmation email is independent of the write: a failure
  // here must never block or roll back the submission.
  function sendConfirmationEmail(row) {
    try {
      fetch("/.netlify/functions/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: row.contact_email, company_name: row.company_name })
      }).catch(function () {});
    } catch (e) { /* ignore */ }
  }

  function setSubmitting(door, on) {
    var btn = el(door === 1 ? "d1-submit" : "d2-submit");
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? "Submitting…" : "Submit Assessment";
  }

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  window.submitDoor = function (door) {
    var alertId = door === 1 ? "door1-submit-alert" : "door2-submit-alert";
    hideFormAlert(alertId);

    // Gating re-check (defence in depth; the DB CHECK + RLS are the backstop).
    if (!contactComplete()) { state.door = door; showContactStep(); return; }
    if (!declarationComplete()) { state.door = door; openDeclaration(); return; }

    var row = buildRow(door);
    setSubmitting(door, true);
    insertSubmission(row).then(function () {
      sendConfirmationEmail(row);
      goConfirm(door);
    }).catch(function (err) {
      setSubmitting(door, false);
      showFormAlert(alertId, "We could not save your submission just now. Please check your connection and try again. Your answers are still here.");
      if (window.console) console.error("Submission failed:", err);
    });
  };

  function goConfirm(door) {
    setSubmitting(door, false);
    el("confirm-door").textContent = door === 1 ? "Door 1 — Guided Form" : "Door 2 — Download & Upload";
    var em = el("confirm-email");
    if (em) em.textContent = state.contact.contact_email || "your contact address";
    renderReview("confirm-summary", false, false);
    showView("view-confirm");
  }

  /* ── Wire up controls once the DOM is ready ─────────────────────────────── */
  function init() {
    // Door 1 stepper nav
    var nextBtn = el("door1-next"), backBtn = el("door1-back");
    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (backBtn) backBtn.addEventListener("click", goBack);

    // Contact Step live validation
    CONTACT_FIELDS.forEach(function (f) {
      var n = el(f.id);
      if (n) { n.addEventListener("input", updateContactContinue); n.addEventListener("change", updateContactContinue); }
    });
    var consent = el("c-consent");
    if (consent) consent.addEventListener("change", updateContactContinue);
    var contactContinueBtn = el("contact-continue");
    if (contactContinueBtn) contactContinueBtn.addEventListener("click", contactContinue);

    // EcoVadis intake live validation
    ECOVADIS_FIELDS.forEach(function (f) {
      var n = el(f.id);
      if (n) { n.addEventListener("input", updateEcoVadisSubmit); n.addEventListener("change", updateEcoVadisSubmit); }
    });
    var evConsent = el("ev-consent");
    if (evConsent) evConsent.addEventListener("change", updateEcoVadisSubmit);
    var evSubmitBtn = el("ev-submit");
    if (evSubmitBtn) evSubmitBtn.addEventListener("click", submitEcoVadis);

    // Declaration Step live validation
    var declName = el("decl-name"), declConfirm = el("decl-confirm");
    if (declName) declName.addEventListener("input", updateDeclarationContinue);
    if (declConfirm) declConfirm.addEventListener("change", updateDeclarationContinue);
    var declContinueBtn = el("declaration-continue");
    if (declContinueBtn) declContinueBtn.addEventListener("click", declarationContinue);
    var declBack = el("declaration-back"), declBackBtn = el("declaration-back-btn");
    if (declBack) declBack.addEventListener("click", declarationBack);
    if (declBackBtn) declBackBtn.addEventListener("click", declarationBack);

    // Door 2 upload
    var zone = el("upload-zone"), input = el("upload-input");
    if (zone && input) {
      zone.addEventListener("click", function () { input.click(); });
      zone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
      });
      input.addEventListener("change", function () { handleFile(input.files && input.files[0]); });
      ["dragenter", "dragover"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("is-drag"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("is-drag"); });
      });
      zone.addEventListener("drop", function (e) {
        var dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) handleFile(dt.files[0]);
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Expose internals for the local test harness (jsdom). Harmless in-browser.
  window.__TC_MODEL__ = { SECTIONS: SECTIONS, EXPECTED_HEADERS: EXPECTED_HEADERS, allQuestions: allQuestions };
  window.__TC_TEST__ = {
    validateAndParse: validateAndParse,
    norm: norm,
    validUrl: validUrl,
    getState: function () { return state; },
    contactComplete: contactComplete,
    declarationComplete: declarationComplete,
    ecovadisComplete: ecovadisComplete,
    buildRow: buildRow,
    buildEcoRow: buildEcoRow
  };
})();
