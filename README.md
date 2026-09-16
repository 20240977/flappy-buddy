# Flappy Buddy

작은 우주비행사 버디와 장애물 사이를 날아가는 브라우저 게임입니다.
생명은 3개이며, 충돌 후 잠시 깜빡이는 무적 상태로 계속 비행할 수 있습니다.

## 실행

`index.html`을 브라우저에서 열거나 정적 파일 서버로 실행하세요.

- Space / 클릭 / 터치: 날기
- R: 다시 시작

## Cloudflare Workers 배포

이 프로젝트는 Wrangler로 `dist/`의 정적 게임 파일을 배포합니다. Windows PowerShell에서 다음 명령을 사용하세요.

```powershell
npm.cmd ci
npm.cmd run dev:cloudflare
npm.cmd run deploy:cloudflare
```

`deploy:cloudflare`는 최신 HTML, CSS, JavaScript를 `dist/`에 복사한 다음 Cloudflare에 올립니다. 첫 배포 전에는 Cloudflare 계정에 고유한 `workers.dev` 하위 도메인을 등록해야 합니다. 이후에는 게임을 수정할 때마다 배포 명령을 다시 실행하세요. GitHub 푸시만으로는 자동 배포되지 않습니다.
