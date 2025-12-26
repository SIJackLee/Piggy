const { getSupabaseAdmin } = require("./_supabase");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  try {
    const top = Math.max(1, Math.min(50, Number(req.query?.top ?? 10) || 10));
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("high_scores")
      .select("player_id,best_score,updated_at")
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(top);
    if (error) throw error;

    return json(res, 200, {
      ok: true,
      top,
      items: (data ?? []).map((r) => ({
        playerId: r.player_id,
        bestScore: r.best_score,
        updatedAt: r.updated_at,
      })),
    });
  } catch (e) {
    console.error(e);
    return json(res, 500, { ok: false, error: "Server Error" });
  }
};


