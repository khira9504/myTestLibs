@echo off
setlocal enabledelayedexpansion

:: 管理者権限の確認
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 管理者権限で実行されています。
) else (
    echo 管理者権限が必要です。管理者として実行してください。
    pause
    exit /b 1
)

:: アプリケーションのインストール先
set INSTALL_DIR=%ProgramFiles%\ExcelImageExtractor
set JAR_PATH=%INSTALL_DIR%\ExcelImageExtractor.jar

:: インストールディレクトリの作成
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: JARファイルのコピー
copy ExcelImageExtractor.jar "%JAR_PATH%"

:: レジストリの設定
reg add "HKEY_CLASSES_ROOT\*\shell\ExcelImageExtractor" /ve /d "画像を取得する" /f
reg add "HKEY_CLASSES_ROOT\*\shell\ExcelImageExtractor\command" /ve /d "\"%ProgramFiles%\Java\jre1.8.0_xxx\bin\java.exe\" -jar \"%JAR_PATH%\" \"%%1\"" /f

echo インストールが完了しました。
pause 