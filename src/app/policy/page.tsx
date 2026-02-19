import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "정책서 - KorRV 성경 앱",
  description: "KorRV 성경 앱 정책서",
};

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto w-full max-w-5xl px-4">
        <h1 className="mb-3 text-2xl font-bold text-slate-900">정책서</h1>
        <p className="mb-4 text-sm text-slate-600">운영 정책 원문을 확인할 수 있습니다.</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <iframe
            title="policy"
            src="/policy.html"
            className="h-[78vh] w-full"
          />
        </div>
      </div>
    </main>
  );
}
