package com.excelimageextractor;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public class ExcelImageExtractor {
    private static final String MEDIA_FOLDER = "xl/media/";
    private static final String DESKTOP_PATH = System.getProperty("user.home") + "/Desktop/";
    private static final String OUTPUT_FOLDER = "ExcelImages_";

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Excelファイルを指定してください。");
            return;
        }

        String excelPath = args[0];
        extractImages(excelPath);
    }

    public static void extractImages(String excelPath) {
        try {
            // 出力フォルダの作成
            String timestamp = String.valueOf(System.currentTimeMillis());
            String outputFolderPath = DESKTOP_PATH + OUTPUT_FOLDER + timestamp;
            Files.createDirectories(Paths.get(outputFolderPath));

            // Excelファイルのコピー
            Path sourcePath = Paths.get(excelPath);
            String tempExcelPath = outputFolderPath + "/temp_" + sourcePath.getFileName();
            Files.copy(sourcePath, Paths.get(tempExcelPath));

            // 一時的なzipファイルの作成
            String tempZipPath = outputFolderPath + "/temp.zip";
            Files.copy(Paths.get(tempExcelPath), Paths.get(tempZipPath));

            // zipファイルの展開と画像の抽出
            try (ZipFile zipFile = new ZipFile(tempZipPath)) {
                Enumeration<? extends ZipEntry> entries = zipFile.entries();
                while (entries.hasMoreElements()) {
                    ZipEntry entry = entries.nextElement();
                    if (entry.getName().startsWith(MEDIA_FOLDER)) {
                        String fileName = entry.getName().substring(MEDIA_FOLDER.length());
                        try (InputStream is = zipFile.getInputStream(entry)) {
                            Files.copy(is, Paths.get(outputFolderPath, fileName));
                        }
                    }
                }
            }

            // 一時ファイルの削除
            Files.delete(Paths.get(tempExcelPath));
            Files.delete(Paths.get(tempZipPath));

            System.out.println("画像の抽出が完了しました。出力先: " + outputFolderPath);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
} 