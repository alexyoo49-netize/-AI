# 내일경로 AI 배포 방법

이 앱은 Node 서버(`server.mjs`)가 정적 화면과 PDF 텍스트 추출 API를 함께 제공합니다.

## 로컬 실행

```powershell
npm install
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다.

## Render 배포

1. 이 폴더를 GitHub 저장소로 올립니다.
2. Render에서 `New > Web Service`를 선택합니다.
3. GitHub 저장소를 연결합니다.
4. 설정은 아래처럼 둡니다.

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

`render.yaml`이 있으므로 Render가 자동으로 설정을 읽을 수도 있습니다.

## 왜 Vercel보다 Render가 쉬운가

현재 앱은 서버 프로세스가 계속 떠 있는 구조입니다. Render Web Service는 이 구조를 그대로 지원합니다. Vercel에 올리려면 API를 serverless 함수 형태로 나누는 작업이 추가로 필요합니다.

## 배포 후 확인할 것

- 메인 화면이 뜨는지
- 예시 입력 버튼이 작동하는지
- 시뮬레이션 결과가 나오는지
- PDF 업로드 시 텍스트가 추출되는지
