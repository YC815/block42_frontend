"use client";

/**
 * Block42 Frontend - Designer API 測試區
 * 測試關卡 CRUD 操作和發布功能
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponseDisplay } from "./response-display";
import { apiClient } from "@/lib/api-client";
import { TEST_LEVEL_DATA, EXAMPLE_TITLES } from "@/lib/test-data";
import type { Level } from "@/types/api";

export function DesignerSection() {
  // 創建關卡狀態
  const [createTitle, setCreateTitle] = useState("");
  const [createMapData, setCreateMapData] = useState("");
  const [createConfig, setCreateConfig] = useState("");
  const [createResponse, setCreateResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // 列出我的關卡
  const [listResponse, setListResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [listLoading, setListLoading] = useState(false);

  // 更新/刪除/發布關卡
  const [operationId, setOperationId] = useState("");
  const [operationResponse, setOperationResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // 快速填充創建表單
  const handleQuickFill = () => {
    setCreateTitle(EXAMPLE_TITLES[0]);
    setCreateMapData(JSON.stringify(TEST_LEVEL_DATA.map_data, null, 2));
    setCreateConfig(JSON.stringify(TEST_LEVEL_DATA.config, null, 2));
  };

  // 創建關卡
  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      let mapData, config;
      try {
        mapData = JSON.parse(createMapData);
        config = JSON.parse(createConfig);
      } catch {
        throw new Error("JSONB 格式錯誤，請檢查");
      }

      const data = await apiClient<Level>({
        method: "POST",
        endpoint: "/api/v1/designer/levels",
        body: { title: createTitle, map_data: mapData, config },
        requiresAuth: true,
      });
      setCreateResponse({ status: 201, data });
    } catch (error) {
      setCreateResponse({
        status: 400,
        error: error instanceof Error ? error.message : "創建失敗",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // 列出我的關卡
  const handleList = async () => {
    setListLoading(true);
    try {
      const data = await apiClient({
        method: "GET",
        endpoint: "/api/v1/designer/levels",
        requiresAuth: true,
      });
      setListResponse({ status: 200, data });
    } catch (error) {
      setListResponse({
        status: 500,
        error: error instanceof Error ? error.message : "獲取失敗",
      });
    } finally {
      setListLoading(false);
    }
  };

  // 刪除關卡
  const handleDelete = async () => {
    if (!operationId) {
      setOperationResponse({ status: 400, error: "請輸入關卡 ID" });
      return;
    }

    setOperationLoading(true);
    try {
      await apiClient({
        method: "DELETE",
        endpoint: `/api/v1/designer/levels/${operationId}`,
        requiresAuth: true,
      });
      setOperationResponse({ status: 204, data: { message: "刪除成功" } });
    } catch (error) {
      setOperationResponse({
        status: 404,
        error: error instanceof Error ? error.message : "刪除失敗",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  // 發布關卡
  const handlePublish = async () => {
    if (!operationId) {
      setOperationResponse({ status: 400, error: "請輸入關卡 ID" });
      return;
    }

    setOperationLoading(true);
    try {
      const data = await apiClient<Level>({
        method: "POST",
        endpoint: `/api/v1/designer/levels/${operationId}/publish`,
        body: { solution: TEST_LEVEL_DATA.solution },
        requiresAuth: true,
      });
      setOperationResponse({ status: 200, data });
    } catch (error) {
      setOperationResponse({
        status: 400,
        error: error instanceof Error ? error.message : "發布失敗",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 創建關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/v1/designer/levels - 創建新關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="create-title">關卡標題</Label>
            <Input
              id="create-title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="輸入關卡標題"
            />
          </div>
          <div>
            <Label htmlFor="create-map">Map Data (JSONB)</Label>
            <Textarea
              id="create-map"
              value={createMapData}
              onChange={(e) => setCreateMapData(e.target.value)}
              placeholder='{"width": 5, "height": 5, ...}'
              className="font-mono text-xs min-h-[150px]"
            />
          </div>
          <div>
            <Label htmlFor="create-config">Config (JSONB)</Label>
            <Textarea
              id="create-config"
              value={createConfig}
              onChange={(e) => setCreateConfig(e.target.value)}
              placeholder='{"slots": {...}, "available_commands": [...]}'
              className="font-mono text-xs min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createLoading || !createTitle}>
              {createLoading ? "創建中..." : "創建關卡"}
            </Button>
            <Button variant="outline" onClick={handleQuickFill}>
              快速填充
            </Button>
          </div>
          <ResponseDisplay response={createResponse} />
        </CardContent>
      </Card>

      {/* 列出我的關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/designer/levels - 列出我的關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleList} disabled={listLoading}>
            {listLoading ? "獲取中..." : "列出我的關卡"}
          </Button>
          <ResponseDisplay response={listResponse} />
        </CardContent>
      </Card>

      {/* 刪除和發布操作 */}
      <Card>
        <CardHeader>
          <CardTitle>關卡操作 - 刪除 & 發布</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="operation-id">關卡 ID</Label>
            <Input
              id="operation-id"
              value={operationId}
              onChange={(e) => setOperationId(e.target.value)}
              placeholder="輸入關卡 ID"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDelete} disabled={operationLoading || !operationId} variant="destructive">
              刪除關卡
            </Button>
            <Button onClick={handlePublish} disabled={operationLoading || !operationId}>
              發布關卡
            </Button>
          </div>
          <ResponseDisplay response={operationResponse} />
        </CardContent>
      </Card>
    </div>
  );
}
