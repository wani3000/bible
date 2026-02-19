import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - KorRV 성경 앱",
  description: "KorRV 성경 앱 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-5">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">개인정보처리방침</h1>

        <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">1. 개인정보 처리목적</h2>
            <p className="leading-relaxed text-gray-700">
              KorRV 성경 앱은 성경 읽기 진행 저장, 그룹 초대/읽기 현황 제공, 서비스 안정화 및 통계 분석 목적으로
              개인정보를 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">2. 처리 항목</h2>
            <ul className="ml-4 list-inside list-disc space-y-1 text-gray-700">
              <li>읽기 기록(권/장/절, 읽기 시각)</li>
              <li>그룹 기능을 위한 로컬 사용자 식별 정보</li>
              <li>디바이스/접속 정보(오류 분석 및 성능 개선)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">3. 보유 및 이용기간</h2>
            <p className="leading-relaxed text-gray-700">
              현재 버전은 로컬 저장소 중심으로 동작하며 앱 삭제 시 데이터가 함께 삭제됩니다. 서버 연동 도입 시
              별도 보관 정책을 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">4. 제3자 제공</h2>
            <p className="leading-relaxed text-gray-700">
              법령에 근거한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">5. 이용자 권리</h2>
            <p className="leading-relaxed text-gray-700">
              이용자는 개인정보 처리 동의를 거부할 수 있으며, 일부 기능 이용이 제한될 수 있습니다.
            </p>
          </section>

          <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500">
            최종 수정일: {new Date().toLocaleDateString("ko-KR")}
          </div>
        </div>
      </div>
    </div>
  );
}
