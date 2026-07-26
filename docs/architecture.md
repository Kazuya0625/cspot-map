# システム構成設計書

## 1. 設計方針

C Spot Map Ver.1.0では、次の方針でAzure環境を構築する。

- 月額運用費を5,000円以内に抑える
- スマートフォンから利用しやすくする
- 最初は小規模な利用者数を想定する
- 利用者の増加に応じて拡張できる構成にする
- GitHubを利用してソースコードと変更履歴を管理する
- 障害やアプリケーションエラーを確認できるようにする

## 2. システム構成

```text
スマートフォン・PC
        |
        v
Azure Static Web Apps
React + TypeScript
        |
        v
Azure Functions
REST API
        |
        +----------------------+
        |                      |
        v                      v
Azure Table Storage      Azure Blob Storage
スポット情報              投稿画像
        |
        v
Application Insights
ログ・エラー・性能監視
