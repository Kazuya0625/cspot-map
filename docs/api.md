# API設計書

## 1. 概要

C Spot Map Ver.1.0では、フロントエンドとAzure Functions間の通信にREST APIを使用する。

フロントエンドは、データの保存先がAzure Table Storageであることを意識せず、APIだけを呼び出す。

将来、Azure Table StorageからAzure SQL Databaseへ移行した場合も、可能な限りAPI仕様を変更しない方針とする。

## 2. 共通仕様

### ベースURL

ローカル開発環境：

```text
http://localhost:7071/api
```

Azure環境：

```text
https://<Functionsのホスト名>/api
```

### データ形式

リクエストとレスポンスには、原則としてJSON形式を使用する。

```text
Content-Type: application/json
```

画像を含む投稿では、次の形式を使用する。

```text
Content-Type: multipart/form-data
```

### 日時形式

日時はUTCのISO 8601形式とする。

例：

```text
2026-07-26T10:00:00Z
```

### エラーレスポンス

エラー発生時は、次の形式で返却する。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります。"
  }
}
```

## 3. API一覧

|メソッド|パス|概要|
|---|---|---|
|GET|`/api/spots`|公開中のスポット一覧を取得する|
|GET|`/api/spots/{id}`|スポットの詳細を取得する|
|POST|`/api/spots`|新しいスポットを投稿する|
|GET|`/api/categories`|カテゴリ一覧を取得する|

---

## 4. スポット一覧取得

### リクエスト

```http
GET /api/spots
```

### クエリパラメーター

|名前|必須|説明|
|---|---:|---|
|category|×|指定したカテゴリのスポットだけ取得する|
|limit|×|取得件数。初期値は100、最大値は500|

例：

```http
GET /api/spots?category=object&limit=100
```

### 処理内容

- `Status`が`published`のスポットだけを返す
- `CreatedAt`の新しい順に返す
- 一覧表示に必要な項目だけを返す

### 成功レスポンス

HTTPステータス：

```text
200 OK
```

```json
{
  "spots": [
    {
      "id": "6f0a25a5-3c63-4d96-bc32-83aaf354cd72",
      "title": "公園の謎の巨大タコ",
      "latitude": 35.681236,
      "longitude": 139.767125,
      "category": "object",
      "imageUrl": "https://example.blob.core.windows.net/spot-images/example.jpg",
      "createdAt": "2026-07-26T10:00:00Z"
    }
  ]
}
```

---

## 5. スポット詳細取得

### リクエスト

```http
GET /api/spots/{id}
```

例：

```http
GET /api/spots/6f0a25a5-3c63-4d96-bc32-83aaf354cd72
```

### 処理内容

- 指定されたIDのスポットを取得する
- `Status`が`published`のスポットだけを返す
- 該当するスポットがない場合は404を返す

### 成功レスポンス

HTTPステータス：

```text
200 OK
```

```json
{
  "id": "6f0a25a5-3c63-4d96-bc32-83aaf354cd72",
  "title": "公園の謎の巨大タコ",
  "description": "住宅街の公園に突然現れる巨大なタコ型遊具。",
  "latitude": 35.681236,
  "longitude": 139.767125,
  "category": "object",
  "imageUrl": "https://example.blob.core.windows.net/spot-images/example.jpg",
  "createdAt": "2026-07-26T10:00:00Z"
}
```

### 存在しない場合

HTTPステータス：

```text
404 Not Found
```

```json
{
  "error": {
    "code": "SPOT_NOT_FOUND",
    "message": "指定されたスポットが見つかりません。"
  }
}
```

---

## 6. スポット投稿

### リクエスト

```http
POST /api/spots
Content-Type: multipart/form-data
```

### フォーム項目

|名前|データ型|必須|説明|
|---|---|---:|---|
|title|string|○|スポット名|
|description|string|○|スポットの説明|
|latitude|number|○|緯度|
|longitude|number|○|経度|
|category|string|○|カテゴリ|
|image|file|○|投稿画像|

### 入力例

```text
title=公園の謎の巨大タコ
description=住宅街の公園に突然現れる巨大なタコ型遊具。
latitude=35.681236
longitude=139.767125
category=object
image=octopus.jpg
```

### 処理内容

1. 入力内容を検証する
2. UUIDを生成する
3. 画像をAzure Blob Storageへ保存する
4. スポット情報をAzure Table Storageへ保存する
5. `Status`に`pending`を設定する
6. 作成したスポットIDを返す

### 成功レスポンス

HTTPステータス：

```text
201 Created
```

```json
{
  "id": "6f0a25a5-3c63-4d96-bc32-83aaf354cd72",
  "status": "pending",
  "message": "スポットを受け付けました。公開前に内容を確認します。"
}
```

### 入力エラー

HTTPステータス：

```text
400 Bad Request
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "タイトルは1文字以上100文字以内で入力してください。"
  }
}
```

### 対応していない画像形式

HTTPステータス：

```text
415 Unsupported Media Type
```

```json
{
  "error": {
    "code": "UNSUPPORTED_IMAGE_TYPE",
    "message": "JPEG、PNGまたはWebP形式の画像を選択してください。"
  }
}
```

### 画像サイズ超過

HTTPステータス：

```text
413 Payload Too Large
```

```json
{
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "画像サイズは5MB以下にしてください。"
  }
}
```

---

## 7. カテゴリ一覧取得

### リクエスト

```http
GET /api/categories
```

### 成功レスポンス

HTTPステータス：

```text
200 OK
```

```json
{
  "categories": [
    {
      "value": "object",
      "label": "謎のオブジェ"
    },
    {
      "value": "statue",
      "label": "石像・人物像"
    },
    {
      "value": "sign",
      "label": "看板・標識"
    },
    {
      "value": "retro",
      "label": "レトロ"
    },
    {
      "value": "building",
      "label": "建物・設備"
    },
    {
      "value": "other",
      "label": "その他"
    }
  ]
}
```

---

## 8. HTTPステータスコード

|コード|用途|
|---:|---|
|200|取得成功|
|201|新規登録成功|
|400|入力内容が不正|
|404|対象データが存在しない|
|413|画像サイズ超過|
|415|画像形式が未対応|
|500|サーバー内部エラー|

## 9. セキュリティ

Ver.1.0では、次の対策を実施する。

- フロントエンドとAPI間の通信をHTTPSに限定する
- API側でもすべての入力値を検証する
- アップロード可能な画像形式とサイズを制限する
- Blob Storageの接続情報をソースコードに記述しない
- Azure Functionsの設定値または環境変数で接続情報を管理する
- エラーレスポンスに内部の接続情報やスタックトレースを含めない
- 投稿回数制限や不正投稿対策を公開前に検討する

## 10. 将来追加するAPI

Ver.2以降では、次のAPI追加を検討する。

- ユーザー登録・ログイン
- お気に入り登録
- コメント投稿
- いいね
- 通報
- 管理者による投稿承認・却下
- スポット情報の編集・削除