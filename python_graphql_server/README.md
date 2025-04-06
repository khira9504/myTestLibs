# GraphQL API Server

FastAPI と Strawberry を使用した GraphQL API サーバー

## アーキテクチャ

- Clean Architecture + MVVM パターンを採用
- ドメイン駆動設計（DDD）の原則に従う
- 依存方向は内側に向け、外側の層は内側の層に依存可能だが、その逆は不可

## セットアップ

1. 仮想環境の作成と有効化:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. 依存関係のインストール:

```bash
pip install -r requirements.txt
```

3. アプリケーションの起動:

```bash
uvicorn app.main:app --reload
```

## エンドポイント

- GraphQL Playground: http://localhost:8000/graphql
- API Documentation: http://localhost:8000/docs

## プロジェクト構造

```
python_graphql_server/
├── app/
│   ├── domain/          # ドメイン層
│   ├── application/     # アプリケーション層
│   ├── infrastructure/  # インフラストラクチャ層
│   └── presentation/    # プレゼンテーション層
├── tests/              # テストコード
├── requirements.txt    # 依存関係
└── README.md          # プロジェクト説明
```
