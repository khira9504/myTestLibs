#!/bin/bash

# 管理者権限の確認
if [ "$(id -u)" != "0" ]; then
    echo "管理者権限が必要です。sudoで実行してください。"
    exit 1
fi

# アプリケーションのインストール先
INSTALL_DIR="/Applications/ExcelImageExtractor"
JAR_PATH="$INSTALL_DIR/ExcelImageExtractor.jar"

# インストールディレクトリの作成
mkdir -p "$INSTALL_DIR"

# JARファイルのコピー
cp ExcelImageExtractor.jar "$JAR_PATH"

# Automatorサービスの作成
SERVICE_DIR="$HOME/Library/Services"
SERVICE_NAME="Extract Excel Images.workflow"
SERVICE_PATH="$SERVICE_DIR/$SERVICE_NAME"

mkdir -p "$SERVICE_PATH/Contents"
cat > "$SERVICE_PATH/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSServices</key>
    <array>
        <dict>
            <key>NSMenuItem</key>
            <dict>
                <key>default</key>
                <string>画像を取得する</string>
            </dict>
            <key>NSMessage</key>
            <string>runWorkflowAsService</string>
            <key>NSPortName</key>
            <string>Extract Excel Images</string>
            <key>NSRequiredContext</key>
            <dict/>
            <key>NSSendFileTypes</key>
            <array>
                <string>public.data</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

mkdir -p "$SERVICE_PATH/Contents/Resources"
cat > "$SERVICE_PATH/Contents/Resources/script.sh" << EOF
#!/bin/bash
for f in "\$@"
do
    java -jar "$JAR_PATH" "\$f"
done
EOF

chmod +x "$SERVICE_PATH/Contents/Resources/script.sh"

echo "インストールが完了しました。" 