# 식봄 · 매체 소재별 전환 현황 대시보드 (팀용)

## 프로젝트 개요
식봄(foodspring) Airbridge 광고 데이터를 실시간으로 조회하는 퍼포먼스 마케팅 대시보드.  
개인용 대시보드에서 확장하여 메타 / 토스 / 당근 매체를 추가하고, 소재별 세부 분석 기능을 강화한 팀 공유용 버전.

## 운영 대상 매체
- 네이버 GFA (네이티브 / 커뮤애드 / 애드부스트)
- 카카오 (비즈보드 / 네이티브)
- 메타 (WEB AON / WEB INCU / WEB TBD / WEB INTRO / iOS AON)
- 토스 (리스트 배너 / 보드 배너)
- 당근 (Central 수도권 / East 동부)
- 카페커뮤니티 (노인요양 / 아사장 / 영양사도우미)

## 주요 기능
- 날짜 선택 → Airbridge API 실시간 조회
- 매체별 탭 구조 (전체 요약 / 네이버 GFA / 카카오 / 메타 / 토스 / 당근 / 카페커뮤니티)
- 탭별 KPI 카드 자동 업데이트 (인스톨 / 회원가입 / 첫구매 / 총소진비용 / 첫구매 CAC)
- 매체별 비용 표시 정책: 토스·당근·카페커뮤니티는 비용 컬럼 제거, 전환 데이터만 표시
- 전환 없는 소재/그룹/캠페인 자동 숨김
- 광고그룹 서브섹션 분리 (실제 광고그룹명 기준)
- 소재명 파싱 태그 시스템:
  - 수도권 (파란 보라) / 동부 (청록)
  - CJFW (에메랄드 초록) / 다봄푸드 (회청색 슬레이트)
  - 버전 A (바이올렛) / 버전 B (핫핑크)
  - SKU명 (오렌지) / 영상소재 (연두)
- 메타 전용 소재 파싱: D+SKU명 → 다봄푸드 / SKU명만 → CJFW, 영상소재 별도 분류
- 캠페인 alias 처리: 구 캠페인명과 신 캠페인명 데이터 자동 통합 (비즈보드 2606 등)
- 중복 소재 합산 (동일 캠페인+그룹+소재명 기준)
- 마지막 갱신 시각 표시
- 접속 비밀번호 보호

## 기술 스택
- Frontend: Vanilla HTML/CSS/JS (Single Page)
- Backend: Vercel Edge Function (`api/report.js`)
- 데이터: Airbridge REST API v7 (비동기 폴링 방식)
- 배포: Vercel

## 파일 구조
```
/
├── index.html        # 프론트엔드 UI 전체
├── api/
│   └── report.js    # Vercel Edge Function (Airbridge API 호출)
└── vercel.json       # Vercel 라우팅 설정
```

## 환경변수
| 변수명 | 설명 |
|--------|------|
| `AIRBRIDGE_API_TOKEN` | Airbridge 계정 API 토큰 |

## 접속 정보
- URL: https://sikbom-dashboard-team.vercel.app
- 비밀번호: 별도 전달

## 데이터 흐름
1. 사용자가 날짜 선택 후 조회 버튼 클릭
2. 브라우저 → `/api/report?date=YYYY-MM-DD` 요청
3. Edge Function → Airbridge API에 task 생성 (POST)
4. Edge Function → task 완료까지 폴링 (최대 10초)
5. 완료된 데이터 파싱 → 캠페인 alias 통일 → 중복 소재 합산
6. JSON 응답 → 프론트엔드에서 렌더링

## 캠페인 Alias 처리
| 실제 캠페인명 | 통합 캠페인명 |
|--------------|--------------|
| `FS_Kakao_AOS_NRU_Biz_AON_2606_perform` | `FS_Kakao_AOS_NRU_Biz_AON_perform` |
| `FS_Danggeun_Web_Central_FirstPurchase_2606_perform` | `FS_Danggeun_Web_NRU_FirstPurchase_2606_perform` |
| `FS_Danggeun_Web_East_FirstPurchase_2606_perform` | `FS_Danggeun_Web_NRU_FirstPurchase_2606_perform` |
