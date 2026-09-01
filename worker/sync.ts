export async function syncPublicData(env: Cloudflare.Env): Promise<void> {
  // MVP: 공공데이터 키가 없으면 시드 데이터를 유지한다.
  const key = (env as Cloudflare.Env & { PUBLIC_DATA_API_KEY?: string })
    .PUBLIC_DATA_API_KEY;
  if (!key) {
    await env.DB.prepare(
      `INSERT INTO sync_jobs (source, status, row_count, error)
       VALUES (?, ?, ?, ?)`,
    )
      .bind("public_data", "fail", 0, "공공데이터 API 키가 없어 시드를 유지합니다.")
      .run();
    console.log(
      JSON.stringify({ msg: "공공데이터 동기화 건너뜀", reason: "키 없음" }),
    );
    return;
  }

  await env.DB.prepare(
    `INSERT INTO sync_jobs (source, status, row_count, error)
     VALUES (?, ?, ?, ?)`,
  )
    .bind("public_data", "success", 0, "연동 엔드포인트는 Phase 2에서 채웁니다.")
    .run();
}
