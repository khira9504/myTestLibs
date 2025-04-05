import os
import sys
import platform
import shutil
from pathlib import Path

def install_windows():
    """Windows用のインストール処理"""
    try:
        # スクリプトのパスを取得
        script_path = Path(__file__).parent / "extract_images.py"
        
        # レジストリに追加するコマンドを作成
        reg_command = f"""
          Windows Registry Editor Version 5.00

          [HKEY_CLASSES_ROOT\*\shell\ExtractExcelImages]
          @="画像を取得する"
          "Icon"="%SystemRoot%\\System32\\shell32.dll,70"

          [HKEY_CLASSES_ROOT\*\shell\ExtractExcelImages\command]
          @="\\"python\\" \\"{script_path}\\" \\"%1\\""
        """
        
        # 一時的な.regファイルを作成
        reg_file = Path(__file__).parent / "install.reg"
        with open(reg_file, "w") as f:
            f.write(reg_command)
        
        # レジストリに追加
        os.system(f'reg import "{reg_file}"')
        
        # 一時ファイルを削除
        reg_file.unlink()
        
        print("Windowsの右クリックメニューに追加されました。")
        
    except Exception as e:
        print(f"Windowsのインストール中にエラーが発生しました: {str(e)}")

def install_mac():
    """Mac用のインストール処理"""
    try:
        # Automatorワークフローの作成
        automator_script = f"""
          on run {{input, parameters}}
              set excelFile to POSIX path of input
              do shell script "python3 '{Path(__file__).parent}/extract_images.py' " & quoted form of excelFile
          end run
        """
        
        # Automatorワークフローを保存
        workflow_path = Path.home() / "Library" / "Services" / "Extract Excel Images.workflow"
        workflow_path.mkdir(parents=True, exist_ok=True)
        
        # Contentsフォルダを作成
        contents_path = workflow_path / "Contents"
        contents_path.mkdir(exist_ok=True)
        
        # document.wflowファイルを作成
        with open(contents_path / "document.wflow", "w") as f:
            f.write(automator_script)
        
        print("Macの右クリックメニューに追加されました。")
        
    except Exception as e:
        print(f"Macのインストール中にエラーが発生しました: {str(e)}")

def main():
    system = platform.system()
    if system == "Windows":
        install_windows()
    elif system == "Darwin":  # Mac
        install_mac()
    else:
        print("このオペレーティングシステムはサポートされていません。")

if __name__ == "__main__":
    main() 