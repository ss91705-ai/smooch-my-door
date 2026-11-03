# SMOOCH MY DOOR｜Smooch Home 2026 雙 11 互動小遊戲

用 POINTITI 彩色磁吸配件佈置玄關大門的網頁小遊戲（React + Vite）。

目前進度：
- **第一階段｜自由裝飾大門**：選商品、選配色、拖曳磁吸、移動、移除、保存與恢復。
- **第二階段｜突發事件**：四種限時事件、智慧門鈴畫面、倒數、拖曳任務物件、成功／失敗判定（`src/config/events.js`）。
- **第三階段｜隱藏彩蛋**：五種組合判定、首次解鎖動畫、彩蛋收藏、紀錄保存（`src/config/eggs.js`）。
- **第四階段｜雙 11 獎勵**：NT$50／80／100 資格（只取最高）、解鎖提示、優惠進度、完成佈置畫面、保存 9:16 作品圖片（`src/config/rewards.js`）。

## 本機開發

```bash
npm install
npm run dev      # 開發伺服器（手機同網域可用顯示的 Network 網址測試）
npm run build    # 建置到 dist/
npm run preview  # 預覽建置結果
```

## 部署到 GitHub Pages

1. 在 GitHub 建立新的 repository（例如 `smooch-my-door`），把整個專案推上 `main` 分支。
2. 到 repository 的 **Settings → Pages → Build and deployment → Source**，選 **GitHub Actions**。
3. 之後每次推送到 `main`，`.github/workflows/deploy.yml` 會自動 `npm ci` → `npm run build` → 發布 `dist/`。
4. 網址會是 `https://<你的帳號>.github.io/<repository 名稱>/`。

Vite 的 `base` 設為相對路徑 `./`，所以部署在專案子路徑或自訂網域都能正確載入圖片；
所有圖片路徑都透過 `import.meta.env.BASE_URL` 組合，沒有寫死成根目錄。

> 提醒：GitHub Pages 的使用條款不鼓勵以它經營商業網站或電子商務。
> 這個遊戲沒有交易功能，但正式用於品牌促銷活動前，請自行確認
> [GitHub Pages 使用限制](https://docs.github.com/pages/getting-started-with-github-pages/github-pages-limits) 是否適用。

## 專案結構

```
public/assets/
  background/entrance.png        玄關背景
  products/hooks|mirrors|magnets|storage/   POINTITI 真實商品 PNG
  objects/  effects/  sounds/    之後的互動物件、特效、音效
src/config/
  scene.js       門板範圍、吸附區、禁放區、門鈴螢幕位置、大門實際寬度
  products.js    商品清單、配色、實際尺寸
  overrides.json 開發模式「匯出設定」貼到這裡即成為正式預設值
  future.js      事件／彩蛋／獎勵（第二～四階段）
  app.js         開發模式開關、localStorage key
src/lib/         比例換算、磁吸位置計算、鏡頭、音效、存檔
src/components/  Scene（門與拖曳）、Tray（商品選單）、DevPanel、Modals
```

## 新增小圓磁鐵（或其他商品）

1. 把去背 PNG 放到 `public/assets/products/magnets/`，例如 `magnet-mint.png`。
2. 在 `src/config/products.js` 的「C. 小圓磁鐵」加一行：
   ```js
   { id: 'magnet-mellow-pink', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'pink', name: 'MELLOW', img: P + 'magnets/magnet-mellow-pink.png' },
   ```
   Ø13 用 `sizeKey: 'magnet'`，Ø18 用 `sizeKey: 'magnet18'`。
3. 新組別在 `GROUPS` 加一筆（例如 `mellow: { label: 'MELLOW', note: 'Ø13' }`），新顏色在 `COLORS` 加名稱。

PNG 四周的透明留白會自動排除，不會影響實際尺寸。

## 生活小物（非 POINTITI）

選單第五個分頁「生活小物」，依固定方式分三組，每一組都要搭配 POINTITI 商品才放得上門：

| 固定方式 | 小物 |
|---|---|
| 用磁鐵固定（紙類） | 便條紙、明星小卡、拍立得、春聯斗方「福」、垃圾車時間、演唱會門票、手搖飲菜單、繳費通知單、小孩的畫、毛孩照片、減肥宣言 |
| 掛在掛鉤 | 鑰匙、平安符、折疊傘、環保袋、安全帽、珍奶提袋、口罩、狗狗牽繩、漁夫帽 |
| 放進收納盒 | 冷氣遙控器、發票、紅包、大信件（限 L 盒）、小信件（限 S 盒） |
| 鏡子置物槽 | 簽字筆、酒精噴瓶、口紅、護唇膏、耳機盒、香水、手機 |

- 紙類放上門後 10 秒內要用小圓磁鐵吸住，否則會掉下來；磁鐵被移走 3 秒後也會掉。
- 每個掛鉤掛 1 件，每個收納盒最多放 2 件；鏡子置物槽的物品橫放，依長度排列，前後最多 3 排，放滿為止。
- 掛鉤的圓形底座也是磁鐵：把掛鉤拖到紙類上、讓底座壓住紙，就能固定它（掛鉤仍然可以掛東西）。
  底座位置設定在 `src/config/objects.js` 的 `ATTACH.hookMagnet`；置物槽位置在 `ATTACH.mirrorShelf`。
- 「重要提醒！」事件依原規格，仍需要小圓磁鐵固定便條紙才算成功。
- 圖片在 `public/assets/objects/deco/`（SVG 示意圖，可換成去背 PNG），清單與尺寸在 `src/config/objects.js` 的 `DECO`。
- 隱藏彩蛋只計算 POINTITI 商品，生活小物不影響判定。

## 玄關人格稱號

- 按「完成佈置」時，依門上的配件、生活小物、擺放位置判定稱號，共 63 個，分 N／R／SR／SSR／SSS 五個稀有度。
- 顯示最稀有的一個；同時符合多個可以按「換稱號」切換。稱號會畫在分享圖下方。
- 拿過的稱號收進「稱號圖鑑」（上方 ★ 按鈕），沒拿到的只顯示稀有度和「？？？」。
- 「被大門選中的人」（SSS）每次完成佈置有 1% 機率隨機出現；「被貓咪認證的門」「外送之神眷顧者」（SSS）在完成對應的超稀有事件時頒發。
- 稱號、說明、條件全部在 `src/config/personas.js`，條件用到的統計資料在 `src/lib/personas.js`。

## 鏡頭與縮放

- 開場取景會放大到門的中段（畫面寬度約放下整扇門寬），物品看起來比較大；設定在 `src/config/scene.js` 的 `startView`。
- 雙指縮放、雙擊門上空白處（放大 ↔ 整扇門）、右上 ⤢ 按鈕看整扇門。
- 拖曳物品（從選單或門上）停在畫面邊緣約 0.3 秒，鏡頭會自動往那邊移；設定在 `edgePan`。

## 預設範本

- 下方「範本」按鈕可以一鍵套用 6 種已擺好的大門（機車通勤族、追星應援門、奶油系玄關、毛孩之家、出門前三分鐘、月底精算師），套用後可以自由修改。
- 範本上的 POINTITI 配件不計入隱藏彩蛋（避免一鍵拿到 NT$100），玩家自己加上去的才算；稱號與 NT$50「第一次完成佈置」照常判定。
- 範本內容在 `src/config/templates.js`（場景座標），縮圖在 `public/assets/templates/`。

## 突發事件

- 自由裝飾時約每 45～90 秒隨機出現一次；拖曳中、開著視窗時不會打斷，也不會連續出現同一個事件。
- 事件文字、秒數在 `src/config/events.js`；包包、遙控器、便條紙、門鈴畫面的圖片在 `public/assets/objects/`。
  目前是 SVG 示意圖，換成去背 PNG 時改 `src/config/objects.js` 的 `img` 路徑即可。
- 掛鉤掛包包的位置、收納盒前板高度等比例設定在 `src/config/objects.js` 的 `ATTACH`。
- 成功的事件會記錄在 localStorage（第四階段 NT$80 獎勵使用）。
- 超稀有事件：每次觸發事件有 4% 機率改成「鄰居的貓跑來了！」（點貓咪 3 下）或「外送員送錯門！」（把珍奶掛到掛鉤上）。
  機率在 `EVENT_SETTINGS.rareChance`；開發測試面板可以直接觸發。

## 隱藏彩蛋

- 條件只計算門上「玩家自己放的」POINTITI 商品（範本配件不算）；件數門檻、小鴨與串燈的位置在 `src/config/eggs.js`。
- 首次解鎖才播放動畫；「重置佈置」不會清除彩蛋紀錄。
- 小鴨（`public/assets/effects/duck.svg`）只在「奶油色小鴨」條件成立時出現；「完美玄關」成立時門框上方會亮起串燈。

## 雙 11 獎勵與作品圖片

- 金額、條件、開始日期、最低消費、折扣碼、是否顯示折扣碼，全部在 `src/config/rewards.js`。
- 第一版 `showCode: false`：只顯示「折扣碼即將公布」，沒有假折扣碼、也沒有複製按鈕。
  拿到正式 Shopify 折扣碼後，把各級的 `code` 填好、`showCode` 改成 `true`，就會顯示折扣碼和複製按鈕。
- 前端的折扣碼無法保密、也無法防止重複領取；使用次數、期限、不可併用等限制請在 Shopify 後台設定。
- 「完成佈置」會產生 1080 × 1920 的圖片（背景＋門上物件＋標題，不含選單）。
  手機會開啟系統分享（可存相簿、分享到 IG），電腦會直接下載；也可以長按圖片儲存。
  圖片上的標題、隨機分享文案、標記帳號（目前是 @smooch_home）都在 `src/config/share.js`，客人可以按「換一句」換文案。

## 開發測試模式

- 網址加上 `?dev=1`，或在遊戲中**連點標題 5 下**開啟。
- 可手動觸發四種事件、查看倒數秒數、暫停自動觸發；測試彩蛋與獎勵解鎖畫面、查看優惠進度。
- 可調整：大門實際寬度、門扇範圍、吸附區域、禁放區、門鈴螢幕位置、各商品尺寸與換算方式。
- 調好後按「匯出設定 JSON」，貼到 `src/config/overrides.json`。
- 正式公開時把 `src/config/app.js` 的 `devModeEnabled` 改成 `false`。

## 操作

- 從下方選單往上拖曳商品到門上，放開就會「啪」地吸住；點一下商品卡片則直接吸到畫面中央。
- 門上的商品可拖曳移動；點選後可「移到最前」或「移除」；拖回下方選單也能移除。
- 點鏡子會播放整理儀容的閃光。
- 掛在掛鉤上的包包、收納盒裡的遙控器、磁鐵固定的便條紙，都會跟著商品一起移動；點選後可以取下／取出。
- 便條紙上的磁鐵全部移走後，便條紙會掉下來。
- 右上角 ＋／－ 或雙指捏合可放大大門，方便放置小圓磁鐵。
