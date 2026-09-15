/* Confirmation email — user-triggered, fires on Submit.
 *
 * Sends a short "We've received your submission" confirmation to the supplier's
 * own contact email via Resend. Independent of the database write: the frontend
 * calls this fire-and-forget AFTER the submission is saved, so any failure here
 * never blocks or rolls back the submission.
 *
 * RESEND_API_KEY is read from a Netlify environment variable — never hardcoded.
 * While the key is not set, the email arm is dormant: this returns 200 with
 * { sent: false } so the client treats it as a non-event.
 *
 * RESEND_FROM (optional) sets the verified sender address. Resend requires a
 * verified domain to send to arbitrary recipients; until a domain is verified,
 * set RESEND_FROM to a verified address (or use Resend's onboarding@resend.dev
 * for owner-only testing).
 */
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Email arm not configured yet — not an error the supplier should see.
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: "email_not_configured" }) };
  }

  var payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch (e) { payload = {}; }

  var to = (payload.email || "").trim();
  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing_email" }) };
  }
  var company = (payload.company_name || "your organisation").toString().slice(0, 200);
  var from = process.env.RESEND_FROM || "The Corporate Sustainability <onboarding@resend.dev>";

  var text =
    "We've received your submission.\n\n" +
    "Thank you — your sustainability assessment submission for " + company + " has been " +
    "received and recorded. Our EHS and Procurement teams will review it as part of the 2026 " +
    "programme.\n\n" +
    "This is an automated confirmation. Please do not reply to this message. For help, contact " +
    "sustainability@thecorporate.com.\n\n" +
    "The Corporate — Supplier Sustainability Portal 2026";

  try {
    var res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        subject: "We've received your submission",
        text: text
      })
    });

    if (!res.ok) {
      var detail = "";
      try { detail = (await res.text()).slice(0, 300); } catch (e) { /* ignore */ }
      return { statusCode: 502, body: JSON.stringify({ sent: false, reason: "resend_error", status: res.status, detail: detail }) };
    }
    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ sent: false, reason: "exception" }) };
  }
};
