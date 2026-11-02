// ─────────────────────────────────────────────────────────────
// 第二階段：隨機突發事件
// ─────────────────────────────────────────────────────────────

export const EVENT_SETTINGS = {
  autoTrigger: true, // 自動觸發（開發面板可暫時關閉）
  firstDelaySec: [15, 25], // 進入遊戲後第一次事件
  intervalSec: [25, 45], // 之後每隔 25～45 秒隨機一次
  afterSkipSec: [40, 70], // 按「稍後再說」後，間隔拉長一點
  quietMs: 1500, // 玩家停手 1.5 秒後才出現，不打斷正在進行的操作
  resultMs: 2600, // 成功／失敗畫面停留時間
  rareChance: 0.04, // 每次觸發事件時，出現「超稀有事件」的機率（4%）
};

export const EVENTS = [
  {
    id: 'bag',
    no: '01',
    title: '朋友借放包包！',
    seconds: 8,
    story: '朋友來家裡，手上拿著包包，想找個地方掛。',
    steps: ['從選單把磁吸掛鉤吸到門上', '把朋友的包包拖到掛鉤上'],
    shortcut: '門上已經有掛鉤的話，直接掛就可以！',
    hint: '把包包拖到掛鉤上',
    tab: 'hook',
    spawn: 'bag',
    success: '好險有地方放！',
    fail: '包包只好先放地上了。',
  },
  {
    id: 'friend',
    no: '02',
    title: '朋友到了！',
    seconds: 5,
    story: '叮咚！門邊的智慧門鈴螢幕亮了，朋友就站在門外。',
    steps: ['把磁吸鏡子吸到門上', '點一下鏡子整理儀容'],
    shortcut: '門上已經有鏡子的話，直接點鏡子！',
    hint: '點一下鏡子整理儀容',
    tab: 'mirror',
    doorbell: true,
    success: '你今天看起來不錯耶！',
    fail: '你還在準備喔 😂',
  },
  {
    id: 'note',
    no: '03',
    title: '重要提醒！',
    seconds: 8,
    story: '明天要出門寄貨，怕自己忘記。',
    banner: '明天記得寄貨！',
    steps: ['把提醒便條紙放到門上', '選一顆小圓磁鐵，吸在便條紙上固定'],
    hint: '磁鐵要吸在便條紙上',
    tab: 'magnet',
    spawn: 'note',
    zoom: 1.8, // 便條紙和磁鐵比較小，開始時自動放大
    success: '這下不會忘記了！',
    fail: '明天應該還記得吧……',
  },
  {
    id: 'remote',
    no: '04',
    title: '遙控器沒地方放！',
    seconds: 8,
    story: '正準備出門，發現冷氣遙控器還放在玄關櫃上。',
    steps: ['把磁吸收納盒吸到門上', '把玄關櫃上的遙控器拖進收納盒'],
    shortcut: '門上的收納盒有空位的話，直接放進去！',
    hint: '把遙控器拖進收納盒',
    tab: 'storage',
    spawn: 'remote',
    success: '玄關整齊多了！',
    fail: '遙控器又不知道要放哪了。',
  },
  // ── 超稀有事件（rare: true）──
  {
    id: 'cat',
    no: '★',
    rare: true,
    title: '鄰居的貓跑來了！',
    seconds: 6,
    story: '門口傳來喵～的一聲，鄰居家的貓溜到你家門口，牠只給你幾秒鐘。',
    steps: ['點貓咪 3 下，摸摸牠'],
    hint: '快點貓咪 3 下！',
    spawn: 'cat',
    taps: 3,
    success: '貓咪對你翻肚了！',
    fail: '貓咪頭也不回地走了……',
  },
  {
    id: 'delivery',
    no: '★',
    rare: true,
    title: '外送員送錯門！',
    seconds: 8,
    story: '叮咚！外送員把隔壁的珍奶送到你家了，先幫鄰居掛好，等等他來拿。',
    steps: ['把珍奶提袋掛到掛鉤上'],
    shortcut: '門上沒有空的掛鉤，就趕快再吸一個！',
    hint: '把珍奶掛到掛鉤上',
    tab: 'hook',
    doorbell: true,
    doorbellImg: 'assets/objects/delivery.svg',
    spawn: 'delivery',
    success: '鄰居說謝謝，還請你喝一杯！',
    fail: '珍奶的冰塊都融化了……',
  },
];
export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
