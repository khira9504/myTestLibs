import os
import shutil
import zipfile
from pathlib import Path
import platform
import sys
import subprocess
from datetime import datetime

def create_desktop_folder():
    """デスクトップに新しいフォルダを作成する"""
    desktop = Path.home() / "Desktop"
    folder_name = f"excel_images_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    output_folder = desktop / folder_name
    output_folder.mkdir(exist_ok=True)
    return output_folder

def extract_images_from_excel(excel_path):
    """Excelファイルから画像を抽出する"""
    try:
        # Excelファイルのコピーを作成
        excel_path = Path(excel_path)
        temp_excel = excel_path.parent / f"temp_{excel_path.name}"
        shutil.copy2(excel_path, temp_excel)
        
        # 一時的なzipファイル名
        temp_zip = temp_excel.with_suffix('.zip')
        
        # Excelファイルをzipにリネーム
        temp_excel.rename(temp_zip)
        
        # 出力フォルダの作成
        output_folder = create_desktop_folder()
        
        # zipファイルを展開
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            # xl/mediaフォルダ内の画像を抽出
            for file in zip_ref.namelist():
                if file.startswith('xl/media/'):
                    # 画像ファイルを抽出
                    zip_ref.extract(file, output_folder)
        
        # 一時ファイルの削除
        temp_zip.unlink()
        
        return str(output_folder)
    
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        return None

def main():
    if len(sys.argv) != 2:
        print("使用方法: python extract_images.py <Excelファイルのパス>")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    output_folder = extract_images_from_excel(excel_path)
    
    if output_folder:
        print(f"画像の抽出が完了しました。画像は {output_folder} に保存されています。")
    else:
        print("画像の抽出に失敗しました。")

if __name__ == "__main__":
    main() 