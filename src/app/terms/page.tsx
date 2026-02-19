import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 - KorRV 성경 앱",
  description: "KorRV 성경 앱 이용약관 안내",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-4xl px-5">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">이용약관</h1>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">서비스 범위</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              본 서비스는 성경 읽기, 읽기 진행 저장, 그룹 초대/진행 확인 기능을 제공합니다.
              서비스 운영 정책은 정책서에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">콘텐츠 이용</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              성경 본문 데이터의 출처 및 라이선스 조건을 준수해야 하며, 정책 변경 시 공지 후 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">정책 문서</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/policy" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                정책서 보기
              </Link>
              <Link href="/product-plan" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                제품 기획서 보기
              </Link>
              <Link href="/privacy" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                개인정보처리방침
              </Link>
            </div>
          </section>

          <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            최종 수정일: {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
    </main>
  );
}
