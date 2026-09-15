/* Runtime public config for the browser.
 *
 * Serves the Supabase project URL and the insert-only anon/publishable key so the
 * frontend can perform its direct `submissions` insert. Both values come from
 * Netlify environment variables — nothing is hardcoded or committed. The anon key
 * is safe to expose to the browser: RLS restricts it to INSERT only (no read,
 * update, or delete of any row).
 */
exports.handler = async function () {
  var url = process.env.SUPABASE_URL;
  var anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ error: "config_unavailable" })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ url: url, anonKey: anonKey })
  };
};
