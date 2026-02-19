import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제품 기획서 - KorRV 성경 앱",
  description: "KorRV 성경 앱 제품 기획서",
};

export default function ProductPlanPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto w-full max-w-5xl px-4">
        <h1 className="mb-3 text-2xl font-bold text-slate-900">제품 기획서</h1>
        <p className="mb-4 text-sm text-slate-600">현재 개발 기준의 기획 문서를 확인할 수 있습니다.</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <iframe
            title="product-plan"
            src="/product-plan.html"
            className="h-[78vh] w-full"
          />
        </div>
      </div>
    </main>
  );
}
