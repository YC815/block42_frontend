import { LevelsPageClient } from "@/components/levels/levels-page-client";
import type { LevelListItem } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchPublicLevels(
  path: string
): Promise<LevelListItem[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    const data = (await response.json()) as LevelListItem[];
    return data;
  } catch {
    // 讓前端 fallback 到客戶端請求
    return null;
  }
}

export default async function LevelsPage() {
  const [officialLevels, communityLevels] = await Promise.all([
    fetchPublicLevels("/api/v1/levels/official"),
    fetchPublicLevels("/api/v1/levels/community"),
  ]);

  return (
    <LevelsPageClient
      initialOfficialLevels={officialLevels}
      initialCommunityLevels={communityLevels}
    />
  );
}
