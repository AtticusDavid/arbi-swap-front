This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Deployment

### Staging

develop 브랜치를 remote에 푸시합니다.

CI 파이프라인에서 `build-and-push-gitlab` job을 성공적으로 수행하면 Container Registry에 Docker Image가 생성됩니다.

프로젝트 root에서 아래 명령어를 실행하여 배포합니다. 명령어 실행을 위해서는 k8s credential이 필요합니다.

```bash
$ kubectl apply -k ./k8s/overlays/staging
```
