// ─────────────────────────────────────────────────────────────
// 玄關人格稱號
// 「完成佈置」時依門上的東西判定，取最稀有的一個顯示在分享圖上；
// 符合多個時可以切換。所有拿過的稱號會收進「稱號圖鑑」。
//
// test(s) 的 s 是門上的統計資料（見 src/lib/personas.js 的 doorStats）：
//   s.total 物件總數、s.has('deco-xxx') 有沒有某個生活小物、
//   s.hooks / s.mirrors / s.magnets / s.pockets 各類 POINTITI 數量、
//   s.colorCount 商品顏色數、s.magnetColors 磁鐵顏色數、s.butter Butter 件數 …
// ─────────────────────────────────────────────────────────────

export const RARITIES = {
  SSS: { rank: 5, label: 'SSS', name: '傳說' },
  SSR: { rank: 4, label: 'SSR', name: '超稀有' },
  SR: { rank: 3, label: 'SR', name: '稀有' },
  R: { rank: 2, label: 'R', name: '少見' },
  N: { rank: 1, label: 'N', name: '普通' },
};

export const LUCKY_CHANCE = 0.01; // 「被大門選中的人」隨機出現機率（門上至少 3 件時）

export const PERSONAS = [
  // ── SSS 傳說 ──
  { id: 'lucky', rarity: 'SSS', title: '被大門選中的人', desc: '這個稱號只有極少數人抽得到，今天去買張彩券吧', test: (s) => s.lucky },
  // 這兩個在「超稀有事件」成功當下直接頒發（award = 事件 id），不參與完成佈置的判定
  { id: 'catdoor', rarity: 'SSS', title: '被貓咪認證的門', desc: '鄰居的貓親自來按讚，這扇門有貓味', award: 'cat', test: () => false },
  { id: 'delivery', rarity: 'SSS', title: '外送之神眷顧者', desc: '外送員送錯門都送到你家，門口風水一定很好', award: 'delivery', test: () => false },
  { id: 'cosmos', rarity: 'SSS', title: '宇宙級玄關總監', desc: '四種配件到齊、生活小物 8 件以上，你的門比你的房間還精彩', test: (s) => s.allCats && s.decoCount >= 8 },
  { id: 'magnetgod', rarity: 'SSS', title: '磁鐵之神', desc: '門上 15 顆以上磁鐵，冰箱看了都自卑', test: (s) => s.magnets >= 15 },
  { id: 'butterverse', rarity: 'SSS', title: '奶油宇宙創世神', desc: '整扇門奶油到可以直接抹吐司', test: (s) => s.allButter && s.butter >= 6 },
  { id: 'butler', rarity: 'SSS', title: '一門到底全能管家', desc: '掛鉤沒一個閒著、收納盒塞好塞滿、鏡子槽也放滿，家事神人', test: (s) => s.hooks >= 3 && s.hooksAllUsed && s.pockets >= 1 && s.pocketsAllFull && s.shelf >= 4 },

  // ── SSR 超稀有 ──
  { id: 'guardian', rarity: 'SSR', title: '玄關守護神', desc: '平安符加上福字，小偷經過都要先拜一下', test: (s) => s.has('deco-amulet') && s.has('deco-fu') },
  { id: 'fanclub', rarity: 'SSR', title: '頭號應援團長', desc: '小卡上門、門票收好，搶票手速全台前三', test: (s) => s.has('deco-photocard') && s.has('deco-ticket') },
  { id: 'rider', rarity: 'SSR', title: '機車通勤戰士', desc: '安全帽、雨傘、鑰匙一次備齊，午後雷陣雨也嚇不倒你', test: (s) => s.has('deco-helmet') && s.has('deco-umbrella') && s.has('deco-keys') },
  { id: 'rainbow6', rarity: 'SSR', title: '人體彩虹製造機', desc: '門上 6 種顏色的磁鐵，路人以為你家在辦活動', test: (s) => s.magnetColors >= 6 },
  { id: 'mono5', rarity: 'SSR', title: '同色系強迫症末期', desc: '5 件以上全部同一個顏色，連空氣都要配色', test: (s) => s.products >= 5 && s.colorCount === 1 },
  { id: 'storage', rarity: 'SSR', title: '收納魔人', desc: '兩個以上收納盒全部塞滿，東西都有家，只有你常常不在家', test: (s) => s.pockets >= 2 && s.pocketsAllFull },
  { id: 'intel', rarity: 'SSR', title: '社區情報中心', desc: '垃圾車時間、便條紙、信件全在門上，里長想找你接班', test: (s) => s.has('deco-garbage') && s.has('deco-note') && (s.has('deco-letters') || s.has('deco-letter-small')) },
  { id: 'threemin', rarity: 'SSR', title: '出門前三分鐘戰神', desc: '鑰匙、耳機、口紅都在門口，五秒出門不是夢', test: (s) => s.has('deco-keys') && s.has('deco-earbuds') && s.has('deco-lipstick') },
  { id: 'diet87', rarity: 'SSR', title: '減肥從明天開始（第 87 次）', desc: '減肥宣言跟珍奶掛在同一扇門上，非常有自知之明', test: (s) => s.has('deco-diet') && s.has('deco-bubbletea') },
  { id: 'petbutler', rarity: 'SSR', title: '毛孩的專屬管家', desc: '毛孩照片、牽繩都準備好了，這個家主子最大', test: (s) => s.has('deco-petphoto') && s.has('deco-leash') },
  { id: 'monthend', rarity: 'SSR', title: '月底精算師', desc: '繳費單和發票收在一起，對完獎才決定這個月吃什麼', test: (s) => s.has('deco-bill') && s.has('deco-receipts') },
  { id: 'sugar', rarity: 'SSR', title: '全糖人生代言人', desc: '珍奶掛門口、菜單貼門上，血液裡流的是黑糖', test: (s) => s.has('deco-bubbletea') && s.has('deco-drinkmenu') },
  { id: 'hookpaper', rarity: 'SSR', title: '掛鉤多工大師', desc: '用掛鉤壓住紙、同時還掛著東西，一個掛鉤當三個用', test: (s) => s.hookPinnedWithItem },

  // ── SR 稀有 ──
  { id: 'mirrors2', rarity: 'SR', title: '鏡子成癮患者', desc: '門上兩面以上鏡子，出門前要跟自己確認三次', test: (s) => s.mirrors >= 2 },
  { id: 'hooks4', rarity: 'SR', title: '掛鉤收藏家', desc: '四個以上掛鉤，門快變成曬衣架了', test: (s) => s.hooks >= 4 },
  { id: 'makeup', rarity: 'SR', title: '電梯完妝專家', desc: '口紅、護唇膏都在門口，搭電梯就能完妝', test: (s) => s.has('deco-lipstick') && s.has('deco-balm') },
  { id: 'clean', rarity: 'SR', title: '防疫模範生', desc: '酒精噴瓶隨時待命，門把都比你的手乾淨', test: (s) => s.has('deco-spray') },
  { id: 'eco', rarity: 'SR', title: '環保小尖兵', desc: '環保袋掛門上，結帳終於不用再加購塑膠袋', test: (s) => s.has('deco-ecobag') },
  { id: 'lottery', rarity: 'SR', title: '對獎人生', desc: '發票收在門口，千萬獎金離你只有一扇門', test: (s) => s.has('deco-receipts') },
  { id: 'garbage', rarity: 'SR', title: '垃圾車追車選手', desc: '時刻表貼門上，聽到音樂就能百米衝刺', test: (s) => s.has('deco-garbage') },
  { id: 'rain', rarity: 'SR', title: '午後雷陣雨預言家', desc: '傘掛在門口，天氣預報都沒你準', test: (s) => s.has('deco-umbrella') },
  { id: 'bias', rarity: 'SR', title: '本命住我家門口', desc: '每天出門前先跟本命說早安', test: (s) => s.has('deco-photocard') },
  { id: 'memory', rarity: 'SR', title: '回憶錄作家', desc: '拍立得用兩顆以上磁鐵固定，回憶要黏牢一點', test: (s) => s.pinnedBy('deco-polaroid') >= 2 },
  { id: 'cny', rarity: 'SR', title: '過年提早到', desc: '11 月就貼福字，比百貨公司還早', test: (s) => s.has('deco-fu') },
  { id: 'amulet', rarity: 'SR', title: '平安符加持中', desc: '門口有神明罩，出門抽卡都比較順', test: (s) => s.has('deco-amulet') },
  { id: 'party', rarity: 'SR', title: '門上開派對', desc: '門上 15 件以上，這扇門的行程比你還滿', test: (s) => s.total >= 15 },
  { id: 'low', rarity: 'SR', title: '膝蓋高度美學', desc: '全部放在門的下半部，是要給貓咪看的嗎', test: (s) => s.total >= 3 && s.allLow },
  { id: 'high', rarity: 'SR', title: '天花板觀察家', desc: '全部放在門的最上面，踮腳尖也是一種運動', test: (s) => s.total >= 3 && s.allHigh },
  { id: 'boba', rarity: 'SR', title: '手搖飲續命人', desc: '珍奶掛門口，出門前先吸一口', test: (s) => s.has('deco-bubbletea') },
  { id: 'fridge', rarity: 'SR', title: '把大門當冰箱門的人', desc: '小孩的畫貼上去，這扇門正式升格為家庭美術館', test: (s) => s.has('deco-drawing') },
  { id: 'petlover', rarity: 'SR', title: '毛孩控', desc: '門上放毛孩照片，回家第一眼先看牠', test: (s) => s.has('deco-petphoto') },
  { id: 'walk', rarity: 'SR', title: '遛狗時間到', desc: '牽繩掛門口，狗狗一聽到開門聲就開始轉圈', test: (s) => s.has('deco-leash') },
  { id: 'fan', rarity: 'SR', title: '搶票戰士', desc: '演唱會門票收在門口，這張比身分證還重要', test: (s) => s.has('deco-ticket') },
  { id: 'rider1', rarity: 'SR', title: '安全帽不離身', desc: '安全帽掛門口，騎車族的基本禮儀', test: (s) => s.has('deco-helmet') },

  // ── R 少見 ──
  { id: 'keys', rarity: 'R', title: '鑰匙終於找得到', desc: '再也不用出門前翻遍全身口袋', test: (s) => s.has('deco-keys') },
  { id: 'remote', rarity: 'R', title: '遙控器終於有家', desc: '冷氣遙控器不再失蹤，全家恢復和平', test: (s) => s.has('obj-remote') },
  { id: 'note', rarity: 'R', title: '便條紙人生', desc: '人生大小事都靠便條紙提醒', test: (s) => s.has('deco-note') || s.has('obj-note') },
  { id: 'earbuds', rarity: 'R', title: '耳機不再失蹤', desc: '出門前終於不用找耳機找十分鐘', test: (s) => s.has('deco-earbuds') },
  { id: 'minimal', rarity: 'R', title: '極簡主義信徒', desc: '門上只放一兩件，留白也是一種態度', test: (s) => s.total >= 1 && s.total <= 2 },
  { id: 'colorful', rarity: 'R', title: '配色大冒險家', desc: '門上 5 種以上顏色，色彩學老師看了沉默', test: (s) => s.colorCount >= 5 },
  { id: 'butter2', rarity: 'R', title: '奶油控初心者', desc: 'Butter 色已經悄悄佔領你的門', test: (s) => s.butter >= 2 },
  { id: 'magnetonly', rarity: 'R', title: '磁鐵單推人', desc: '門上只有小圓磁鐵，專一是一種美德', test: (s) => s.magnets >= 1 && s.products === s.magnets && s.decoCount === 0 },
  { id: 'onemirror', rarity: 'R', title: '鏡子只是用來照的', desc: '一面鏡子就夠了，重點是人要好看', test: (s) => s.total === 1 && s.mirrors === 1 },
  { id: 'hongbao', rarity: 'R', title: '紅包等很久', desc: '11 月就在準備過年紅包，非常有遠見', test: (s) => s.has('deco-hongbao') },
  { id: 'hat', rarity: 'R', title: '漁夫帽潮人', desc: '漁夫帽掛門口，出門帥度直接加 50', test: (s) => s.has('deco-hat') },
  { id: 'mask', rarity: 'R', title: '口罩戴好戴滿', desc: '口罩隨手拿，感冒季也不怕', test: (s) => s.has('deco-mask') },
  { id: 'perfume', rarity: 'R', title: '香香出門派', desc: '出門前噴一下，電梯裡都是你的味道', test: (s) => s.has('deco-perfume') },
  { id: 'phone', rarity: 'R', title: '手機在哪？在門上', desc: '手機放鏡子槽，終於不會出門才發現沒帶', test: (s) => s.has('deco-phone') },
  { id: 'letters', rarity: 'R', title: '信箱代理人', desc: '信先收在門口，帳單晚點再面對', test: (s) => s.has('deco-letters') || s.has('deco-letter-small') },
  { id: 'menu', rarity: 'R', title: '飲料店常客', desc: '菜單貼門上，店員已經認得你的聲音', test: (s) => s.has('deco-drinkmenu') },
  { id: 'bill', rarity: 'R', title: '帳單面對者', desc: '把繳費單貼門上，勇氣可嘉', test: (s) => s.has('deco-bill') },
  { id: 'diet', rarity: 'R', title: '立志減肥中', desc: '宣言貼好了，剩下的明天再說', test: (s) => s.has('deco-diet') },
  { id: 'polaroid', rarity: 'R', title: '回憶收藏家', desc: '把旅行照片貼在每天都看得到的地方', test: (s) => s.has('deco-polaroid') },

  // ── N 普通 ──
  { id: 'moving', rarity: 'N', title: '剛搬家還沒拆箱', desc: '門上東西不多，箱子應該還在客廳', test: (s) => s.total >= 1 && s.total <= 3 },
  { id: 'newbie', rarity: 'N', title: '玄關新手村村民', desc: '一切才剛開始，下一扇門會更精彩', test: (s) => s.total >= 1 },
  { id: 'empty', rarity: 'N', title: '空門之人', desc: '什麼都沒放，門很乾淨，心也很乾淨', test: (s) => s.total === 0 },
];
