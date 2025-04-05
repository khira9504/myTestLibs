#!/bin/bash

# 必要なディレクトリの作成
mkdir -p dist/windows
mkdir -p dist/mac

# Windows用の実行ファイル作成
pyinstaller --onefile --name extract_images main.py
cp dist/extract_images dist/windows/

# Mac用のアプリケーションバンドル作成
pyinstaller --name ExcelImageExtractor --windowed --icon=icon.icns main.py
cp -r dist/ExcelImageExtractor.app dist/mac/

# 必要なツールのインストール確認
if ! command -v iscc &> /dev/null; then
    echo "Inno Setupがインストールされていません。"
    echo "https://jrsoftware.org/isdl.php からダウンロードしてインストールしてください。"
    exit 1
fi

if ! command -v create-dmg &> /dev/null; then
    echo "create-dmgがインストールされていません。"
    echo "以下のコマンドでインストールしてください："
    echo "brew install create-dmg"
    exit 1
fi

# Windows用インストーラーの作成
iscc windows_installer.iss

# Mac用DMGの作成
create-dmg \
  --volname "ExcelImageExtractor" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "ExcelImageExtractor.app" 200 190 \
  --hide-extension "ExcelImageExtractor.app" \
  --app-drop-link 600 185 \
  "dist/ExcelImageExtractor.dmg" \
  "dist/mac/ExcelImageExtractor.app" 