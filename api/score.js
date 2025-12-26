const { getSupabaseAdmin } = require("./_supabase");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function isValidPlayerId(playerId) {
  return (
    typeof playerId === "string" &&
    playerId.length >= 2 &&
    playerId.length <= 20 &&
    /^[a-zA-Z0-9가-힣 _-]+$/.test(playerId)
  );
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const playerId = payload?.playerId;
    const score = payload?.score;

    if (!isValidPlayerId(playerId)) {
      return json(res, 400, { ok: false, error: "Invalid playerId (2~20 chars)" });
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1_000_000) {
      return json(res, 400, { ok: false, error: "Invalid score" });
    }

    const supabase = getSupabaseAdmin();

    // Upsert player best score:
    // - If new: insert
    // - If existing: only update when incoming score is higher
    const { data: existing, error: readErr } = await supabase
      .from("high_scores")
      .select("best_score")
      .eq("player_id", playerId)
      .maybeSingle();
    if (readErr) throw readErr;

    const nextBest = Math.max(existing?.best_score ?? 0, Math.floor(score));
    const { error: upsertErr } = await supabase.from("high_scores").upsert(
      { player_id: playerId, best_score: nextBest },
      { onConflict: "player_id" },
    );
    if (upsertErr) throw upsertErr;

    return json(res, 200, { ok: true, playerId, bestScore: nextBest });
  } catch (e) {
    console.error(e);
    return json(res, 500, { ok: false, error: "Server Error" });
  }
};


