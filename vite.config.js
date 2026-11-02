import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 使用相對路徑 './'：部署到 GitHub Pages 的專案子路徑（/repo-name/）
// 或自訂網域根目錄都能正確載入圖片。若想改成絕對路徑，可設定環境變數 VITE_BASE=/repo-name/
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [react()],
});
