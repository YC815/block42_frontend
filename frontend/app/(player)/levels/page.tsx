import { Suspense } from "react";
import { LevelsPageClient } from "@/components/levels/levels-page-client";

export const metadata = { title: "關卡 - Block42" };

export default function LevelsPage() {
  return (
    <Suspense>
      <LevelsPageClient />
    </Suspense>
  );
}
