/**
 * Block42 Frontend - 首頁
 * Hero 頁面 + CTA
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            透過遊戲學習程式設計
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Block42 是一個創新的程式學習平台，讓你在遊戲中掌握邏輯思維與演算法概念
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/levels">
              <Button size="lg" className="text-lg px-8">
                開始遊玩
              </Button>
            </Link>
            <Link href="/studio">
              <Button size="lg" variant="outline" className="text-lg px-8">
                建立關卡
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">核心特色</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold mb-2">遊戲化學習</h3>
                <p className="text-gray-600">
                  透過視覺化的遊戲介面，讓程式邏輯變得直觀易懂
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">官方挑戰</h3>
                <p className="text-gray-600">
                  精心設計的關卡系統，從基礎到進階逐步提升能力
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">創作分享</h3>
                <p className="text-gray-600">
                  建立自己的關卡，與全球玩家分享創意挑戰
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">準備好開始了嗎？</h2>
          <p className="text-xl mb-8 opacity-90">
            立即註冊，探索程式設計的無限可能
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              免費註冊
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
