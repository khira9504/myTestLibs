# WEBアプリケーションとは？
WEB技術を基盤としたアプリケーションソフトウェアのこと
→ WEBサービスを提供するサービスのこと

## WEBアプリケーションとWEBサービスの違い
- サービスを提供するプログラムそのもの
- プログラムを実行することによって提供される機能

# サーバーとは？
WEBサービスを提供するためのプログラムのこと
WEBサーバーの例：nginx・Apache・unicorn

Webアプリケーション＝Webサーバー＋Webサーバー以外の共通機能のライブラリ＋サービスごとに固有のプログラム
Webサーバー以外の共通機能のライブラリ＝Laravel・Django・Ruby on Rails・Spring

# Apacheの使用
## 起動
`` sudo apachectl start ``
## 起動確認
`` ps -u root | grep httpd ``
- ps：OS内部で現在実行されているプロセス一覧を表示するコマンド
- -u：ユーザーを指定して表示する
- grep：ファイルの中の特定の文字列（パターン）がある行を抽出するコマンド
## 終了
`` sudo apachectl stop ``