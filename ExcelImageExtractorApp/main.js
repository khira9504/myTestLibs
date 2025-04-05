const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('process-excel', async (event, filePath) => {
  try {
    const desktopPath = app.getPath('desktop');
    const outputDir = path.join(desktopPath, 'ExcelImages_' + Date.now());
    fs.mkdirSync(outputDir);

    // Excelファイルをコピー
    const tempExcelPath = path.join(outputDir, 'temp.xlsx');
    fs.copyFileSync(filePath, tempExcelPath);

    // Excelファイルをzipに変換
    const zipPath = path.join(outputDir, 'temp.zip');
    fs.renameSync(tempExcelPath, zipPath);

    // zipを展開
    const extractPath = path.join(outputDir, 'extracted');
    fs.mkdirSync(extractPath);

    // プラットフォームに応じて適切なコマンドを実行
    if (process.platform === 'win32') {
      exec(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}'"`, (error) => {
        if (error) throw error;
        processImages(extractPath, outputDir, zipPath);
      });
    } else {
      exec(`unzip '${zipPath}' -d '${extractPath}'`, (error) => {
        if (error) throw error;
        processImages(extractPath, outputDir, zipPath);
      });
    }
  } catch (error) {
    event.reply('process-error', error.message);
  }
});

function processImages(extractPath, outputDir, zipPath) {
  const mediaPath = path.join(extractPath, 'xl', 'media');
  if (fs.existsSync(mediaPath)) {
    const files = fs.readdirSync(mediaPath);
    files.forEach(file => {
      const sourcePath = path.join(mediaPath, file);
      const destPath = path.join(outputDir, file);
      fs.copyFileSync(sourcePath, destPath);
    });
  }

  // 一時ファイルを削除
  fs.unlinkSync(zipPath);
  fs.rmSync(extractPath, { recursive: true, force: true });

  mainWindow.webContents.send('process-complete', outputDir);
} 