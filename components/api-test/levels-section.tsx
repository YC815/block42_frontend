"use client";

/**
 * Block42 Frontend - 公開關卡 API 測試區
 * 測試官方關卡、社群關卡、單一關卡獲取
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponseDisplay } from "./response-display";
import { get } from "@/lib/api-client";

export function LevelsSection() {
  // 官方關卡狀態
  const [officialResponse, setOfficialResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [officialLoading, setOfficialLoading] = useState(false);

  // 社群關卡狀態
  const [communityResponse, setCommunityResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);

  // 單一關卡狀態
  const [levelId, setLevelId] = useState("");
  const [singleResponse, setSingleResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // 獲取官方關卡
  const handleGetOfficial = async () => {
    setOfficialLoading(true);
    try {
      const data = await get("/api/v1/levels/official");
      setOfficialResponse({ status: 200, data });
    } catch (error) {
      setOfficialResponse({
        status: 500,
        error: error instanceof Error ? error.message : "獲取失敗",
      });
    } finally {
      setOfficialLoading(false);
    }
  };

  // 獲取社群關卡
  const handleGetCommunity = async () => {
    setCommunityLoading(true);
    try {
      const data = await get("/api/v1/levels/community");
      setCommunityResponse({ status: 200, data });
    } catch (error) {
      setCommunityResponse({
        status: 500,
        error: error instanceof Error ? error.message : "獲取失敗",
      });
    } finally {
      setCommunityLoading(false);
    }
  };

  // 獲取單一關卡
  const handleGetSingle = async () => {
    if (!levelId.trim()) {
      setSingleResponse({ status: 400, error: "請輸入關卡 ID" });
      return;
    }

    setSingleLoading(true);
    try {
      const data = await get(`/api/v1/levels/${levelId}`);
      setSingleResponse({ status: 200, data });
    } catch (error) {
      setSingleResponse({
        status: 404,
        error: error instanceof Error ? error.message : "獲取失敗",
      });
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 列出官方關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/levels/official - 列出官方關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            獲取所有官方發布的關卡（is_official=true, status=PUBLISHED）
          </p>
          <Button onClick={handleGetOfficial} disabled={officialLoading}>
            {officialLoading ? "獲取中..." : "獲取官方關卡"}
          </Button>
          <ResponseDisplay response={officialResponse} />
        </CardContent>
      </Card>

      {/* 列出社群關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/levels/community - 列出社群關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            獲取所有社群發布的關卡（is_official=false, status=PUBLISHED）
          </p>
          <Button onClick={handleGetCommunity} disabled={communityLoading}>
            {communityLoading ? "獲取中..." : "獲取社群關卡"}
          </Button>
          <ResponseDisplay response={communityResponse} />
        </CardContent>
      </Card>

      {/* 獲取單一關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/levels/:id - 獲取單一關卡詳情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="level-id">關卡 ID</Label>
            <Input
              id="level-id"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              placeholder="輸入關卡 ID（12字元 NanoID）"
            />
          </div>
          <Button onClick={handleGetSingle} disabled={singleLoading || !levelId}>
            {singleLoading ? "獲取中..." : "獲取關卡詳情"}
          </Button>
          <ResponseDisplay response={singleResponse} />
        </CardContent>
      </Card>
    </div>
  );
}
