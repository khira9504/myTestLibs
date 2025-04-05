import os
import shutil
import sys
import zipfile
from pathlib import Path
import platform

def extract_images_from_excel(excel_path):
    try:
        # デスクトップパスの取得
        desktop = str(Path.home() / "Desktop")
        
        # 新しいフォルダーの作成
        output_folder = os.path.join(desktop, "Excel_Images")
        os.makedirs(output_folder, exist_ok=True)
        
        # Excelファイルの複製
        excel_name = os.path.basename(excel_path)
        temp_excel = os.path.join(output_folder, excel_name)
        shutil.copy2(excel_path, temp_excel)
        
        # 複製したExcelをzipに変換
        zip_path = temp_excel + ".zip"
        os.rename(temp_excel, zip_path)
        
        # zipを展開
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # 画像ファイルの抽出
            for file in zip_ref.namelist():
                if file.startswith('xl/media/'):
                    # 画像ファイルの保存
                    image_data = zip_ref.read(file)
                    image_name = os.path.basename(file)
                    with open(os.path.join(output_folder, image_name), 'wb') as img_file:
                        img_file.write(image_data)
        
        # 使用したzipファイルの削除
        os.remove(zip_path)
        
        return True, f"画像の抽出が完了しました。保存先: {output_folder}"
    
    except Exception as e:
        return False, f"エラーが発生しました: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
        success, message = extract_images_from_excel(excel_path)
        print(message)
    else:
        print("Excelファイルのパスが指定されていません。") 