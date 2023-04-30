# IPFS Encryption POC

## 環境建置

1. 請先安裝 [pnpm](https://pnpm.io/installation) 以及 [Docker](https://docs.docker.com/get-docker/)
2. clone 本專案
```bash
git clone https://github.com/justYu2001/ipfs-encryption-poc.git
```
3. 進入專案資料夾
```bash
cd ipfs-encryption-poc
```
4. 在專案的資料夾新增一個 `.env` 檔，並將以下內容貼上
```
# When adding additional environment variables, the schema in "/src/env.mjs"
# should be updated accordingly.

# Prisma
# https://www.prisma.io/docs/reference/database-reference/connection-urls#env
DATABASE_URL="mysql://root:test@localhost:3306/bei-ke-box"
# DATABASE_URL='mysql://pcsdchna2sdgc8ixp1dl:pscale_pw_oTHyuVojkRK8h9zWohqmEwaq2FAS5JK1ucwiVhyzsWg@aws.connect.psdb.cloud/ipfs-encryption-poc?sslaccept=strict'

# Next Auth
# You can generate a new secret on the command line with:
# openssl rand -base64 32
# https://next-auth.js.org/configuration/options#secret
# NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Next Auth Google Provider for development
GOOGLE_CLIENT_ID="1058650652888-ppshl9erl5467s2tadtaqk07bfitp7ls.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# File encryption key
FILE_ENCRYPTION_KEY="62c0649af65f723b45af03ae535e82c3"
FILE_IV="39f03adb96dd45d431515b56c30d6ed9"
```
5. 安裝所需相依套件
```bash
pnpm i
```
6. 建立資料庫
```bash
pnpm init:db
```
7. 初始化資料表
> :warning: 初始化資料表前請確認資料庫已經可以連線（可以打開 Docker Desktop，看資料庫容器的 Log 訊息確認）
<img width="1296" alt="image" src="https://user-images.githubusercontent.com/49834964/235348697-80b5885b-9806-44bf-afb9-c51cbc9736c7.png">

```bash
npx prisma db push
```
8. 運行程式
```bash
pnpm dev
```
9. 開啟網頁
在瀏覽器網址列輸入 http://localhost:3000 就能看到網頁了
