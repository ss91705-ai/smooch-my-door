// 全域設定
export const APP = {
  title: 'SMOOCH MY DOOR',
  brand: 'Smooch Home',
  // 正式公開時改成 false，就無法再開啟開發測試面板
  devModeEnabled: false,
};

export const STORAGE_KEYS = {
  layout: 'smd:layout:v1', // 門上的佈置
  progress: 'smd:progress:v1', // 事件、彩蛋、獎勵進度（第二～四階段使用）
  settings: 'smd:settings:v1', // 音效開關等
  devConfig: 'smd:devConfig:v1', // 開發模式中的校準值
};
