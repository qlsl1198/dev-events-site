# Dev Event Tracker

[Dev-Event](https://github.com/brave-people/Dev-Event) README를 크롤링하여 매일 업데이트되는 개발자 행사 정보 사이트입니다.

## 기능

- **자동 크롤링**: GitHub Dev-Event README에서 이벤트 정보 수집
- **매일 업데이트**: Next.js ISR로 24시간마다 데이터 재검증
- **진행/종료 구분**: 오늘 날짜 기준으로 진행 중인 이벤트와 종료된 이벤트를 탭으로 구분

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 배포 (Vercel 권장)

Vercel에 배포하면 ISR이 자동으로 동작하여 매일 최신 데이터로 갱신됩니다.

```bash
npm run build
```

## 데이터 소스

- [brave-people/Dev-Event](https://github.com/brave-people/Dev-Event) - 원본 저장소
