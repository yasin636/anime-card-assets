    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
    import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
    import {
      getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged,
      createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
    } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
    import {
      getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc,
      collection, query, orderBy, limit, onSnapshot, runTransaction,
      serverTimestamp, Timestamp
    } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "REDACTED_FIREBASE_CONFIG",
      authDomain: "anime-meta-hub.firebaseapp.com",
      projectId: "anime-meta-hub",
      storageBucket: "anime-meta-hub.firebasestorage.app",
      messagingSenderId: "400952449667",
      appId: "1:400952449667:web:09f273f7d0ab2c42b9d9b6",
      measurementId: "G-PZ4HZVXZGD"
    };

    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const API_KEY = "REDACTED_ROTATE_BEFORE_USE";
    const MODEL   = "llama-3.3-70b-versatile";

    const app = initializeApp(firebaseConfig);
    analyticsSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});
    const auth = getAuth(app);
    const db   = getFirestore(app);

    /* ── Avatars ── */
    const AVATARS = [
      "https://api.dicebear.com/7.x/adventurer/svg?seed=Gojo",
      "https://api.dicebear.com/7.x/adventurer/svg?seed=Naruto",
      "https://api.dicebear.com/7.x/adventurer/svg?seed=Levi",
      "https://api.dicebear.com/7.x/adventurer/svg?seed=Luffy",
      "https://api.dicebear.com/7.x/adventurer/svg?seed=Sukuna"
    ];

    /* ── Cards Database — stats from card images (hp, atk, def per card art) ── */
    const cardsList = [
      // ── Legendary ──
      // Gojo: card image stats (update when you have exact values)
      { id:"gojo",    name:"Gojo Satoru",    rarity:"legendary", hp:850,  atk:5500, def:950,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774203370787_with_bgc.png" },
      // Sukuna: HP:770 ATK:6000 DEF:1100 — CONFIRMED from card image
      { id:"sukuna",  name:"Sukuna",          rarity:"legendary", hp:770,  atk:6000, def:1100,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774203030221_with_bgc.png" },
      { id:"itachi",  name:"Itachi Uchiha",   rarity:"legendary", hp:800,  atk:5800, def:1000,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774203741448_with_bgc.png" },
      // Tanjiro: HP:650 ATK:5100 DEF:790 — from card visible in screenshot
      { id:"tanjiro", name:"Tanjiro Kamado",  rarity:"legendary", hp:650,  atk:5100, def:790,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774204509259_with_bgc.png" },
      { id:"jinwoo",  name:"Sung Jinwoo",     rarity:"legendary", hp:900,  atk:5800, def:1050,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/gpt-image-1.5-high-fidelity_a_Good_good_very_good__with_bgc.png" },
      // ── Rare ──
      // Izuku: HP:980 ATK:2150 DEF:1095 — from card visible in screenshot
      { id:"deku",    name:"Izuku Midoriya",  rarity:"rare", hp:980,  atk:2150, def:1095,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774206242811_with_bgc.png" },
      { id:"kaiju8",  name:"Kaiju No.8",      rarity:"rare", hp:920,  atk:2200, def:1000,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774205057103_with_bgc.png" },
      // Denji: HP:600 ATK:1540 DEF:875 — from card visible in screenshot
      { id:"denji",   name:"Denji",           rarity:"rare", hp:600,  atk:1540, def:875,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774203535944_with_bgc.png" },
      { id:"subaru",  name:"Subaru Natsuki",  rarity:"rare", hp:850,  atk:1800, def:900,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774204785975_with_bgc.png" },
      { id:"okarun",  name:"Okarun",          rarity:"rare", hp:750,  atk:1900, def:850,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774205542394_with_bgc.png" },
      // ── Common ──
      { id:"yojinhoo",name:"Yo Jin Hoo",      rarity:"common", hp:800,  atk:202,  def:100,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/gpt-image-1.5-high-fidelity_a______with_bgc.png" },
      { id:"kanao",   name:"Kanao Tsuyuri",   rarity:"common", hp:750,  atk:190,  def:95,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/gpt-image-1.5-high-fidelity_a_Good_good_very_good__with_bgc%20(1).png" },
      { id:"yuji",    name:"Yuji Itadori",    rarity:"common", hp:820,  atk:210,  def:90,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/gpt-image-1.5-high-fidelity_a_Good_good_very_good__1_with_bgc.png" },
      { id:"hinata",  name:"Hinata Hyuga",    rarity:"common", hp:700,  atk:180,  def:110,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774207401932_with_bgc.png" },
      { id:"ochako",  name:"Ochako Uraraka",  rarity:"common", hp:720,  atk:185,  def:105,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774207386177_with_bgc.png" },
      { id:"kiba",    name:"Kiba Inuzuka",    rarity:"common", hp:780,  atk:195,  def:95,
        image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/1774207302454_with_bgc.png" }
    ];
    const SLOT_IDS = ["legendary-1","legendary-2","rare-1","rare-2","common-1","common-2"];

    /* ── RARITY FALLBACK stats (used only if card has no embedded stats) ── */
    const RARITY_STATS_FALLBACK = {
      legendary: { hp:1800, atk:600, def:300 },
      rare:      { hp:1200, atk:400, def:200 },
      common:    { hp:800,  atk:260, def:140 }
    };
    /* Reads REAL stats from card object first, falls back to rarity table */
    function getCardStats(card){
      if(card?.hp && card?.atk && card?.def) return { hp:card.hp, atk:card.atk, def:card.def };
      const base = cardsList.find(c=>c.id===card?.id);
      if(base?.hp) return { hp:base.hp, atk:base.atk, def:base.def };
      return RARITY_STATS_FALLBACK[card?.rarity]||RARITY_STATS_FALLBACK.common;
    }

    /* ── Battle constants ── */
    const BATTLE_ENTRY_FEE   = 400;
    const BATTLE_MIN_CARDS   = 3;
    const BATTLE_WIN_GOLD    = 800; const BATTLE_WIN_GEMS  = 10; const BATTLE_WIN_XP   = 30;
    const BATTLE_LOSE_GOLD   = 200; const BATTLE_LOSE_GEMS = 2;  const BATTLE_LOSE_XP  = 10;

    /* ── Premium Themes ── */
    const THEMES = [
      { id:"dragonball", name:"Dragon Ball",      price:5000, cssClass:"theme-dragonball", emoji:"🔥", desc:"Yellow-Orange Fire Aura",    gradient:"linear-gradient(135deg,#ff6a00,#ee0979,#ff6a00)" },
      { id:"onepiece",   name:"One Piece",         price:4000, cssClass:"theme-onepiece",   emoji:"🌊", desc:"Cyan Water Wave Effect",     gradient:"linear-gradient(135deg,#00c6ff,#0072ff,#00c6ff)" },
      { id:"naruto",     name:"Naruto",            price:3500, cssClass:"theme-naruto",     emoji:"🌀", desc:"Red-Orange Chakra Glow",     gradient:"linear-gradient(135deg,#ff4500,#ff8c00,#ff4500)" },
      { id:"bleach",     name:"Bleach",            price:2500, cssClass:"theme-bleach",     emoji:"💜", desc:"Black-Purple Reiatsu Smoke", gradient:"linear-gradient(135deg,#4a0072,#7b00d4,#200040)" },
      { id:"aot",        name:"Attack on Titan",   price:2000, cssClass:"theme-aot",        emoji:"⚙️", desc:"Steam Shake Effect",         gradient:"linear-gradient(135deg,#2c3e50,#4a6741,#2c3e50)" },
      { id:"opm",        name:"One Punch Man",     price:1000, cssClass:"theme-opm",        emoji:"⚡", desc:"Yellow Impact Sparkle",      gradient:"linear-gradient(135deg,#f7ff00,#db36a4,#f7ff00)" },
      { id:"vinland",    name:"Vinland Saga",      price:1000, cssClass:"theme-vinland",    emoji:"❄️", desc:"Soft Snowfall Effect",       gradient:"linear-gradient(135deg,#74b9ff,#a29bfe,#74b9ff)" }
    ];

    /* ── Consts ── */
    const LEVEL_CAP         = 100;
    const DAY_MS            = 24*60*60*1000;
    const ONLINE_WINDOW_MS  = 70000;
    const SPIN_COST         = 20;          // wheel spin cost (XP)
    const BOX_COST_GOLD     = 500;         // gacha cost: 500 Gold per pull
    const PITY_RARE         = 10;          // guaranteed Rare at 10th pull
    const PITY_LEGENDARY    = 21;          // guaranteed Legendary at 21st pull
    const NEWS_XP_PER_READ  = 10;
    const NEWS_MAX_DAILY    = 5;
    const NEWS_READ_SECONDS = 10;
    const QUIZ_TOTAL_QUESTIONS = 5;
    const QUIZ_XP_CORRECT   =  10;
    const QUIZ_XP_WRONG     = -10;
    const QUIZ_XP_SKIP      = -15;

    /* ── Badge / Gems ── */
    const BADGE_LEVELS = [
      { gems:2000, key:"mythic",  label:"🌈 Mythic Meta Hub",  glowClass:"glow-mythic",  badgeClass:"badge-mythic"  },
      { gems:1000, key:"diamond", label:"💎 Diamond Rinnegan", glowClass:"glow-diamond", badgeClass:"badge-diamond" },
      { gems: 600, key:"gold",    label:"❤️ Golden Shuriken",  glowClass:"glow-gold",    badgeClass:"badge-gold"    },
      { gems: 300, key:"silver",  label:"⚔️ Silver Katana",    glowClass:"glow-silver",  badgeClass:"badge-silver"  },
      { gems: 100, key:"copper",  label:"🗡️ Copper Kunai",     glowClass:"glow-copper",  badgeClass:"badge-copper"  },
    ];
    const getUserBadgeInfo  = gems => { const g=Number(gems||0); for(const l of BADGE_LEVELS){if(g>=l.gems)return l;} return null; };
    const getUserGlowClass  = gems => { const b=getUserBadgeInfo(gems); return b?b.glowClass:""; };
    const renderBadgeLabel  = gems => { const b=getUserBadgeInfo(gems); return b?`<span class="badge-label">${b.label}</span>`:""; };
    const getNextBadge      = gems => { const g=Number(gems||0); const s=[...BADGE_LEVELS].reverse(); for(const l of s){if(g<l.gems)return l;} return null; };

    /* ── Daily Missions ── */
    const MISSIONS = [
      { id:"m_news",      name:"📰 News Reader",       desc:"আজকে ৫টি anime news পড়ো",                    goal:5,  trackKey:"newsRead",        reward:{gold:70,  xp:20, gems:5}  },
      { id:"m_posts",     name:"✍️ Feed Poster",        desc:"Feed-এ ২টি post তৈরি করো",                   goal:2,  trackKey:"postsCreated",    reward:{gold:50,  xp:15, gems:5}  },
      { id:"m_social",    name:"👍 Social Butterfly",   desc:"অন্যদের ৫টি like ও ৫টি comment দাও",          goal:10, trackKey:"socialActions",   reward:{gold:50,  xp:20, gems:5}  },
      { id:"m_tracker",   name:"📺 Anime Collector",    desc:"Watchlist-এ ৩টি anime যোগ করো",               goal:3,  trackKey:"animeAdded",      reward:{gold:90,  xp:30, gems:8}  },
      { id:"m_community", name:"🌐 Community Champion", desc:"১টি global message পাঠাও এবং ২বার Quiz খেলো", goal:3,  trackKey:"communityActions",reward:{gold:250, xp:40, gems:10} }
    ];

    /* ── Wheel ── */
    const WHEEL_SLOTS = [
      { key:"lose",     label:"LOSE",     color:"#ef4444", icon:"💀" },
      { key:"x2",       label:"2x XP",    color:"#8b5cf6", icon:"⚡" },
      { key:"xp10",     label:"10 XP",    color:"#06b6d4", icon:"💎" },
      { key:"jackpot",  label:"JACKPOT",  color:"#f59e0b", icon:"👑" },
      { key:"bankrupt", label:"BANKRUPT", color:"#f43f5e", icon:"🔥" },
      { key:"xp50",     label:"50 XP",    color:"#22c55e", icon:"💰" },
      { key:"x3",       label:"3x XP",    color:"#a855f7", icon:"🌟" },
      { key:"free",     label:"FREE",     color:"#14b8a6", icon:"🎁" }
    ];

    /* ── helpers ── */
    const imageCache   = new Map();
    const root         = document.getElementById("app");
    const escapeHtml   = v => String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
    const cssBgUrl     = url => `url("${String(url).replaceAll('"',"%22")}")`;
    const fallbackAvatar = name => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name||"anime")}`;
    const todayKey     = () => new Date().toISOString().slice(0,10);
    const emptyProgress = () => ({ newsRead:0, postsCreated:0, socialActions:0, animeAdded:0, communityActions:0 });
    const emptyClaimed  = () => ({ m_news:false, m_posts:false, m_social:false, m_tracker:false, m_community:false });
    const getMissionGoal = key => { const m=MISSIONS.find(x=>x.trackKey===key); return m?m.goal:999; };

    /* ── Chapter Ranks ── */
    const CHAPTER_RANKS = { 1:"E-Rank", 2:"D/C-Rank", 3:"B-Rank", 4:"A-Rank", 5:"S-Rank ★ Shadow Monarch" };
    function getChapterRank(chId){ return CHAPTER_RANKS[chId]||"E-Rank"; }

    /* ── ARISE audio — preloaded ── */
    let _ariseAudio = null;
    function preloadAriseAudio(){
      if(!_ariseAudio){
        _ariseAudio = new Audio("https://files.catbox.moe/6rbexc.mp3");
        _ariseAudio.preload = "auto";
        _ariseAudio.load();
      }
    }
    function playAriseAudio(){
      try{
        if(!_ariseAudio) preloadAriseAudio();
        _ariseAudio.currentTime = 0;
        _ariseAudio.play().catch(()=>{});
      }catch{}
    }
    // Preload on first user interaction
    document.addEventListener("click", preloadAriseAudio, { once:true });

    /* ── Shadow Soldier collection (localStorage) ── */
    function getShadowArmy(){
      try{ return JSON.parse(localStorage.getItem("shadow_army")||"[]"); }catch{ return []; }
    }
    function addShadow(enemy){
      const army = getShadowArmy();
      if(!army.find(s=>s.id===enemy.id)){
        army.push({ id:enemy.id, name:enemy.name, image:enemy.image, hp:enemy.hp, atk:enemy.atk, def:enemy.def });
        try{ localStorage.setItem("shadow_army", JSON.stringify(army)); }catch{}
      }
    }

    /* ── Story isFirstClear helpers ── */
    function isFirstClearEnemy(enemyId){
      try{ return !localStorage.getItem(`cleared_${enemyId}`); }catch{ return true; }
    }
    function markEnemyCleared(enemyId){
      try{ localStorage.setItem(`cleared_${enemyId}`,"1"); }catch{}
    }

    /* ── Image resolution — cards now have direct URLs, fallback only ── */
    async function resolveCharacterImage(name){
      const card = cardsList.find(c=>c.name===name||c.id===name);
      if(card?.image) return card.image;
      return fallbackAvatar(name);
    }

    /* ── Firebase refs ── */
    const getMetaRef      = uid => doc(db,"user_meta",uid);
    const getActivityRef  = uid => doc(db,"post_activity",uid);
    const getPostRef      = id  => doc(db,"feed_posts",id);
    const getChatId       = (a,b) => [a,b].sort().join("_");
    const getChatMsgCol   = id  => collection(db,"direct_chats",id,"messages");
    const getChatRef      = id  => doc(db,"direct_chats",id);

    /* ── Admin badge helper ── */
    const ADMIN_NAME = "Yasin Arafat";
    function renderAdminBadge(username){
      if((username||"").trim()===ADMIN_NAME){
        return `<span class="admin-badge">👑 ADMIN</span>`;
      }
      return "";
    }

    /* ── XP / Level ── */
    function xpForLevel(lv){ if(lv<=10)return 50; if(lv<=20)return 80; if(lv<=60)return 300; if(lv<=80)return 650; if(lv<=90)return 850; return 1000; }
    function rankTitle(lv){ if(lv<=10)return"Genin (Beginner)"; if(lv<=20)return"Hunter (Active)"; if(lv<=40)return"Captain (Legend)"; if(lv<=60)return"Captain (Legend OP)"; if(lv<=80)return"Master (Legend OP)"; if(lv<=90)return"Grandmaster (Boss Stage)"; return"Demon King (Boss)"; }
    function rankClass(lv){ if(lv<=10)return"rank-genin"; if(lv<=20)return"rank-hunter"; if(lv<=40)return"rank-captain"; if(lv<=60)return"rank-captain-op"; if(lv<=80)return"rank-master"; if(lv<=90)return"rank-grandmaster"; return"rank-demonking"; }
    function getLevelInfo(rawXp){
      let xp=Math.max(0,Math.floor(Number(rawXp||0))); let lv=1;
      while(lv<LEVEL_CAP){ const n=xpForLevel(lv); if(xp>=n){xp-=n;lv++;}else break; }
      return{level:lv,title:rankTitle(lv),rankClass:rankClass(lv),xpIntoLevel:lv>=LEVEL_CAP?0:xp,xpForNextLevel:lv>=LEVEL_CAP?0:xpForLevel(lv)};
    }
    const lvFromXp = xp => getLevelInfo(xp).level;

    /* ── Cards ── */
    function normalizeCard(c,i=0){ const f=cardsList.find(x=>x.id===c?.id||x.name===c?.name)||cardsList[i%cardsList.length]; return{instanceId:c?.instanceId||`card-${Date.now()}-${i}`,id:f.id,name:f.name,rarity:f.rarity,image:c?.image||f.image||fallbackAvatar(f.name)}; }
    function normalizeInventory(cards){ if(!Array.isArray(cards))return[]; return cards.map((c,i)=>normalizeCard(c,i)); }
    function normalizeSlots(slots){ if(!slots||typeof slots!=="object")return{}; const o={}; SLOT_IDS.forEach(id=>{if(slots[id])o[id]=normalizeCard(slots[id]);}); return o; }

    /* ── Theme helpers ── */
    const getThemeById      = id => THEMES.find(t=>t.id===id)||null;
    const ownsTheme         = id => (state.profile.inventory?.themes||[]).includes(id);
    const getEquippedTheme  = ()  => state.profile.equippedTheme||"";
    const getThemeCssClass  = id  => { const t=getThemeById(id); return t?t.cssClass:""; };

    /* ══════════════════════════════════════════════
       STATE
    ══════════════════════════════════════════════ */
    const state = {
      authReady:false, currentUser:null, authMode:"login", authBusy:false, authError:"",
      activeTab:"profile",
      navMoreOpen:false,
      showImportModal:false, showAvatarPicker:false, isEditingName:false,
      animeSearch:"", toast:"",
      unsubscribers:[], presenceTimer:null, imagePatchBusy:false,

      profile:{
        uid:"",username:"",avatar:AVATARS[0],Bio:"",xp:0,level:1,
        gems:0, gold:0,
        tracker:[],recentChats:[],freeSpins:0,
        inventoryCards:[],equippedSlots:{},
        inventory:{ themes:[] },
        equippedTheme:"",
        last_claim_date:Timestamp.fromMillis(0),
        daily_read_count:0,last_read_date:""
      },

      missions:{ date:"", progress:emptyProgress(), claimed:emptyClaimed() },

      allUsers:[],leaderboard:[],inspectUser:null,
      chatSearchTerm:"",activeChatUserId:null,chatMessages:[],chatMessagesUnsub:null,chatInbox:[],inboxUnsub:null,unreadCounts:{},
      globalChatOpen:false,globalMessages:[],globalChatUnsub:null,
      posts:[],
      senseiMessages:[{role:"assistant",text:"I am your Anime Sensei. Ask me anything about anime, manga, and Japanese culture."}],
      senseiLoading:false,

      arena:{spinning:false,wheelRotation:0,lastResult:"Spin to test your luck.",resultTone:"neutral"},
      battle:{
        active:false,        // in battle screen
        phase:"select",      // select | coinToss | fight | ended
        rulesOpen:false,     // rules modal
        confirmOpen:false,   // confirm entry modal
        selectedCards:[],    // player picked cards (instanceIds)
        // Live battle data
        playerHP:0, playerDEF:0, playerCards:[],
        aiHP:0,    aiDEF:0,    aiCards:[],
        playerDEFmax:0, aiDEFmax:0,
        playerHPmax:0,  aiHPmax:0,
        turn:"player",       // "player" | "ai"
        turnNum:0,
        log:[],              // battle log entries
        playerDeck:[],       // cards yet to play (player)
        aiDeck:[],           // cards yet to play (ai)
        playerUsed:[],       // played player cards
        aiUsed:[],
        currentAiCard:null,
        animMsg:"",          // floating damage text
        animType:"",         // "dmg"|"shield"|"crit"
        shieldBroken:false,
        aiShieldBroken:false,
        winner:null,         // "player"|"ai"|null
        rewardClaimed:false
      },
      shop:{opening:false,lastPull:null,missionsOpen:false,themeStoreOpen:true,activeTab:'box',previewOpen:false,shaking:false,revealing:false},
      equip:{open:false,cardId:""},
      cardPreview:{open:false,card:null},
      feed:{posting:false, pendingMediaFile:null, pendingMediaPreview:"", pendingMediaType:"", pendingLink:"", showLinkInput:false, editingPostId:null, editingCommentId:null},
      postActivity: null,

      news:{modalOpen:false,loading:false,articles:[],readTimers:{},claimedIds:{},dailyCount:0,lastDate:""},
      quiz:{rulesOpen:false,open:false,animeName:"",animeInputTmp:"",questions:[],currentIndex:0,answers:[],loading:false,answerTmp:"",feedbackVisible:false,currentFeedback:null,resultVisible:false,totalXpEarned:0,gemsEarned:0},

      /* ── Story Mode ── */
      story:{
        active:false,            // story mode screen open
        phase:"map",             // map | rules | coinToss | dialogue | fight | victory | defeat
        chapter:null,            // current chapter object
        activeMapChapter:1,      // which chapter tab is selected on map
        rulesShownOnce:false,    // rules shown this session
        dialogue:[],             // current dialogue queue
        dialogueIdx:0,
        playerHP:0, playerHPmax:0, playerDEF:0, playerDEFmax:0, playerATK:0,
        enemyHP:0,  enemyHPmax:0,  enemyDEF:0,  enemyDEFmax:0,  enemyATK:0,
        playerName:"Jin-Woo",
        enemyName:"",
        animMsg:"",              // floating damage text
        animTarget:"",           // "player"|"enemy"
        playerShake:false,
        enemyShake:false,
        lastAction:"",
        rewardClaimed:false,
        permanentBonus:{ atk:0, hp:0, def:0 }, // % bonuses stored here
        // New combat mechanics
        coinTossResult:"",       // "PLAYER INITIATIVE" | "ENEMY INITIATIVE"
        firstAttacker:"",        // "player" | "enemy"
        heavyStrikeCooldown:0,   // turns remaining on cooldown
        guardActive:false,       // player guarded last turn
        enrageTriggered:false,   // boss rage triggered
        currentEnemyATK:0,       // tracks enemy atk (may change on enrage)
        // ARISE system
        ariseOpen:false,         // arise selection modal open
        selectedShadows:[],      // selected shadow ids
        ariseActive:false,       // shadows currently active in battle
        shadowBonusHP:0,
        shadowBonusATK:0,
        shadowBonusDEF:0,
      }
    };

    /* ── toast ── */
    const showToast = text => { state.toast=text; render(); setTimeout(()=>{if(state.toast===text){state.toast="";render();}},2500); };

    /* ══════════════════════════════════════════════
       CUSTOM NEON MODAL (replaces all alert/confirm)
    ══════════════════════════════════════════════ */
    function showNeonModal({ title="", body="", okText="✓ OK", cancelText="✗ Cancel", onOk=null, onCancel=null, okClass="modal-ok-btn", danger=false }){
      const existing = document.getElementById("neon-modal-overlay");
      if(existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "neon-modal-overlay";
      overlay.className = "neon-modal-overlay";

      const cancelHtml = cancelText
        ? `<button class="modal-cancel-btn" id="neon-modal-cancel">${cancelText}</button>` : "";

      overlay.innerHTML = `
        <div class="neon-modal-card ${danger?"neon-modal-danger":""}">
          ${title?`<div class="neon-modal-title">${title}</div>`:""}
          <div class="neon-modal-body">${body}</div>
          <div class="neon-modal-btns">
            ${cancelHtml}
            <button class="${okClass}" id="neon-modal-ok">${okText}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(()=>overlay.classList.add("visible"));

      const close = () => { overlay.classList.remove("visible"); setTimeout(()=>overlay.remove(),250); };
      document.getElementById("neon-modal-ok").onclick = ()=>{ close(); if(onOk) onOk(); };
      const cancelBtn = document.getElementById("neon-modal-cancel");
      if(cancelBtn) cancelBtn.onclick = ()=>{ close(); if(onCancel) onCancel(); };
      // close on backdrop click
      overlay.addEventListener("click", e=>{ if(e.target===overlay){ close(); if(onCancel) onCancel(); } });
    }

    /* ══════════════════════════════════════════════
       MUSIC LIBRARY + SFX SYSTEM
    ══════════════════════════════════════════════ */
    const MUSIC_PLAYLIST = [
      { id:"dark-aria",  title:"Dark Aria",      src:"https://files.catbox.moe/oogzjb.mp3" },
      { id:"tanjiro",    title:"Kamado Tanjiro",  src:"https://files.catbox.moe/hbnkwu.mp3" },
      { id:"suzume",     title:"Suzume",          src:"https://files.catbox.moe/viowx8.mp3" }
    ];

    const musicState = {
      enabled:   false,          // music on/off
      sfxEnabled:true,           // SFX on/off
      trackIdx:  0,              // current track index
      mode:      "continue",     // "repeat" | "continue"
      volume:    0.4,            // 0..1
      open:      false           // settings panel open
    };

    let _bgAudio = null;

    function bgMusicPlay(){
      if(!musicState.enabled) return;
      const track = MUSIC_PLAYLIST[musicState.trackIdx];
      if(!_bgAudio){
        _bgAudio = new Audio(track.src);
        _bgAudio.volume = musicState.volume;
        _bgAudio.onended = ()=>{
          if(musicState.mode==="repeat"){ _bgAudio.currentTime=0; _bgAudio.play().catch(()=>{}); }
          else { musicState.trackIdx=(musicState.trackIdx+1)%MUSIC_PLAYLIST.length; bgMusicPlay(); }
        };
      } else {
        _bgAudio.src = track.src;
        _bgAudio.volume = musicState.volume;
      }
      _bgAudio.play().catch(()=>{});
    }
    function bgMusicPause(){ if(_bgAudio){ _bgAudio.pause(); } }
    function bgMusicToggle(){
      musicState.enabled = !musicState.enabled;
      if(musicState.enabled) bgMusicPlay(); else bgMusicPause();
      renderMusicPanel();
    }
    function bgMusicSetVolume(v){
      musicState.volume = Math.min(1,Math.max(0,Number(v)));
      if(_bgAudio) _bgAudio.volume = musicState.volume;
    }
    function bgMusicSetTrack(idx){
      musicState.trackIdx = idx;
      if(_bgAudio){ _bgAudio.pause(); _bgAudio=null; }
      if(musicState.enabled) bgMusicPlay();
      renderMusicPanel();
    }
    function bgMusicSetMode(mode){
      musicState.mode = mode;
      renderMusicPanel();
    }

    /* ── SFX ── */
    const SFX = {
      click:   "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA...".slice(0,10), // placeholder
      // We'll use AudioContext to generate simple tones
    };
    let _sfxCtx = null;
    function getSfxCtx(){
      if(!_sfxCtx){ try{ _sfxCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch{} }
      return _sfxCtx;
    }
    function playSfxTone(freq=440, dur=0.08, type="sine", vol=0.18){
      if(!musicState.sfxEnabled)return;
      try{
        const ctx=getSfxCtx(); if(!ctx)return;
        const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value=freq; osc.type=type;
        gain.gain.setValueAtTime(vol,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime+dur);
      }catch{}
    }
    function sfxClick(){ playSfxTone(800,0.055,"sine",0.12); }
    function sfxBoxOpen(){
      if(!musicState.sfxEnabled)return;
      // Shimmering arpeggio
      [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playSfxTone(f,0.12,"sine",0.18),i*80));
    }
    function sfxXpClaim(){
      if(!musicState.sfxEnabled)return;
      [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>playSfxTone(f,0.1,"triangle",0.2),i*60));
    }
    let _wheelTickInterval=null;
    function sfxWheelStart(){
      if(!musicState.sfxEnabled)return;
      let delay=200;
      function tick(){
        playSfxTone(600+Math.random()*200,0.04,"square",0.08);
        delay=Math.max(40,delay*0.88);
        if(delay>41) _wheelTickInterval=setTimeout(tick,delay);
      }
      tick();
    }
    function sfxWheelEnd(){
      clearTimeout(_wheelTickInterval);
      if(!musicState.sfxEnabled)return;
      setTimeout(()=>{ [784,988,1175,1568].forEach((f,i)=>setTimeout(()=>playSfxTone(f,0.18,"sine",0.25),i*90)); },100);
    }

    /* ── Render music panel ── */
    function renderMusicPanel(){
      const el=document.getElementById("music-panel-wrap");
      if(!el)return;
      const track=MUSIC_PLAYLIST[musicState.trackIdx];
      el.innerHTML=`
        <div class="music-panel">
          <div class="music-panel-title">🎵 Music & SFX Settings</div>
          <div class="music-track-now">▶ ${track.title}</div>
          <div class="music-row">
            <span>🎵 Music</span>
            <button class="music-toggle-btn ${musicState.enabled?"on":""}" id="music-toggle">
              ${musicState.enabled?"ON ✓":"OFF"}
            </button>
          </div>
          <div class="music-row">
            <span>🔊 Volume</span>
            <input type="range" id="music-vol" class="music-vol-slider" min="0" max="100"
              value="${Math.round(musicState.volume*100)}" />
            <span class="music-vol-pct">${Math.round(musicState.volume*100)}%</span>
          </div>
          <div class="music-row">
            <span>Mode</span>
            <button class="music-mode-btn ${musicState.mode==="repeat"?"active":""}" id="music-repeat">🔁 Repeat</button>
            <button class="music-mode-btn ${musicState.mode==="continue"?"active":""}" id="music-continue">⏩ Continue</button>
          </div>
          <div class="music-tracks">
            ${MUSIC_PLAYLIST.map((t,i)=>`
              <button class="music-track-btn ${i===musicState.trackIdx?"playing":""}" data-track="${i}">
                ${i===musicState.trackIdx?"▶ ":""}${t.title}
              </button>`).join("")}
          </div>
          <div class="music-divider"></div>
          <div class="music-row">
            <span>🔔 SFX</span>
            <button class="music-toggle-btn ${musicState.sfxEnabled?"on":""}" id="sfx-toggle">
              ${musicState.sfxEnabled?"ON ✓":"OFF"}
            </button>
          </div>
        </div>`;
      // Bind panel events
      document.getElementById("music-toggle")?.addEventListener("click",bgMusicToggle);
      document.getElementById("sfx-toggle")?.addEventListener("click",()=>{
        musicState.sfxEnabled=!musicState.sfxEnabled; sfxClick(); renderMusicPanel();
      });
      document.getElementById("music-vol")?.addEventListener("input",e=>{
        bgMusicSetVolume(Number(e.target.value)/100);
        e.target.nextElementSibling.textContent=e.target.value+"%";
      });
      document.getElementById("music-repeat")?.addEventListener("click",()=>bgMusicSetMode("repeat"));
      document.getElementById("music-continue")?.addEventListener("click",()=>bgMusicSetMode("continue"));
      document.querySelectorAll("[data-track]").forEach(b=>b.addEventListener("click",()=>bgMusicSetTrack(Number(b.getAttribute("data-track")))));
    }

    /* ══════════════════════════════════════════════
       MISSION HELPERS
    ══════════════════════════════════════════════ */
    function loadMissionsFromData(data){
      const today=todayKey();
      if(!data||data.date!==today) state.missions={date:today,progress:emptyProgress(),claimed:emptyClaimed()};
      else state.missions={date:data.date,progress:{...emptyProgress(),...(data.progress||{})},claimed:{...emptyClaimed(),...(data.claimed||{})}};
    }
    async function incrementMissionProgress(key,amount=1){
      if(!state.currentUser)return;
      const today=todayKey();
      if(state.missions.date!==today) state.missions={date:today,progress:emptyProgress(),claimed:emptyClaimed()};
      state.missions.progress[key]=Math.min((state.missions.progress[key]||0)+amount, getMissionGoal(key));
      render();
      try{ await updateDoc(getMetaRef(state.currentUser.uid),{missionData:{date:state.missions.date,progress:state.missions.progress,claimed:state.missions.claimed},updated_at:serverTimestamp()}); }
      catch(e){console.error("Mission sync:",e);}
    }
    const isMissionComplete = m => (state.missions.progress[m.trackKey]||0)>=m.goal;
    const isMissionClaimed  = m => !!state.missions.claimed[m.id];

    async function claimMissionReward(missionId){
      if(!state.currentUser)return;
      const mission=MISSIONS.find(m=>m.id===missionId);
      if(!mission||!isMissionComplete(mission)||isMissionClaimed(mission))return;
      state.missions.claimed[mission.id]=true;
      const {gold,xp,gems}=mission.reward;
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error("missing");
          const d=snap.data(); const nXp=Number(d.xp||0)+xp;
          tx.update(getMetaRef(state.currentUser.uid),{xp:nXp,level:lvFromXp(nXp),gems:Number(d.gems||0)+gems,gold:Number(d.gold||0)+gold,missionData:{date:state.missions.date,progress:state.missions.progress,claimed:state.missions.claimed},updated_at:serverTimestamp()});
        });
        showToast(`🎉 Mission! +${gold}🪙 +${xp}XP +${gems}💎`);
        showGoldFlash(gold);
      }catch(e){ state.missions.claimed[mission.id]=false; alert("Could not claim reward."); }
      render();
    }

    /* ══════════════════════════════════════════════
       THEME SHOP FUNCTIONS
    ══════════════════════════════════════════════ */
    async function buyTheme(themeId){
      if(!state.currentUser)return;
      const theme=getThemeById(themeId); if(!theme)return;
      if(ownsTheme(themeId)){showToast("Already owned! Equip it instead.");return;}
      if(Number(state.profile.gold||0)<theme.price){showToast(`Not enough Gold! Need ${theme.price}🪙`);return;}
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data();
          const currentGold=Number(d.gold||0);
          if(currentGold<theme.price)throw new Error("low-gold");
          const currentThemes=Array.isArray(d.inventory?.themes)?d.inventory.themes:[];
          if(currentThemes.includes(themeId))throw new Error("already-owned");
          tx.update(getMetaRef(state.currentUser.uid),{
            gold:currentGold-theme.price,
            inventory:{...( d.inventory||{}), themes:[...currentThemes, themeId]},
            updated_at:serverTimestamp()
          });
        });
        showToast(`🎉 ${theme.name} theme unlocked!`);
        showGoldFlash(-theme.price);
      }catch(e){
        const msg=String(e.message||"");
        if(msg.includes("low-gold"))showToast(`Not enough Gold! Need ${theme.price}🪙`);
        else if(msg.includes("already-owned"))showToast("Already owned!");
        else alert("Purchase failed. Try again.");
      }
      render();
    }

    async function equipTheme(themeId){
      if(!state.currentUser)return;
      const theme=getThemeById(themeId); if(!theme)return;
      if(!ownsTheme(themeId)){showToast("You don't own this theme!");return;}
      const newTheme=state.profile.equippedTheme===themeId?"":themeId; // toggle off if same
      try{
        await updateDoc(getMetaRef(state.currentUser.uid),{equippedTheme:newTheme,updated_at:serverTimestamp()});
        showToast(newTheme?`✨ ${theme.name} theme equipped!`:"Theme removed.");
      }catch(e){ alert("Could not equip theme."); }
    }

    /* ══════════════════════════════════════════════
       FIREBASE SETUP
    ══════════════════════════════════════════════ */
    async function ensureUserDocs(user){
      const ref=getMetaRef(user.uid); const snap=await getDoc(ref);
      if(!snap.exists()){
        await setDoc(ref,{
          uid:user.uid,email:user.email||"",username:(user.email||"otaku").split("@")[0],
          avatar:AVATARS[0],Bio:"",xp:0,level:1,gems:0,gold:0,
          tracker:[],recentChats:[],freeSpins:0,inventoryCards:[],equippedSlots:{},
          inventory:{themes:[]}, equippedTheme:"", pityRare:0, pityLegendary:0, permBonusAtk:0, permBonusHp:0, permBonusDef:0, storyRulesShown:false, dungeonConqueror:false,
          online:true,lastSeenMs:Date.now(),
          last_claim_date:Timestamp.fromMillis(0),daily_read_count:0,last_read_date:"",
          missionData:{date:"",progress:emptyProgress(),claimed:emptyClaimed()},
          created_at:serverTimestamp(),updated_at:serverTimestamp()
        });
      } else {
        const d=snap.data(); const u={};
        if(d.gems===undefined)  u.gems=0;
        if(d.gold===undefined)  u.gold=0;
        if(d.inventory===undefined) u.inventory={themes:[]};
        else if(!d.inventory?.themes) u.inventory={...(d.inventory||{}),themes:[]};
        if(d.equippedTheme===undefined) u.equippedTheme="";
        if(d.pityRare===undefined) u.pityRare=0;
        if(d.pityLegendary===undefined) u.pityLegendary=0;
        if(d.permBonusAtk===undefined) u.permBonusAtk=0;
        if(d.permBonusHp===undefined)  u.permBonusHp=0;
        if(d.permBonusDef===undefined) u.permBonusDef=0;
        if(d.flatBonusAtk===undefined) u.flatBonusAtk=0;
        if(d.flatBonusHp===undefined)  u.flatBonusHp=0;
        if(d.flatBonusDef===undefined) u.flatBonusDef=0;
        if(d.storyRulesShown===undefined) u.storyRulesShown=false;
        if(d.dungeonConqueror===undefined) u.dungeonConqueror=false;
        if(d.missionData===undefined) u.missionData={date:"",progress:emptyProgress(),claimed:emptyClaimed()};
        if(Object.keys(u).length) await updateDoc(ref,u);
      }
      const aRef=getActivityRef(user.uid); const aSnap=await getDoc(aRef);
      if(!aSnap.exists()) await setDoc(aRef,{uid:user.uid,day_key:"",count:0,updated_at:serverTimestamp()});
    }

    function clearLive(){
      state.unsubscribers.forEach(u=>u&&u()); state.unsubscribers=[];
      if(state.chatMessagesUnsub){state.chatMessagesUnsub();state.chatMessagesUnsub=null;}
      if(state.globalChatUnsub){state.globalChatUnsub();state.globalChatUnsub=null;}
    }

    async function setupLive(user){
      clearLive(); await ensureUserDocs(user);

      // ── Admin XP Reset: Yasin Arafat's account reset to Level 21 / 2840 XP ──
      // Only runs if current stored XP is above 2840 (the bug level jump)
      // XP=2840 corresponds to Level 21. This is a one-time correction.
      try{
        const snapCheck = await getDoc(getMetaRef(user.uid));
        if(snapCheck.exists()){
          const dCheck = snapCheck.data();
          const uname = (dCheck.username||"").trim();
          const storedXp = Number(dCheck.xp||0);
          if(uname === ADMIN_NAME && storedXp > 2840 && !dCheck._xpReset2840){
            const RESET_XP = 2840;
            await updateDoc(getMetaRef(user.uid),{
              xp: RESET_XP, level: lvFromXp(RESET_XP),
              _xpReset2840: true, updated_at: serverTimestamp()
            });
          }
        }
      }catch(e){ console.warn("Admin XP reset check failed:", e); }

      const unMeta=onSnapshot(getMetaRef(user.uid),snap=>{
        if(!snap.exists())return;
        const d=snap.data(); const info=getLevelInfo(Number(d.xp||0));
        state.profile={
          uid:d.uid||user.uid, username:d.username||(user.email||"otaku").split("@")[0],
          avatar:d.avatar||AVATARS[0], Bio:d.Bio||"", xp:Number(d.xp||0), level:info.level,
          gems:Number(d.gems||0), gold:Number(d.gold||0),
          tracker:Array.isArray(d.tracker)?d.tracker:[],
          recentChats:Array.isArray(d.recentChats)?d.recentChats:[],
          freeSpins:Number(d.freeSpins||0),
          inventoryCards:normalizeInventory(d.inventoryCards),
          equippedSlots:normalizeSlots(d.equippedSlots),
          inventory:{ themes:Array.isArray(d.inventory?.themes)?d.inventory.themes:[] },
          equippedTheme:d.equippedTheme||"",
          pityRare:Number(d.pityRare||0), pityLegendary:Number(d.pityLegendary||0),
          last_claim_date:d.last_claim_date||Timestamp.fromMillis(0),
          daily_read_count:Number(d.daily_read_count||0),
          last_read_date:d.last_read_date||"",
          permBonusAtk:Number(d.permBonusAtk||0),
          permBonusHp:Number(d.permBonusHp||0),
          permBonusDef:Number(d.permBonusDef||0),
          flatBonusAtk:Number(d.flatBonusAtk||0),
          flatBonusHp:Number(d.flatBonusHp||0),
          flatBonusDef:Number(d.flatBonusDef||0),
          storyRulesShown:Boolean(d.storyRulesShown||false),
          dungeonConqueror:Boolean(d.dungeonConqueror||false)
        };
        // ── Global level-up detection (single source of truth) ──
        const _newLevel = getLevelInfo(Number(d.xp||0)).level;
        if(_prevLevel > 0 && _newLevel > _prevLevel){
          setTimeout(()=>showLevelUpModal(_newLevel, rankTitle(_newLevel)), 450);
        }
        _prevLevel = _newLevel;
        loadMissionsFromData(d.missionData);
        const today=todayKey();
        if(state.profile.last_read_date===today){ state.news.dailyCount=state.profile.daily_read_count; state.news.lastDate=today; }
        else{ state.news.dailyCount=0; state.news.lastDate=today; }
        patchImages(); render();
      });
      const unUsers=onSnapshot(collection(db,"user_meta"),snap=>{
        state.allUsers=snap.docs.map(d=>{
          const u=d.data(); const info=getLevelInfo(Number(u.xp||0));
          return{uid:u.uid||d.id,username:u.username||"Otaku",avatar:u.avatar||AVATARS[0],online:!!u.online,lastSeenMs:Number(u.lastSeenMs||0),xp:Number(u.xp||0),gems:Number(u.gems||0),gold:Number(u.gold||0),title:info.title,rankClass:info.rankClass,Bio:u.Bio||"",equippedSlots:normalizeSlots(u.equippedSlots),equippedTheme:u.equippedTheme||"",inventoryCards:normalizeInventory(u.inventoryCards||[]),permBonusAtk:Number(u.permBonusAtk||0),permBonusHp:Number(u.permBonusHp||0),permBonusDef:Number(u.permBonusDef||0),flatBonusAtk:Number(u.flatBonusAtk||0),flatBonusHp:Number(u.flatBonusHp||0),flatBonusDef:Number(u.flatBonusDef||0),weeklyRewardClaimed:u.weeklyRewardClaimed||""};
        });
        updateLeaderboard();
        if(state.inspectUser){const l=state.allUsers.find(u=>u.uid===state.inspectUser.uid);state.inspectUser=l||null;}
        render();
      });
      const qPosts=query(collection(db,"feed_posts"),orderBy("created_at_ms","desc"),limit(60));
      const unPosts=onSnapshot(qPosts,snap=>{
        state.posts=snap.docs.map(d=>{const v=d.data();return{id:d.id,...v,likesCount:Number(v.likesCount||0),likedBy:v.likedBy&&typeof v.likedBy==="object"?v.likedBy:{},comments:Array.isArray(v.comments)?v.comments:[],reactions:v.reactions&&typeof v.reactions==="object"?v.reactions:{}};});
        render();
      });
      /* Subscribe to all DM chats involving this user (inbox) */
      const myUid = user.uid;
      const inboxQ = query(collection(db,"direct_chats"), orderBy("updatedAtMs","desc"), limit(50));
      if(state.inboxUnsub){ state.inboxUnsub(); state.inboxUnsub=null; }
      state.inboxUnsub = onSnapshot(inboxQ, snap=>{
        const inbox = [];
        snap.docs.forEach(d=>{
          const data = d.data();
          if(!Array.isArray(data.participants)||!data.participants.includes(myUid)) return;
          const otherId = data.participants.find(p=>p!==myUid);
          if(!otherId) return;
          inbox.push({
            chatId:   d.id,
            otherId,
            updatedAtMs: Number(data.updatedAtMs||0),
            lastText:    data.lastText||"",
            lastSenderId:data.lastSenderId||"",
            unread:      Number(data[`unread_${myUid}`]||0)
          });
        });
        // Sort by most recent
        inbox.sort((a,b)=>b.updatedAtMs-a.updatedAtMs);
        state.chatInbox = inbox;
        // Total unread count for badge
        const totalUnread = inbox.reduce((s,i)=>s+i.unread,0);
        state.totalUnread = totalUnread;
        render();
      });
      state.unsubscribers.push(unMeta,unUsers,unPosts);
    }

    /* patchImages: no-op — all card images are now direct GitHub URLs */
    function patchImages(){}

    /* ── Presence ── */
    const setPresence = async online=>{ if(!state.currentUser)return; try{await updateDoc(getMetaRef(state.currentUser.uid),{online,lastSeenMs:Date.now(),updated_at:serverTimestamp()});}catch{} };
    function startPresence(){ stopPresence(); setPresence(true); state.presenceTimer=setInterval(()=>setPresence(true),30000); document.addEventListener("visibilitychange",onVis); window.addEventListener("beforeunload",onUnload); }
    function stopPresence(){ if(state.presenceTimer){clearInterval(state.presenceTimer);state.presenceTimer=null;} document.removeEventListener("visibilitychange",onVis); window.removeEventListener("beforeunload",onUnload); }
    const onVis    = () => document.hidden?setPresence(false):setPresence(true);
    const onUnload = () => setPresence(false);
    const isOnline = u => Boolean(u?.online)&&(Date.now()-Number(u?.lastSeenMs||0)<=ONLINE_WINDOW_MS);
    const getUserById = uid => state.allUsers.find(u=>u.uid===uid);
    const updateLeaderboard = () => { state.leaderboard=[...state.allUsers].sort((a,b)=>Number(b.xp||0)-Number(a.xp||0)).slice(0,10); };

    /* ══════════════════════════════════════════════
       GACHA / CARDS  (Pity System + Gold Cost)
    ══════════════════════════════════════════════ */

    /* Pick a card respecting pity counters.
       pityRare:      pulls since last Rare/Legendary (resets on Rare/Legendary)
       pityLegendary: pulls since last Legendary (resets only on Legendary)
    */
    function pickCardWithPity(pityRare, pityLegendary){
      let rarity;
      const nextPull = (pityRare||0) + 1;
      const nextPullL= (pityLegendary||0) + 1;

      if(nextPullL >= PITY_LEGENDARY){
        rarity = "legendary";
      } else if(nextPull >= PITY_RARE){
        rarity = "rare";
      } else {
        // Strict probabilities: Legendary 8%, Rare 22%, Common 70%
        const roll = Math.random();
        rarity = roll < 0.08 ? "legendary" : roll < 0.30 ? "rare" : "common";
      }

      const pool = cardsList.filter(c=>c.rarity===rarity);
      const base = pool[Math.floor(Math.random()*pool.length)];

      // Update pity counters
      let newPityRare      = nextPull;
      let newPityLegendary = nextPullL;
      if(rarity==="legendary"){ newPityRare=0; newPityLegendary=0; }
      else if(rarity==="rare"){ newPityRare=0; }

      return{
        card:{instanceId:`i-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,id:base.id,name:base.name,rarity:base.rarity,image:base.image},
        newPityRare, newPityLegendary
      };
    }

    /* ── Box Shake + Light-Beam Reveal ── */
    function playBoxShakeAnimation(onDone){
      // Mark shaking state so viewShop renders the shake class
      state.shop.shaking = true; render();
      // After 1.5s shake ends — fire light beam then show card
      setTimeout(()=>{
        state.shop.shaking = false;
        state.shop.revealing = true; render();
        setTimeout(()=>{ state.shop.revealing = false; onDone(); },600);
      }, 1500);
    }

    async function buyMysteryBox(){
      if(!state.currentUser||state.shop.opening||state.shop.shaking)return;
      const gold = Number(state.profile.gold||0);
      if(gold < BOX_COST_GOLD){ showToast(`Not enough Gold! Need ${BOX_COST_GOLD}🪙`); return; }
      state.shop.opening = true; render();

      try{
        let pulledCard = null;
        await runTransaction(db, async tx=>{
          const snap = await tx.get(getMetaRef(state.currentUser.uid));
          if(!snap.exists()) throw new Error();
          const d = snap.data();
          if(Number(d.gold||0) < BOX_COST_GOLD) throw new Error("low-gold");
          const pityRare      = Number(d.pityRare||0);
          const pityLegendary = Number(d.pityLegendary||0);
          const {card, newPityRare, newPityLegendary} = pickCardWithPity(pityRare, pityLegendary);
          pulledCard = card;
          const inv = normalizeInventory(d.inventoryCards); inv.unshift(card);
          tx.update(getMetaRef(state.currentUser.uid),{
            gold: Number(d.gold||0) - BOX_COST_GOLD,
            inventoryCards: inv,
            pityRare: newPityRare,
            pityLegendary: newPityLegendary,
            updated_at: serverTimestamp()
          });
        });
        state.shop.opening = false;
        sfxBoxOpen();
        // Play shake → beam → reveal
        playBoxShakeAnimation(()=>{
          state.shop.lastPull = pulledCard;
          render();
          showToast(`✨ ${pulledCard.name} (${pulledCard.rarity.toUpperCase()})!`);
          showGoldFlash(-BOX_COST_GOLD);
          playPopSound();
        });
      }catch(e){
        state.shop.opening = false;
        const msg = String(e.message||"");
        if(msg.includes("low-gold")) showToast(`Need ${BOX_COST_GOLD}🪙 Gold!`);
        else { console.error(e); alert("Failed. Try again."); }
        render();
      }
    }
    function openEquipModal(id){  state.equip={open:true,cardId:id}; render(); }
    function closeEquipModal(){   state.equip={open:false,cardId:""}; render(); }
    async function equipCardToSlot(slotId){
      if(!state.currentUser||!state.equip.cardId)return;
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data(); const inv=normalizeInventory(d.inventoryCards);
          const card=inv.find(c=>c.instanceId===state.equip.cardId); if(!card)throw new Error();
          const slots=normalizeSlots(d.equippedSlots); slots[slotId]={instanceId:card.instanceId,id:card.id,name:card.name,rarity:card.rarity,image:card.image||fallbackAvatar(card.name)};
          tx.update(getMetaRef(state.currentUser.uid),{equippedSlots:slots,updated_at:serverTimestamp()});
        });
        closeEquipModal(); showToast(`Equipped to ${slotId}`);
      }catch{ alert("Could not equip."); }
    }
    async function unequipSlot(slotId){
      if(!state.currentUser)return;
      try{ const n={...state.profile.equippedSlots}; delete n[slotId]; await updateDoc(getMetaRef(state.currentUser.uid),{equippedSlots:n,updated_at:serverTimestamp()}); showToast(`Removed from ${slotId}`); }
      catch{ alert("Could not unequip."); }
    }

    /* ── Card Recycle: rarity-based rewards + duplicate gives permanent Story Mode stat bonus ── */
    async function recycleCard(instanceId){
      if(!state.currentUser)return;
      const card = (state.profile.inventoryCards||[]).find(c=>c.instanceId===instanceId);
      if(!card)return;
      const rewards={legendary:{gold:600,xp:300},rare:{gold:300,xp:150},common:{gold:100,xp:50}};
      const r=rewards[card.rarity]||rewards.common;

      // Check if it's a duplicate (same card id already exists elsewhere in inventory)
      const allCards = state.profile.inventoryCards||[];
      const isDuplicate = allCards.filter(c=>c.id===card.id).length > 1;
      const cardBase = cardsList.find(c=>c.id===card.id)||card;
      const cardStats = getCardStats(cardBase);

      const dupeNote = isDuplicate
        ? `<br/><br/>⭐ Duplicate! Permanent Story Power:<br/>+${cardStats.atk} ATK, +${cardStats.hp} HP, +${cardStats.def} DEF`
        : "";

      showNeonModal({
        title:"♻️ কার্ড Recycle",
        body:`<strong>${escapeHtml(card.name)}</strong> (${card.rarity.toUpperCase()}) রিসাইকেল করলে:<br/><br/>🪙 +${r.gold} Gold<br/>⚡ +${r.xp} XP${dupeNote}<br/><br/>এটি undo করা যাবে না।`,
        okText:"♻️ হ্যাঁ, Recycle করো", cancelText:"✗ বাতিল", danger:true,
        onOk: async()=>{
          try{
            await runTransaction(db,async tx=>{
              const snap=await tx.get(getMetaRef(state.currentUser.uid));
              if(!snap.exists())throw new Error();
              const d=snap.data();
              const inv=normalizeInventory(d.inventoryCards).filter(c=>c.instanceId!==instanceId);
              const slots={...normalizeSlots(d.equippedSlots)};
              Object.keys(slots).forEach(s=>{ if(slots[s]?.instanceId===instanceId) delete slots[s]; });

              // XP is separate from Story Power — only +xp to player XP (not to power stats)
              const nXp=Number(d.xp||0)+r.xp;

              const update = {
                gold:Number(d.gold||0)+r.gold,
                xp:nXp, level:lvFromXp(nXp),
                inventoryCards:inv, equippedSlots:slots, updated_at:serverTimestamp()
              };

              // Duplicate: add 100% of card's ATK/HP/DEF permanently to Story Mode Power
              // Stored as flat values (not %), so we need separate fields: flatBonusAtk/Hp/Def
              if(isDuplicate){
                update.flatBonusAtk = Number(d.flatBonusAtk||0) + cardStats.atk;
                update.flatBonusHp  = Number(d.flatBonusHp||0)  + cardStats.hp;
                update.flatBonusDef = Number(d.flatBonusDef||0) + cardStats.def;
              }

              tx.update(getMetaRef(state.currentUser.uid), update);
            });
            const msg = isDuplicate
              ? `♻️ Duplicate Recycled! +${r.gold}🪙 +${r.xp}XP | Perm +${cardStats.atk}ATK +${cardStats.hp}HP +${cardStats.def}DEF`
              : `♻️ Recycled! +${r.gold}🪙 +${r.xp}XP`;
            showToast(msg);
            showGoldFlash(r.gold);
          }catch(e){ console.error(e); showToast("Could not recycle."); }
        }
      });
      return;
    }

    /* ══════════════════════════════════════════════
       WHEEL
    ══════════════════════════════════════════════ */
    let wheelRot=0, wheelAF=null;
    function lighten(hex,p){ let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return`rgb(${Math.min(255,r+Math.floor((255-r)*p))},${Math.min(255,g+Math.floor((255-g)*p))},${Math.min(255,b+Math.floor((255-b)*p))})` }
    function darken(hex,p){ let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return`rgb(${Math.floor(r*(1-p))},${Math.floor(g*(1-p))},${Math.floor(b*(1-p))})` }
    function drawWheel(canvas,rot){
      const ctx=canvas.getContext("2d"); const dpr=window.devicePixelRatio||1;
      const sz=canvas.parentElement?.clientWidth||280;
      canvas.width=sz*dpr; canvas.height=sz*dpr; canvas.style.width=sz+"px"; canvas.style.height=sz+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const cx=sz/2,cy=sz/2,rad=sz/2-2,sa=(2*Math.PI)/WHEEL_SLOTS.length;
      ctx.clearRect(0,0,sz,sz); ctx.save(); ctx.translate(cx,cy); ctx.rotate((rot*Math.PI)/180);
      WHEEL_SLOTS.forEach((slot,i)=>{
        const a0=i*sa-Math.PI/2,a1=a0+sa;
        const gr=ctx.createRadialGradient(0,0,rad*.15,0,0,rad);
        gr.addColorStop(0,lighten(slot.color,.25)); gr.addColorStop(.7,slot.color); gr.addColorStop(1,darken(slot.color,.35));
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rad,a0,a1); ctx.closePath();
        ctx.fillStyle=gr; ctx.fill(); ctx.strokeStyle="rgba(255,255,255,.18)"; ctx.lineWidth=1.5; ctx.stroke();
        const mid=a0+sa/2;
        ctx.save(); ctx.translate(Math.cos(mid)*rad*.58,Math.sin(mid)*rad*.58); ctx.rotate(mid+Math.PI/2);
        ctx.font=`${Math.max(14,sz*.06)}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(slot.icon,0,0); ctx.restore();
        ctx.save(); ctx.translate(Math.cos(mid)*rad*.78,Math.sin(mid)*rad*.78); ctx.rotate(mid+Math.PI/2);
        ctx.font=`900 ${Math.max(9,sz*.035)}px Inter,system-ui,sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle="#fff"; ctx.shadowColor="rgba(0,0,0,.85)"; ctx.shadowBlur=6; ctx.fillText(slot.label,0,0); ctx.restore();
      });
      ctx.restore();
    }
    function initWheel(){ const c=document.getElementById("neon-wheel-canvas"); if(c)drawWheel(c,wheelRot); }
    /* ── Wheel Spin — robust deceleration, exact stop, no drift after repeats ── */
    function runSpin(idx,onDone){
      const canvas=document.getElementById("neon-wheel-canvas"); if(!canvas){onDone();return;}
      if(wheelAF){cancelAnimationFrame(wheelAF);wheelAF=null;}
      // Normalise current rotation to [0,360) so it never grows unboundedly
      wheelRot = ((wheelRot % 360) + 360) % 360;
      const sa      = 360 / WHEEL_SLOTS.length;
      // Pointer is at top (270°). Calculate where the target slot centre must land.
      const slotCentre = (idx * sa + sa / 2); // e.g. slot 0 centre = 22.5°
      // We want:  (wheelRot + total) mod 360 === (270 - slotCentre + 360) mod 360
      const targetRot  = ((270 - slotCentre) % 360 + 360) % 360;
      const currNorm   = wheelRot;
      // Always spin forward; add extra full rotations for drama
      let correction   = ((targetRot - currNorm) % 360 + 360) % 360;
      if(correction < 5) correction += 360; // avoid near-zero tiny spin
      const extraTurns = (5 + Math.floor(Math.random() * 4)) * 360;
      const totalDelta = extraTurns + correction;
      const startRot   = wheelRot;
      const dur        = 5200;
      const t0         = performance.now();
      // Quintic ease-out: fast start, very smooth natural deceleration at end
      const ease = t => 1 - Math.pow(1 - t, 5);
      function frame(now){
        const elapsed = now - t0;
        const t       = Math.min(1, elapsed / dur);
        wheelRot      = startRot + totalDelta * ease(t);
        drawWheel(canvas, wheelRot);
        if(t < 1){ wheelAF = requestAnimationFrame(frame); }
        else{
          // Snap to exact final position and normalise
          wheelRot = ((startRot + totalDelta) % 360 + 360) % 360;
          drawWheel(canvas, wheelRot);
          wheelAF  = null;
          onDone();
        }
      }
      wheelAF = requestAnimationFrame(frame);
    }
    function resolveSpin(key){
      if(key==="lose")    return{xpD:0,  fsD:0,text:"Lose. No extra XP.",  tone:"bad"};
      if(key==="x2")      return{xpD:40, fsD:0,text:"2x XP: +40 XP.",      tone:"good"};
      if(key==="xp10")    return{xpD:10, fsD:0,text:"+10 XP won.",          tone:"good"};
      if(key==="jackpot") return{xpD:100,fsD:0,text:"JACKPOT +100 XP.",     tone:"good"};
      if(key==="bankrupt")return{xpD:-20,fsD:0,text:"Bankrupt -20 XP.",     tone:"bad"};
      if(key==="xp50")    return{xpD:50, fsD:0,text:"+50 XP won.",          tone:"good"};
      if(key==="x3")      return{xpD:60, fsD:0,text:"3x XP: +60 XP.",      tone:"good"};
      if(key==="free")    return{xpD:0,  fsD:1,text:"Free Spin earned.",    tone:"good"};
      return{xpD:0,fsD:0,text:"No reward.",tone:"neutral"};
    }
    async function spinArenaWheel(){
      if(!state.currentUser||state.arena.spinning)return;
      sfxWheelStart();
      const hasFree=Number(state.profile.freeSpins||0)>0;
      if(!hasFree&&Number(state.profile.xp||0)<SPIN_COST){alert("Need 20 XP to spin.");return;}
      const idx=Math.floor(Math.random()*WHEEL_SLOTS.length);
      state.arena.spinning=true; state.arena.lastResult="Spinning..."; state.arena.resultTone="neutral"; render();
      requestAnimationFrame(()=>initWheel());
      setTimeout(()=>runSpin(idx,async()=>{
        const slot=WHEEL_SLOTS[idx];
        try{
          const res=await runTransaction(db,async tx=>{
            const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
            const d=snap.data(); let xp=Number(d.xp||0), fs=Number(d.freeSpins||0);
            const useFree=fs>0; if(!useFree&&xp<SPIN_COST)throw new Error("low-xp");
            if(useFree)fs=Math.max(0,fs-1); else xp-=SPIN_COST;
            const o=resolveSpin(slot.key); xp=Math.max(0,xp+o.xpD); fs=Math.max(0,fs+o.fsD);
            tx.update(getMetaRef(state.currentUser.uid),{xp,level:lvFromXp(xp),freeSpins:fs,updated_at:serverTimestamp()});
            checkAndShowLevelUp(xp);
            return{text:`${slot.label}: ${o.text} ${useFree?"(Free Spin)":"(-20 XP)"}`,tone:o.tone};
          });
          state.arena.lastResult=res.text; state.arena.resultTone=res.tone;
        }catch{ state.arena.lastResult="Spin failed."; state.arena.resultTone="bad"; }
        sfxWheelEnd();
        state.arena.spinning=false; render();
      }),100);
    }

    /* ══════════════════════════════════════════════
       NEWS HUB
    ══════════════════════════════════════════════ */
    async function fetchAnimeNews(){
      state.news.loading=true; state.news.articles=[]; render();
      try{
        const r=await fetch("https://api.jikan.moe/v4/anime?order_by=start_date&sort=desc&limit=15&sfw=true&status=airing");
        if(!r.ok)throw new Error();
        const data=await r.json();
        state.news.articles=(data?.data||[]).map((a,i)=>({id:`news-${a.mal_id||i}`,title:a.title||a.title_english||"Anime Update",image:a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||"",excerpt:(a.synopsis||"No synopsis.").slice(0,180)+"...",url:a.url||"#",date:a.aired?.from?new Date(a.aired.from).toLocaleDateString():"Airing Now",score:a.score||"N/A",episodes:a.episodes||"?"}));
      }catch{ state.news.articles=[]; }
      state.news.loading=false; render();
    }
    function openNewsModal(){ state.news.modalOpen=true; state.news.readTimers={}; state.news.claimedIds={}; const today=todayKey(); state.news.dailyCount=state.profile.last_read_date===today?state.profile.daily_read_count:0; state.news.lastDate=today; fetchAnimeNews(); }
    function closeNewsModal(){ state.news.modalOpen=false; Object.values(state.news.readTimers).forEach(t=>{if(t.interval)clearInterval(t.interval);}); render(); }
    function startNewsReadTimer(id){
      if(state.news.claimedIds[id])return;
      if(state.news.dailyCount>=NEWS_MAX_DAILY)return;
      if(Object.values(state.news.readTimers).some(t=>t.active)){showToast("⏳ Finish current article first!");return;}
      if(state.news.readTimers[id]?.active)return;
      state.news.readTimers[id]={active:true,elapsed:0,interval:null}; render();
      const t=state.news.readTimers[id];
      t.interval=setInterval(()=>{
        if(!state.news.modalOpen){clearInterval(t.interval);t.active=false;t.elapsed=0;return;}
        t.elapsed++;
        const bar=document.getElementById(`ntf-${id}`); if(bar)bar.style.width=Math.min(100,(t.elapsed/NEWS_READ_SECONDS)*100)+"%";
        const btn=document.getElementById(`nrb-${id}`); if(btn){btn.textContent=`Reading... ${NEWS_READ_SECONDS-t.elapsed}s`;btn.className="news-read-btn counting";}
        if(t.elapsed>=NEWS_READ_SECONDS){clearInterval(t.interval);t.active=false;claimNewsXp(id);render();}
      },1000);
    }
    async function claimNewsXp(id){
      if(!state.currentUser||state.news.claimedIds[id])return;
      state.news.claimedIds[id]=true;
      const today=todayKey();
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data(); let rc=Number(d.daily_read_count||0);
          if((d.last_read_date||"")!==today)rc=0;
          if(rc>=NEWS_MAX_DAILY)throw new Error("max");
          rc++;
          const nXp=Number(d.xp||0)+NEWS_XP_PER_READ;
          tx.update(getMetaRef(state.currentUser.uid),{xp:nXp,level:lvFromXp(nXp),daily_read_count:rc,last_read_date:today,updated_at:serverTimestamp()});
        });
        state.news.dailyCount++;
        showToast(`+${NEWS_XP_PER_READ} XP from news! (${state.news.dailyCount}/${NEWS_MAX_DAILY})`);
        await incrementMissionProgress("newsRead",1);
      }catch(e){ String(e.message||"").includes("max")?showToast("Daily limit reached!"):alert("Could not claim XP."); }
      render();
    }

    /* ══════════════════════════════════════════════
       AI SENSEI
    ══════════════════════════════════════════════ */
    async function askSensei(){
      const inp=document.getElementById("sensei-input"); const q=(inp?.value||"").trim(); if(!q)return;
      state.senseiMessages.push({role:"user",text:q}); state.senseiLoading=true; if(inp)inp.value=""; render();
      try{
        const r=await fetch(API_URL,{method:"POST",headers:{"Authorization":`Bearer ${API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:"You are Anime Sensei — a wise, friendly anime expert. Answer in 4-8 lines."},{role:"user",content:q}],temperature:.8,max_tokens:512})});
        const data=await r.json();
        if(!r.ok)state.senseiMessages.push({role:"assistant",text:"⚠️ "+(data?.error?.message||"Error")});
        else{ const m=data?.choices?.[0]?.message?.content; state.senseiMessages.push({role:"assistant",text:m?String(m).trim():"Hmm, Sensei is speechless! 🍃"}); }
      }catch{ state.senseiMessages.push({role:"assistant",text:"⚠️ Could not reach Sensei. 🙏"}); }
      state.senseiLoading=false; render();
    }

    /* ══════════════════════════════════════════════
       QUIZ
    ══════════════════════════════════════════════ */
    const openQuizRules  = () => { state.quiz.rulesOpen=true; render(); };
    const closeQuizRules = () => { state.quiz.rulesOpen=false; render(); };
    function startQuizFromRules(){ state.quiz={rulesOpen:false,open:true,animeName:"",animeInputTmp:"",questions:[],currentIndex:0,answers:[],loading:false,answerTmp:"",feedbackVisible:false,currentFeedback:null,resultVisible:false,totalXpEarned:0,gemsEarned:0}; render(); }
    function closeQuiz(){ state.quiz={rulesOpen:false,open:false,animeName:"",animeInputTmp:"",questions:[],currentIndex:0,answers:[],loading:false,answerTmp:"",feedbackVisible:false,currentFeedback:null,resultVisible:false,totalXpEarned:0,gemsEarned:0}; render(); }
    async function fetchQuizQuestions(animeName){
      state.quiz.loading=true; state.quiz.animeName=animeName; state.quiz.questions=[]; render();
      try{
        const r=await fetch(API_URL,{method:"POST",headers:{"Authorization":`Bearer ${API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:`You are Anime Sensei, quiz master. Generate exactly ${QUIZ_TOTAL_QUESTIONS} challenging questions. Return ONLY valid JSON array, no markdown. Each item: {"question":"...","answer":"...","hint":"..."}`},{role:"user",content:`Generate ${QUIZ_TOTAL_QUESTIONS} quiz questions about: "${animeName}". JSON only.`}],temperature:.7,max_tokens:1024})});
        const data=await r.json(); if(!r.ok)throw new Error(data?.error?.message||"API Error");
        const raw=(data?.choices?.[0]?.message?.content||"[]").replace(/```json|```/gi,"").trim();
        const qs=JSON.parse(raw); if(!Array.isArray(qs)||!qs.length)throw new Error("No questions");
        state.quiz.questions=qs.slice(0,QUIZ_TOTAL_QUESTIONS);
      }catch(e){ console.error(e); showToast("⚠️ Could not load quiz. Try again!"); state.quiz.animeName=""; }
      state.quiz.loading=false; render();
    }
    async function judgeAnswer(q,correct,user){
      try{
        const r=await fetch(API_URL,{method:"POST",headers:{"Authorization":`Bearer ${API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:`Fair quiz judge. Be lenient with spelling. Return ONLY valid JSON: {"correct":true/false,"explanation":"1-2 sentences"}`},{role:"user",content:`Q: "${q}"\nCorrect: "${correct}"\nUser: "${user}"\nJSON only.`}],temperature:.2,max_tokens:128})});
        const d=await r.json(); const raw=(d?.choices?.[0]?.message?.content||"{}").replace(/```json|```/gi,"").trim(); return JSON.parse(raw);
      }catch{ const m=user.toLowerCase().trim().includes(correct.toLowerCase().trim().split(" ")[0]); return{correct:m,explanation:m?"Your answer matches.":"Your answer did not match."}; }
    }
    async function handleGemsUpdate(delta){ if(!state.currentUser||!delta)return; try{ await runTransaction(db,async tx=>{ const s=await tx.get(getMetaRef(state.currentUser.uid)); if(!s.exists())throw new Error(); tx.update(getMetaRef(state.currentUser.uid),{gems:Math.max(0,Number(s.data().gems||0)+delta),updated_at:serverTimestamp()}); }); }catch(e){console.error(e);} }
    async function handleXPUpdate(delta){ if(!state.currentUser||!delta)return; try{ await runTransaction(db,async tx=>{ const s=await tx.get(getMetaRef(state.currentUser.uid)); if(!s.exists())throw new Error(); const nXp=Math.max(0,Number(s.data().xp||0)+delta); tx.update(getMetaRef(state.currentUser.uid),{xp:nXp,level:lvFromXp(nXp),updated_at:serverTimestamp()}); }); }catch(e){console.error(e);} }
    function showFlash(text,cls){ const el=document.createElement("div"); el.className=cls; el.textContent=text; document.body.appendChild(el); setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el);},1600); }
    const showXpFlash   = d => showFlash(d>=0?`+${d} XP`:`${d} XP`,`quiz-xp-flash ${d>=0?"positive":"negative"}`);
    const showGemsFlash = d => { if(d>0)showFlash(`+${d} 💎 Gems!`,"quiz-gems-flash"); };
    const showGoldFlash = d => { if(d>0)showFlash(`+${d} 🪙 Gold!`,"gold-flash"); else if(d<0)showFlash(`${d} 🪙 Gold`,"gold-flash"); };
    /* ── Pop Sound ── */
    const POP_SND_URL = "https://raw.githubusercontent.com/yasin636/anime-card-assets/main/pop.mp3";
    let _popAudio = null;
    function playPopSound(){
      try{
        if(!_popAudio){ _popAudio = new Audio(POP_SND_URL); _popAudio.volume=0.45; }
        const s = _popAudio.cloneNode();
        s.volume = 0.45;
        s.play().catch(()=>{});
      }catch{}
    }

    /* ── Level-Up Modal ── */
    function showLevelUpModal(newLevel, title){
      // Remove existing
      const existing = document.getElementById("levelup-overlay");
      if(existing) existing.remove();
      const overlay = document.createElement("div");
      overlay.id    = "levelup-overlay";
      overlay.className = "levelup-overlay";
      overlay.innerHTML = `
        <div class="levelup-card">
          <div class="levelup-glow-ring"></div>
          <div class="levelup-icon">⚡</div>
          <div class="levelup-congrats">LEVEL UP!</div>
          <div class="levelup-level">Level ${newLevel}</div>
          <div class="levelup-title">${escapeHtml(title)}</div>
          <div class="levelup-sub">Your power grows, Ninja! 🔥</div>
          <button class="levelup-close-btn" id="levelup-close-btn">Awesome! 🎉</button>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(()=>overlay.classList.add("visible"));
      document.getElementById("levelup-close-btn").onclick = ()=>{
        overlay.classList.remove("visible");
        setTimeout(()=>overlay.remove(), 350);
      };
    }

    /* Track previous level to detect level-up in XP transactions */
    let _prevLevel = 0;
    function checkAndShowLevelUp(newXp){
      const info = getLevelInfo(newXp);
      if(_prevLevel > 0 && info.level > _prevLevel){
        setTimeout(()=>showLevelUpModal(info.level, info.title), 400);
      }
      _prevLevel = info.level;
    }

    async function submitQuizAnswer(){
      const q=state.quiz; if(q.loading||q.feedbackVisible)return;
      const cur=q.questions[q.currentIndex]; if(!cur)return;
      const ans=(q.answerTmp||"").trim(); if(!ans)return;
      q.loading=true; q.answerTmp=""; render();
      const j=await judgeAnswer(cur.question,cur.answer,ans);
      const xpD=j.correct?QUIZ_XP_CORRECT:QUIZ_XP_WRONG;
      q.answers.push({status:j.correct?"correct":"wrong",xpD,explanation:j.explanation});
      q.totalXpEarned+=xpD;
      q.currentFeedback={status:j.correct?"correct":"wrong",xpD,explanation:j.explanation,correctAnswer:cur.answer};
      q.loading=false; q.feedbackVisible=true; render();
      await handleXPUpdate(xpD); showXpFlash(xpD);
    }
    async function skipQuizQuestion(){
      const q=state.quiz; if(q.loading||q.feedbackVisible)return;
      const cur=q.questions[q.currentIndex]; if(!cur)return;
      q.answers.push({status:"skip",xpD:QUIZ_XP_SKIP,explanation:""});
      q.totalXpEarned+=QUIZ_XP_SKIP;
      q.currentFeedback={status:"skip",xpD:QUIZ_XP_SKIP,explanation:`Correct: ${cur.answer}`,correctAnswer:cur.answer};
      q.feedbackVisible=true; render();
      await handleXPUpdate(QUIZ_XP_SKIP); showXpFlash(QUIZ_XP_SKIP);
    }
    function nextQuizQuestion(){
      const q=state.quiz; q.feedbackVisible=false; q.currentFeedback=null; q.currentIndex++;
      if(q.currentIndex>=q.questions.length){
        const correct=q.answers.filter(a=>a.status==="correct").length;
        const gems=correct===QUIZ_TOTAL_QUESTIONS?10:correct===QUIZ_TOTAL_QUESTIONS-1?5:0;
        q.gemsEarned=gems; q.resultVisible=true;
        if(gems>0){handleGemsUpdate(gems);setTimeout(()=>showGemsFlash(gems),600);}
        incrementMissionProgress("communityActions",1);
      }
      render();
    }

    /* ══════════════════════════════════════════════
       NEW SOCIAL FEED — Full System
       XP Engine:
         Creator: +15 new post, +1 per like received, +3 per comment received, +5 per share
         Interactor: +5 give like, +10 post comment, +5 share
         Penalties: unlike -5 from interactor, delete comment -10 from interactor
         Creator does NOT lose XP on post delete (they keep received like/comment xp),
         but loses the +15 posting xp when deleting their own post.
         7-day auto-hide (except admin).
    ══════════════════════════════════════════════ */

    const POST_XP_CREATE    = 15;   // creator earns for posting
    const POST_XP_LIKE_GET  = 1;    // creator earns per like received
    const POST_XP_CMT_GET   = 3;    // creator earns per comment received
    const POST_XP_SHARE_GET = 5;    // creator earns per share
    const POST_XP_LIKE_GIVE = 5;    // interactor earns for liking
    const POST_XP_CMT_GIVE  = 10;   // interactor earns for commenting
    const POST_XP_SHARE_GIVE= 5;    // interactor earns for sharing
    const POST_7DAY_MS      = 7 * 24 * 60 * 60 * 1000; // 7 days

    /* ── Media upload helpers (base64 for Firestore) ── */
    function readFileAsDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=()=>rej(new Error("Read failed")); r.readAsDataURL(file); }); }

    /* ── Create Post ── */
    async function createPost(){
      if(!state.currentUser) return;
      const captionEl = document.getElementById("post-caption");
      const caption   = (captionEl?.value||"").trim();
      if(!caption){ showToast("⚠️ Caption / Text লিখো!"); return; }

      const uid      = state.currentUser.uid;
      const isAdmin  = (state.profile.username||"").trim() === ADMIN_NAME;
      const today    = todayKey();

      // Check daily post limit (admin exempt)
      if(!isAdmin){
        const act = state.postActivity || { day_key:"", count:0 };
        const todayCnt = act.day_key===today ? Number(act.count||0) : 0;
        if(todayCnt >= 10){ showToast("⚠️ Daily post limit (10) reached!"); return; }
      }

      // Media handling
      let mediaUrl = ""; let mediaType = ""; // "image"|"video"|""
      const mediaFile = state.feed.pendingMediaFile;
      if(mediaFile){
        try{
          if(mediaFile.size > 8*1024*1024){ showToast("⚠️ File too large (max 8MB)"); return; }
          mediaUrl  = await readFileAsDataUrl(mediaFile);
          mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
        }catch{ showToast("⚠️ Media read failed"); return; }
      }

      // Link
      const linkUrl = (state.feed.pendingLink||"").trim();
      state.feed.posting = true; render();

      try{
        await runTransaction(db, async tx=>{
          const [ms,as] = await Promise.all([tx.get(getMetaRef(uid)), tx.get(getActivityRef(uid))]);
          if(!ms.exists()) throw new Error();
          const meta = ms.data();
          const act  = as.exists() ? as.data() : {day_key:"",count:0};
          let cnt = Number(act.count||0); if(String(act.day_key||"")!==today) cnt=0;

          const pRef = doc(collection(db,"feed_posts"));
          tx.set(pRef,{
            uid, username:meta.username||"Otaku", avatar:meta.avatar||AVATARS[0],
            gems:Number(meta.gems||0), equippedTheme:meta.equippedTheme||"",
            caption, mediaUrl, mediaType, linkUrl,
            likesCount:0, likedBy:{}, shareCount:0,
            comments:[], reactions:{},
            created_at:serverTimestamp(), created_at_ms:Date.now(),
            isAdmin: !!isAdmin
          });
          tx.set(getActivityRef(uid),{uid,day_key:today,count:cnt+1,updated_at:serverTimestamp()},{merge:true});
          // Creator earns +15 XP for posting
          const nXp = Number(meta.xp||0) + POST_XP_CREATE;
          tx.update(getMetaRef(uid),{xp:nXp, level:lvFromXp(nXp), updated_at:serverTimestamp()});
        });
        // Reset feed state
        if(captionEl) captionEl.value="";
        state.feed.pendingMediaFile = null; state.feed.pendingMediaPreview = "";
        state.feed.pendingLink = ""; state.feed.showLinkInput = false;
        showToast(`✅ Post published! +${POST_XP_CREATE} XP`);
        showXpFlash(POST_XP_CREATE);
        await incrementMissionProgress("postsCreated",1);
      }catch(e){ console.error(e); showToast("❌ Could not post. Try again."); }
      state.feed.posting = false; render();
    }

    /* ── Like Post ── */
    async function likePost(postId){
      if(!state.currentUser) return;
      const uid = state.currentUser.uid;
      const postBefore = state.posts.find(p=>p.id===postId);
      const wasLiked   = Boolean(postBefore?.likedBy?.[uid]);
      const creatorUid = postBefore?.uid||"";
      try{
        await runTransaction(db, async tx=>{
          const ps = await tx.get(getPostRef(postId));
          if(!ps.exists()) throw new Error();
          const post = ps.data();
          const likedBy = {...(post.likedBy||{})};
          const already = Boolean(likedBy[uid]);
          let cnt = Number(post.likesCount||0);
          if(already){ delete likedBy[uid]; cnt=Math.max(0,cnt-1); }
          else        { likedBy[uid]=true;  cnt++; }
          tx.update(getPostRef(postId),{likedBy, likesCount:cnt, updated_at:serverTimestamp()});

          // Interactor XP: +5 give, -5 unlike (penalty on self)
          if(uid !== creatorUid){
            const ms = await tx.get(getMetaRef(uid));
            if(ms.exists()){
              const interactorDelta = already ? -POST_XP_LIKE_GIVE : POST_XP_LIKE_GIVE;
              const nXpI = Math.max(0, Number(ms.data().xp||0) + interactorDelta);
              tx.update(getMetaRef(uid),{xp:nXpI, level:lvFromXp(nXpI), updated_at:serverTimestamp()});
            }
          }
          // Creator XP: +1 per like received. Creator does NOT lose XP on unlike.
          if(creatorUid && creatorUid!==uid && !already){
            const cs = await tx.get(getMetaRef(creatorUid));
            if(cs.exists()){
              const nXpC = Number(cs.data().xp||0) + POST_XP_LIKE_GET;
              tx.update(getMetaRef(creatorUid),{xp:nXpC, level:lvFromXp(nXpC), updated_at:serverTimestamp()});
            }
          }
        });
        if(!wasLiked){
          showToast(`👍 Liked! +${POST_XP_LIKE_GIVE} XP`);
          showXpFlash(POST_XP_LIKE_GIVE);
          await incrementMissionProgress("socialActions",1);
        } else {
          showToast(`Unlike. -${POST_XP_LIKE_GIVE} XP`);
          showXpFlash(-POST_XP_LIKE_GIVE);
        }
      }catch(e){ console.error(e); showToast("Could not update like."); }
    }

    /* ── Comment Post ── */
    async function commentPost(postId){
      if(!state.currentUser) return;
      const inp = document.getElementById(`sf-comment-input-${postId}`);
      const text = (inp?.value||"").trim(); if(!text) return;
      const uid  = state.currentUser.uid;
      const creatorUid = (state.posts.find(p=>p.id===postId)||{}).uid||"";
      try{
        await runTransaction(db, async tx=>{
          const [ps,ms] = await Promise.all([tx.get(getPostRef(postId)), tx.get(getMetaRef(uid))]);
          if(!ps.exists()||!ms.exists()) throw new Error();
          const comments = Array.isArray(ps.data().comments) ? [...ps.data().comments] : [];
          comments.push({id:`${Date.now()}-${uid}`,uid,username:state.profile.username||"Otaku",avatar:state.profile.avatar||AVATARS[0],text,createdAtMs:Date.now()});
          tx.update(getPostRef(postId),{comments, updated_at:serverTimestamp()});
          // Interactor +10 XP
          const nXpI = Number(ms.data().xp||0) + POST_XP_CMT_GIVE;
          tx.update(getMetaRef(uid),{xp:nXpI, level:lvFromXp(nXpI), updated_at:serverTimestamp()});
          // Creator +3 XP per comment (only if not self-comment)
          if(creatorUid && creatorUid!==uid){
            const cs = await tx.get(getMetaRef(creatorUid));
            if(cs.exists()){
              const nXpC = Number(cs.data().xp||0) + POST_XP_CMT_GET;
              tx.update(getMetaRef(creatorUid),{xp:nXpC, level:lvFromXp(nXpC), updated_at:serverTimestamp()});
            }
          }
        });
        if(inp) inp.value="";
        showToast(`💬 Comment posted! +${POST_XP_CMT_GIVE} XP`);
        showXpFlash(POST_XP_CMT_GIVE);
        await incrementMissionProgress("socialActions",1);
      }catch(e){ console.error(e); showToast("Could not comment."); }
    }

    /* ── Delete Post (creator loses +15 XP they earned from posting) ── */
    async function deletePost(postId){
      if(!state.currentUser) return;
      showNeonModal({
        title:"⚠️ Delete Post",
        body:`<div style="text-align:center;padding:6px 0;">
          <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
          <div style="color:#fde68a;font-weight:800;margin-bottom:6px;">Warning!</div>
          <div style="color:#f5edff;font-size:13px;line-height:1.5;">Deleting this post will remove the <strong style="color:#f87171;">${POST_XP_CREATE} XP</strong> you earned for posting it.<br/>Proceed?</div>
        </div>`,
        okText:"🗑️ DELETE", cancelText:"✗ NO, KEEP", danger:true,
        onOk: async()=>{
          const uid = state.currentUser.uid;
          try{
            await runTransaction(db, async tx=>{
              const ps = await tx.get(getPostRef(postId));
              if(!ps.exists()) throw new Error();
              if(ps.data().uid !== uid) throw new Error("not-owner");
              await tx.delete ? tx.delete(getPostRef(postId)) : deleteDoc(getPostRef(postId));
              // Creator loses -15 XP
              const ms = await tx.get(getMetaRef(uid));
              if(ms.exists()){
                const nXp = Math.max(0, Number(ms.data().xp||0) - POST_XP_CREATE);
                tx.update(getMetaRef(uid),{xp:nXp, level:lvFromXp(nXp), updated_at:serverTimestamp()});
              }
            });
            showToast(`🗑️ Post deleted. -${POST_XP_CREATE} XP`);
            showXpFlash(-POST_XP_CREATE);
          }catch(e){
            // Fallback: just delete doc
            try{ await deleteDoc(getPostRef(postId)); showToast("Post deleted."); }catch{ showToast("Failed to delete."); }
          }
        }
      });
    }

    /* ── Share / Copy Link (+5 XP to both interactor and creator) ── */
    async function sharePost(postId){
      try{
        await navigator.clipboard.writeText(`${location.origin}${location.pathname}#post-${postId}`);
        showToast(`🔗 Link copied! +${POST_XP_SHARE_GIVE} XP`);
        showXpFlash(POST_XP_SHARE_GIVE);
        if(!state.currentUser) return;
        const uid = state.currentUser.uid;
        const post = state.posts.find(p=>p.id===postId);
        const creatorUid = post?.uid||"";
        try{
          await runTransaction(db, async tx=>{
            // Increment share count
            const ps = await tx.get(getPostRef(postId));
            if(ps.exists()) tx.update(getPostRef(postId),{shareCount:(Number(ps.data().shareCount||0)+1), updated_at:serverTimestamp()});
            // Interactor +5 XP
            const ms = await tx.get(getMetaRef(uid));
            if(ms.exists()){
              const nXpI = Number(ms.data().xp||0) + POST_XP_SHARE_GIVE;
              tx.update(getMetaRef(uid),{xp:nXpI, level:lvFromXp(nXpI), updated_at:serverTimestamp()});
            }
            // Creator +5 XP
            if(creatorUid && creatorUid!==uid){
              const cs = await tx.get(getMetaRef(creatorUid));
              if(cs.exists()){
                const nXpC = Number(cs.data().xp||0) + POST_XP_SHARE_GET;
                tx.update(getMetaRef(creatorUid),{xp:nXpC, level:lvFromXp(nXpC), updated_at:serverTimestamp()});
              }
            }
          });
        }catch(e){ console.error("Share XP:", e); }
      }catch{ showToast("❌ Copy failed."); }
    }

    /* ── Delete Comment: interactor loses -10 XP (penalty). Creator keeps their +3. ── */
    function deleteComment(postId, commentId){
      showNeonModal({
        title:"🗑️ Delete Comment",
        body:`Deleting this comment will deduct <strong style="color:#f87171;">-${POST_XP_CMT_GIVE} XP</strong> from you. Proceed?`,
        okText:"✓ Delete", cancelText:"✗ Keep", danger:true,
        onOk: async()=>{
          if(!state.currentUser) return;
          const uid = state.currentUser.uid;
          try{
            await runTransaction(db, async tx=>{
              const [ps,ms] = await Promise.all([tx.get(getPostRef(postId)), tx.get(getMetaRef(uid))]);
              if(!ps.exists()||!ms.exists()) throw new Error();
              const comments = (ps.data().comments||[]).filter(c=>c.id!==commentId);
              tx.update(getPostRef(postId),{comments, updated_at:serverTimestamp()});
              // Interactor penalty: -10 XP
              const nXp = Math.max(0, Number(ms.data().xp||0) - POST_XP_CMT_GIVE);
              tx.update(getMetaRef(uid),{xp:nXp, level:lvFromXp(nXp), updated_at:serverTimestamp()});
            });
            showXpFlash(-POST_XP_CMT_GIVE);
            showToast(`Comment deleted. -${POST_XP_CMT_GIVE} XP`);
          }catch(e){ console.error(e); showToast("Could not delete comment."); }
        }
      });
    }

    /* ── Edit Comment ── */
    async function editComment(postId, commentId, newText){
      if(!state.currentUser||!newText.trim()) return;
      try{
        const ps = await getDoc(getPostRef(postId));
        if(!ps.exists()) return;
        const comments = (ps.data().comments||[]).map(c=>c.id===commentId?{...c,text:newText.trim(),edited:true}:c);
        await updateDoc(getPostRef(postId),{comments, updated_at:serverTimestamp()});
        showToast("Comment updated.");
      }catch(e){ console.error(e); showToast("Could not edit comment."); }
    }

    /* ── Edit Post Caption ── */
    async function editPost(postId, newCaption){
      if(!state.currentUser||!newCaption.trim()) return;
      try{
        await updateDoc(getPostRef(postId),{caption:newCaption.trim(), edited:true, updated_at:serverTimestamp()});
        showToast("Post updated.");
      }catch(e){ console.error(e); showToast("Could not edit post."); }
    }

    /* ── React to post (emoji reactions) ── */
    async function reactToPost(postId, emoji){
      if(!state.currentUser) return;
      const uid = state.currentUser.uid;
      try{
        await runTransaction(db, async tx=>{
          const ps = await tx.get(getPostRef(postId)); if(!ps.exists()) throw new Error();
          const reactions = ps.data().reactions||{};
          const prev = Object.keys(reactions).find(e=>reactions[e]?.includes(uid));
          if(prev){ reactions[prev]=(reactions[prev]||[]).filter(u=>u!==uid); if(reactions[prev].length===0)delete reactions[prev]; }
          if(prev!==emoji){ if(!reactions[emoji])reactions[emoji]=[]; reactions[emoji].push(uid); }
          tx.update(getPostRef(postId),{reactions, updated_at:serverTimestamp()});
        });
      }catch(e){ console.error(e); }
    }

    /* ── 7-Day Auto-Hide Filter ── */
    function filterActivePosts(posts){
      const now = Date.now();
      return posts.filter(p=>{
        if(p.isAdmin) return true; // admin posts never auto-hide
        const age = now - Number(p.created_at_ms||0);
        return age < POST_7DAY_MS;
      });
    }

    /* ── Watchlist ── */
    async function importAnime(){
      if(!state.currentUser)return;
      const title=(document.getElementById("import-input")?.value||"").trim(); if(!title)return;
      const tracker=[...state.profile.tracker];
      if(tracker.some(t=>String(t.title).toLowerCase()===title.toLowerCase()))return alert("Already in tracker.");
      tracker.unshift({id:Date.now(),title,episode:1});
      await updateDoc(getMetaRef(state.currentUser.uid),{tracker,updated_at:serverTimestamp()});
      state.showImportModal=false; state.animeSearch=""; render(); showToast("Anime imported.");
      await incrementMissionProgress("animeAdded",1);
    }
    async function incEpisode(id){ if(!state.currentUser)return; const tracker=state.profile.tracker.map(t=>Number(t.id)===Number(id)?{...t,episode:Number(t.episode||0)+1}:t); await updateDoc(getMetaRef(state.currentUser.uid),{tracker,updated_at:serverTimestamp()}); }
    async function removeAnime(id){  if(!state.currentUser)return; const tracker=state.profile.tracker.filter(t=>Number(t.id)!==Number(id)); await updateDoc(getMetaRef(state.currentUser.uid),{tracker,updated_at:serverTimestamp()}); }

    /* ── Profile edits ── */
    async function saveBio(){ if(!state.currentUser)return; const bio=(document.getElementById("bio-input")?.value||"").trim(); await updateDoc(getMetaRef(state.currentUser.uid),{Bio:bio,updated_at:serverTimestamp()}); showToast("Bio saved."); }
    async function saveUsername(){ if(!state.currentUser)return; const v=(document.getElementById("username-input")?.value||"").trim(); if(!v)return alert("Empty!"); await updateDoc(getMetaRef(state.currentUser.uid),{username:v,updated_at:serverTimestamp()}); state.isEditingName=false; render(); showToast("Username updated."); }
    async function setAvatar(url){ if(!state.currentUser)return; await updateDoc(getMetaRef(state.currentUser.uid),{avatar:url,updated_at:serverTimestamp()}); state.showAvatarPicker=false; render(); showToast("Avatar updated!"); }

    /* ── Profile pic from gallery (file upload → base64) ── */
    function handleProfilePicUpload(file){
      if(!file||!state.currentUser)return;
      if(!file.type.startsWith("image/")){ showToast("শুধু image file সাপোর্ট করে।"); return; }
      if(file.size>2*1024*1024){ showToast("File size ২ MB-এর বেশি হবে না।"); return; }
      const reader=new FileReader();
      reader.onload=async e=>{
        const dataUrl=e.target.result;
        try{
          await updateDoc(getMetaRef(state.currentUser.uid),{avatar:dataUrl,updated_at:serverTimestamp()});
          state.showAvatarPicker=false; render(); showToast("✅ Profile picture updated!");
        }catch(err){ console.error(err); showToast("Upload failed. Try again."); }
      };
      reader.readAsDataURL(file);
    }
    async function claimDailyActual(){
      if(!state.currentUser)return;
      try{
        await runTransaction(db,async tx=>{
          const s=await tx.get(getMetaRef(state.currentUser.uid)); if(!s.exists())throw new Error();
          const last=s.data().last_claim_date?.toMillis?s.data().last_claim_date.toMillis():0;
          if(Date.now()-last<DAY_MS)throw new Error("cooldown");
          const nXp=Number(s.data().xp||0)+20;
          tx.update(getMetaRef(state.currentUser.uid),{xp:nXp,level:lvFromXp(nXp),last_claim_date:Timestamp.now(),updated_at:serverTimestamp()});
          checkAndShowLevelUp(nXp);
        });
        sfxXpClaim(); showToast("✅ Daily +20 XP claimed!");
      }catch{ showToast("⏳ Daily reward not ready yet!"); }
    }
    function claimDaily(){
      showNeonModal({
        title:"🎁 Daily Reward", body:"আজকের Daily +20 XP reward নেবেন?",
        okText:"✓ হ্যাঁ, নেই", cancelText:"✗ পরে",
        onOk: claimDailyActual
      });
    }

    /* ══════════════════════════════════════════════
       CHAT
    ══════════════════════════════════════════════ */
    function renderChatSearchHTML(){
      const q=state.chatSearchTerm.trim().toLowerCase(); if(!q)return"";
      const res=state.allUsers.filter(u=>u.uid!==state.currentUser?.uid&&u.username.toLowerCase().includes(q));
      if(!res.length)return`<div class="meta">No user found.</div>`;
      return res.map(u=>`<div class="search-result-card"><div class="chat-user-row">
        <div class="chat-avatar ${getUserGlowClass(u.gems)}"><img src="${escapeHtml(u.avatar)}" alt="" />${isOnline(u)?'<span class="online-dot"></span>':""}</div>
        <div style="flex:1;"><div style="font-weight:700;">${escapeHtml(u.username)} ${renderBadgeLabel(u.gems)}</div><div class="meta">${isOnline(u)?"Online":"Offline"}</div></div>
        <button class="btn btn-brand" data-start-chat="${u.uid}">Chat</button>
      </div></div>`).join("");
    }
    function renderRecentChatsHTML(){
      const users=(state.profile.recentChats||[]).map(id=>getUserById(id)).filter(Boolean);
      if(!users.length)return`<div class="meta">No recent chats.</div>`;
      return users.map(u=>`<div class="recent-chat-item"><div class="chat-user-row">
        <button data-open-chat="${u.uid}" style="all:unset;display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;">
          <div class="chat-avatar ${getUserGlowClass(u.gems)}"><img src="${escapeHtml(u.avatar)}" alt="" />${isOnline(u)?'<span class="online-dot"></span>':""}</div>
          <div><div style="font-weight:700;">${escapeHtml(u.username)} ${renderBadgeLabel(u.gems)}</div><div class="meta">${isOnline(u)?"Online":"Offline"}</div></div>
        </button>
        <button class="remove-chat-btn" data-remove-chat="${u.uid}">x</button>
      </div></div>`).join("");
    }
    function bindDynamicChat(){
      document.querySelectorAll("[data-start-chat]").forEach(b=>b.onclick=()=>openChatWithUser(b.getAttribute("data-start-chat")));
      document.querySelectorAll("[data-open-chat]").forEach(b=>b.onclick=()=>openChatWithUser(b.getAttribute("data-open-chat")));
      document.querySelectorAll("[data-remove-chat]").forEach(b=>b.onclick=()=>removeRecentChat(b.getAttribute("data-remove-chat")));
    }
    function updateChatSearchResults(){ const w=document.getElementById("chat-search-results"); const l=document.getElementById("chat-search-label"); if(!w||!l)return; const has=state.chatSearchTerm.trim().length>0; l.classList.toggle("hidden",!has); w.innerHTML=has?renderChatSearchHTML():""; bindDynamicChat(); }
    function updateRecentList(){ const w=document.getElementById("chat-recent-list"); if(!w)return; w.innerHTML=renderRecentChatsHTML(); bindDynamicChat(); }
    async function openChatWithUser(uid){
      if(!state.currentUser||!uid)return;
      state.activeChatUserId=uid; state.globalChatOpen=false;
      const myUid = state.currentUser.uid;
      // Auto-save to recentChats
      const recent=[...(state.profile.recentChats||[])];
      if(!recent.includes(uid)){recent.unshift(uid);await updateDoc(getMetaRef(myUid),{recentChats:recent.slice(0,30),updated_at:serverTimestamp()});}
      if(state.chatMessagesUnsub){state.chatMessagesUnsub();state.chatMessagesUnsub=null;}
      const chatId=getChatId(myUid,uid);
      // Ensure chat doc exists (creates inbox entry for both parties)
      await setDoc(getChatRef(chatId),{chatId,participants:[myUid,uid],updatedAtMs:Date.now(),updatedAt:serverTimestamp()},{merge:true});
      // Clear unread badge for me
      const myUnreadKey = `unread_${myUid}`;
      await updateDoc(getChatRef(chatId),{[myUnreadKey]:0}).catch(()=>{});
      state.chatMessagesUnsub=onSnapshot(query(getChatMsgCol(chatId),orderBy("createdAtMs","asc"),limit(300)),snap=>{state.chatMessages=snap.docs.map(d=>({id:d.id,...d.data()}));render();});
      render();
    }
    function closeChatWindow(){ state.activeChatUserId=null; state.chatMessages=[]; if(state.chatMessagesUnsub){state.chatMessagesUnsub();state.chatMessagesUnsub=null;} render(); }
    async function sendChatMessage(){
      if(!state.currentUser||!state.activeChatUserId)return;
      const inp=document.getElementById("chat-message-input"); const text=(inp?.value||"").trim(); if(!text)return;
      const chatId=getChatId(state.currentUser.uid,state.activeChatUserId);
      try{
        const myUid   = state.currentUser.uid;
        const otherUid = state.activeChatUserId;
        const msgMs    = Date.now();
        await addDoc(getChatMsgCol(chatId),{senderId:myUid,senderName:state.profile.username||"Otaku",senderAvatar:state.profile.avatar||AVATARS[0],senderGems:state.profile.gems||0,senderTheme:state.profile.equippedTheme||"",text,createdAtMs:msgMs,createdAt:serverTimestamp()});
        // Update chat metadata: last message + bump other user's unread counter
        const unreadKey = `unread_${otherUid}`;
        await setDoc(getChatRef(chatId),{
          chatId, participants:[myUid,otherUid],
          updatedAtMs:msgMs, updatedAt:serverTimestamp(),
          lastText:text, lastSenderId:myUid,
          [unreadKey]: (state.chatInbox.find(c=>c.chatId===chatId)?.[`unread_${otherUid}`]||0)+1
        },{merge:true});
        if(inp)inp.value="";
        playPopSound();
      }catch{alert("Send failed.");}
    }
    async function removeRecentChat(uid){ if(!state.currentUser)return; const next=(state.profile.recentChats||[]).filter(id=>id!==uid); await updateDoc(getMetaRef(state.currentUser.uid),{recentChats:next,updated_at:serverTimestamp()}); if(state.activeChatUserId===uid)closeChatWindow(); else updateRecentList(); }

    /* ── Global Chat ── */
    function openGlobalChat(){
      state.globalChatOpen=true; state.activeChatUserId=null;
      if(state.chatMessagesUnsub){state.chatMessagesUnsub();state.chatMessagesUnsub=null;}
      if(state.globalChatUnsub){state.globalChatUnsub();state.globalChatUnsub=null;}
      state.globalChatUnsub=onSnapshot(query(collection(db,"global_messages"),orderBy("createdAtMs","asc"),limit(200)),snap=>{state.globalMessages=snap.docs.map(d=>({id:d.id,...d.data(),reactions:d.data().reactions||{}}));render();});
      render();
    }
    function closeGlobalChat(){ state.globalChatOpen=false; state.globalMessages=[]; if(state.globalChatUnsub){state.globalChatUnsub();state.globalChatUnsub=null;} render(); }
    async function sendGlobalMessage(){
      if(!state.currentUser)return;
      const inp=document.getElementById("global-chat-input"); const text=(inp?.value||"").trim(); if(!text)return;
      try{
        await addDoc(collection(db,"global_messages"),{senderId:state.currentUser.uid,senderName:state.profile.username||"Otaku",senderAvatar:state.profile.avatar||AVATARS[0],senderGems:state.profile.gems||0,senderTheme:state.profile.equippedTheme||"",text,createdAtMs:Date.now(),createdAt:serverTimestamp()});
        if(inp)inp.value="";
        playPopSound();
        await incrementMissionProgress("communityActions",1);
      }catch{alert("Send failed.");}
    }

    /* ── Message Reactions (Global Chat) ── */
    async function toggleReaction(msgId, emoji){
      if(!state.currentUser)return;
      const uid = state.currentUser.uid;
      try{
        // Find message in Firestore — global_messages collection
        const msgRef = doc(db,"global_messages",msgId);
        await runTransaction(db,async tx=>{
          const snap = await tx.get(msgRef);
          if(!snap.exists()) return;
          const data = snap.data();
          const reactions = data.reactions ? JSON.parse(JSON.stringify(data.reactions)) : {};
          if(!reactions[emoji]) reactions[emoji]=[];
          const idx = reactions[emoji].indexOf(uid);
          if(idx>=0) reactions[emoji].splice(idx,1); // toggle off
          else reactions[emoji].push(uid);             // toggle on
          // Clean up empty arrays
          if(reactions[emoji].length===0) delete reactions[emoji];
          tx.update(msgRef,{reactions});
        });
      }catch(e){console.error("Reaction error:",e);}
    }

    /* ── Show / hide reaction picker on bubble click ── */
    function handleReactionPickerToggle(msgId){
      // Hide all other open pickers first
      document.querySelectorAll(".rxn-picker.visible").forEach(el=>{
        if(el.id !== `rxnpick-${msgId}`) el.classList.remove("visible");
      });
      const picker = document.getElementById(`rxnpick-${msgId}`);
      if(picker) picker.classList.toggle("visible");
    }

    /* ══════════════════════════════════════════════
       RENDER HELPERS
    ══════════════════════════════════════════════ */
    function renderCardVisual(card,compact=false){
      if(!card)return"";
      const img=card.image||fallbackAvatar(card.name);
      return`<div class="card-display ${card.rarity}" style="${compact?"min-height:100px;":""}">
        ${card.rarity==="legendary"?'<div class="legendary-holo"></div>':""}
        <div class="card-img-layer"><img src="${escapeHtml(img)}" alt="${escapeHtml(card.name)}" class="card-img-cover" /></div>
        <div class="card-top"><span class="rarity-badge">${escapeHtml(card.rarity.toUpperCase())}</span></div>
        <div class="card-bottom"><p class="char-name">${escapeHtml(card.name)}</p></div>
      </div>`;
    }
    function renderSlot(id,card,clickable){
      const label=id.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase());
      return card
        ?`<button class="profile-slot-wrap filled ${card.rarity}" ${clickable?`data-unequip-slot="${id}"`:""} title="${card.rarity.toUpperCase()}: ${card.name}">${renderCardVisual(card,true)}</button>`
        :`<button class="profile-slot-wrap empty" title="${label}">${label}</button>`;
    }
    function renderSlots(slots,clickable){
      const s=slots||{};
      return`<div class="profile-slots-grid-6">
        ${SLOT_IDS.map(id=>renderSlot(id,s[id],clickable)).join("")}
      </div>`;
    }
    const medalForRank = r => r===1?"💎":r===2?"🥇":r===3?"🥈":"";

    /* ══════════════════════════════════════════════
       MISSION VIEWS
    ══════════════════════════════════════════════ */
    function missionResetCountdown(){ const now=new Date(); const mid=new Date(now); mid.setHours(24,0,0,0); const d=mid-now; return`${Math.floor(d/3600000)}h ${Math.floor((d%3600000)/60000)}m`; }
    function viewDailyMissionsInner(){
      const cards=MISSIONS.map(m=>{
        const prog=state.missions.progress[m.trackKey]||0;
        const pct=Math.min(100,Math.round((prog/m.goal)*100));
        const complete=isMissionComplete(m); const claimed=isMissionClaimed(m);
        let cls="mission-card"; if(claimed)cls+=" claimed"; else if(complete)cls+=" completed";
        const {gold,xp,gems}=m.reward;
        const btn=claimed?`<button class="mission-claim-btn done" disabled>✅ Claimed</button>`:complete?`<button class="mission-claim-btn ready" data-claim-mission="${m.id}">🎉 Claim Reward</button>`:"";
        return`<div class="${cls}">
          <div class="mission-top">
            <div class="mission-info"><div class="mission-name">${m.name}</div><div class="mission-desc">${m.desc}</div></div>
            <div class="mission-rewards">
              <span class="mission-reward-chip gold-r">🪙${gold}</span>
              <span class="mission-reward-chip xp-r">⚡${xp}XP</span>
              <span class="mission-reward-chip gem-r">💎${gems}</span>
            </div>
          </div>
          <div class="mission-progress-row">
            <div class="mission-progress-bar"><span style="width:${pct}%;"></span></div>
            <div class="mission-progress-text">${prog}/${m.goal}</div>
          </div>
          ${btn}
        </div>`;
      }).join("");
      return`<div class="missions-list">${cards}</div>`;
    }

    /* ══════════════════════════════════════════════
       THEME STORE VIEW
    ══════════════════════════════════════════════ */
    function viewThemeStore(){
      const open=state.shop.themeStoreOpen;
      const equippedId=getEquippedTheme();
      const ownedCount=(state.profile.inventory?.themes||[]).length;

      const themeCards=THEMES.map(theme=>{
        const owned=ownsTheme(theme.id);
        const equipped=equippedId===theme.id;
        const canAfford=Number(state.profile.gold||0)>=theme.price;

        let btnHtml;
        if(equipped){
          btnHtml=`<button class="theme-equip-btn equipped" data-unequip-theme="${theme.id}">✨ Equipped</button>`;
        } else if(owned){
          btnHtml=`<button class="theme-equip-btn owned" data-equip-theme="${theme.id}">▶ Equip</button>`;
        } else {
          btnHtml=`<button class="theme-buy-btn ${canAfford?"":"cant-afford"}" data-buy-theme="${theme.id}" ${canAfford?"":""}>
            ${canAfford?`🪙 Buy — ${theme.price.toLocaleString()}`:`🔒 ${theme.price.toLocaleString()} Gold`}
          </button>`;
        }

        return`<div class="theme-card ${owned?'owned':''} ${equipped?'equipped':''}">
          <div class="theme-preview-box ${theme.cssClass}-preview">
            <div class="theme-card-aura"></div>
            <div class="theme-preview-emoji">${theme.emoji}</div>
          </div>
          <div class="theme-card-info">
            <div class="theme-card-name">${theme.name}</div>
            <div class="theme-card-desc">${theme.desc}</div>
            ${owned?`<div class="theme-owned-badge">✅ Owned</div>`:`<div class="theme-price-tag">🪙 ${theme.price.toLocaleString()} Gold</div>`}
          </div>
          ${btnHtml}
        </div>`;
      }).join("");

      return`<section class="panel theme-store-panel">
        <button class="missions-accordion-header" id="toggle-theme-store">
          <div class="missions-accordion-left">
            <span class="missions-accordion-icon">🎨</span>
            <div>
              <div class="missions-accordion-title" style="color:#c4b5fd;">Premium Theme Store</div>
              <div class="missions-accordion-sub">${ownedCount}/${THEMES.length} owned • spend 🪙 Gold</div>
            </div>
          </div>
          <div class="missions-accordion-right">
            ${equippedId?`<span class="missions-claim-badge" style="background:rgba(139,92,246,.2);border-color:rgba(167,139,250,.6);color:#c4b5fd;">Active</span>`:""}
            <span class="missions-accordion-arrow ${open?"open":""}">▼</span>
          </div>
        </button>
        <div class="missions-accordion-body ${open?"open":""}">
          <div class="missions-accordion-inner">
            <div class="theme-store-grid">${themeCards}</div>
          </div>
        </div>
      </section>`;
    }

    /* ══════════════════════════════════════════════
       QUIZ VIEWS
    ══════════════════════════════════════════════ */
    function viewQuizRulesModal(){
      if(!state.quiz.rulesOpen)return"";
      return`<div class="quiz-rules-overlay"><div class="quiz-rules-card">
        <div class="quiz-rules-header"><span class="quiz-rules-icon">🎯</span><h2 class="quiz-rules-heading">Anime Quiz Challenge</h2><div style="font-size:12px;color:#93c5fd;margin-top:4px;">Anime Sensei — Quiz Mode</div></div>
        <div class="quiz-rules-body">
          <ul class="quiz-rules-list">
            <li><span class="rule-icon">📝</span><span>মোট <strong>৫টি প্রশ্ন</strong> থাকবে।</span></li>
            <li><span class="rule-icon">✅</span><span>সঠিক = <strong>+10 XP</strong></span></li>
            <li><span class="rule-icon">❌</span><span>ভুল = <strong>-10 XP</strong></span></li>
            <li><span class="rule-icon">⏭️</span><span>Skip = <strong>-15 XP</strong></span></li>
            <li><span class="rule-icon">💎</span><span>5/5 = <strong>+10 Gems</strong> | 4/5 = <strong>+5 Gems</strong></span></li>
          </ul>
          <div class="quiz-rules-xp-row"><span class="quiz-xp-chip correct">✅ +10 XP</span><span class="quiz-xp-chip wrong">❌ -10 XP</span><span class="quiz-xp-chip skip">⏭️ -15 XP</span></div>
          <div class="quiz-rules-btns"><button class="quiz-cancel-btn" id="quiz-cancel-btn">বাতিল</button><button class="quiz-start-btn" id="quiz-start-btn">🎯 Quiz শুরু!</button></div>
        </div>
      </div></div>`;
    }
    function viewQuizModal(){
      if(!state.quiz.open)return"";
      const q=state.quiz;
      const dots=Array.from({length:QUIZ_TOTAL_QUESTIONS},(_,i)=>{ const a=q.answers[i]; let cls="quiz-dot"; if(a)cls+=a.status==="correct"?" done-correct":a.status==="wrong"?" done-wrong":" done-skip"; else if(i===q.currentIndex&&!q.resultVisible)cls+=" active"; return`<div class="${cls}"></div>`; }).join("");
      const cor=q.answers.filter(a=>a.status==="correct").length, wro=q.answers.filter(a=>a.status==="wrong").length, ski=q.answers.filter(a=>a.status==="skip").length;
      let body="";
      if(q.resultVisible){
        const trp=cor>=4?"🏆":cor>=3?"🌟":cor>=2?"💡":"📚";
        body=`<div class="quiz-result-wrap"><span class="quiz-result-trophy">${trp}</span><div class="quiz-result-title">${cor>=4?"LEGENDARY OTAKU!":cor>=3?"Great Job!":cor>=2?"Keep Watching!":"Back to Episode 1!"}</div><div class="quiz-result-anime">${escapeHtml(q.animeName)} Quiz — Complete</div><div class="quiz-result-score-row"><span class="quiz-result-score-chip c">✅ ${cor}</span><span class="quiz-result-score-chip w">❌ ${wro}</span><span class="quiz-result-score-chip s">⏭️ ${ski}</span></div><div class="quiz-result-xp-earned">${q.totalXpEarned>=0?"+":""}${q.totalXpEarned} XP</div>${q.gemsEarned>0?`<div class="quiz-result-gems-earned">💎 +${q.gemsEarned} Gems!</div>`:`<div style="font-size:12px;color:#93c5fd;margin-bottom:14px;">5/5 বা 4/5 করলে Gems!</div>`}<button class="quiz-close-btn" id="quiz-close-btn">🏠 Arena-তে ফিরে যাও</button></div>`;
      } else if(!q.animeName){
        body=`<div class="quiz-anime-step"><span class="quiz-anime-label">🎯 কোন anime?</span><div class="quiz-anime-input-row"><input id="quiz-anime-input" class="quiz-anime-input" placeholder="Naruto, JJK, AOT..." value="${escapeHtml(q.animeInputTmp)}" /><button class="quiz-anime-start-btn" id="quiz-anime-go-btn" ${q.loading?"disabled":""}>${q.loading?"⏳":"➡️"}</button></div></div>`;
      } else if(q.loading){
        body=`<div class="quiz-loading-wrap"><span class="quiz-loading-icon">⚙️</span><div class="quiz-loading-text">Sensei প্রশ্ন তৈরি করছে...</div></div>`;
      } else if(q.feedbackVisible&&q.currentFeedback){
        const fb=q.currentFeedback;
        const fbc=fb.status==="correct"?"quiz-feedback-correct":fb.status==="wrong"?"quiz-feedback-wrong":"quiz-feedback-skip";
        const fbt=fb.status==="correct"?"🎉 CORRECT!":fb.status==="wrong"?"💥 WRONG!":"⏭️ SKIPPED";
        const next=q.currentIndex+1>=q.questions.length?"Result ➡️":"➡️ Next";
        body=`<div class="${fbc}"><div class="quiz-feedback-title">${fbt}</div><div class="quiz-feedback-xp">${fb.xpD>=0?"+":""}${fb.xpD} XP</div>${fb.status!=="correct"?`<div class="quiz-feedback-explanation"><strong>Correct:</strong> ${escapeHtml(fb.correctAnswer)}</div>`:""}<div class="quiz-feedback-explanation">${escapeHtml(fb.explanation)}</div><button class="quiz-next-btn" id="quiz-next-btn">${next}</button></div>`;
      } else if(q.questions.length>0&&q.currentIndex<q.questions.length){
        const cq=q.questions[q.currentIndex];
        body=`<div class="quiz-question-wrap"><span class="quiz-q-label">Q ${q.currentIndex+1}/${q.questions.length} — ${escapeHtml(q.animeName)}</span><div class="quiz-question-text">${escapeHtml(cq.question)}</div><div class="quiz-answer-row"><input id="quiz-answer-input" class="quiz-answer-input" placeholder="তোমার উত্তর..." value="${escapeHtml(q.answerTmp)}" ${q.loading?"disabled":""} /><button class="quiz-submit-btn" id="quiz-submit-btn" ${q.loading?"disabled":""}>${q.loading?"⏳":"✔️"}</button></div><button class="quiz-skip-btn" id="quiz-skip-btn" ${q.loading?"disabled":""}>⏭️ Skip (-15 XP)</button>${cq.hint?`<div style="margin-top:10px;font-size:11px;color:#93c5fd;padding:6px 10px;border:1px dashed rgba(56,189,248,0.25);border-radius:8px;">💡 ${escapeHtml(cq.hint)}</div>`:""}</div>`;
      }
      return`<div class="quiz-modal-overlay"><div class="quiz-modal-card"><div class="quiz-modal-head"><div class="quiz-modal-title">🎯 Anime Quiz</div><div class="quiz-progress-wrap"><div class="quiz-progress-dots">${dots}</div><div class="quiz-score-live">XP: ${q.totalXpEarned>=0?"+":""}${q.totalXpEarned}</div></div></div><div class="quiz-modal-body">${body}</div></div></div>`;
    }

    /* ══════════════════════════════════════════════
       PAGE VIEWS
    ══════════════════════════════════════════════ */
    function viewAuth(){
      return`<div class="auth-wrap"><div class="auth-box">
        <h1 class="title">Anime Meta Hub</h1><p class="subtitle">Vanilla JS | Firebase v10</p>
        <div class="stack">
          <input id="auth-username" class="input ${state.authMode==="signup"?"":"hidden"}" placeholder="Username" />
          <input id="auth-email" class="input" type="email" placeholder="Email" />
          <input id="auth-pass" class="input" type="password" placeholder="Password" />
          <button id="auth-submit-btn" class="btn btn-brand" ${state.authBusy?"disabled":""}>${state.authBusy?"Please wait...":state.authMode==="login"?"Login":"Sign Up"}</button>
        </div>
        <button id="switch-auth" class="btn btn-soft" style="margin-top:8px;width:100%;">${state.authMode==="login"?"Need an account? Sign Up":"Already have an account? Login"}</button>
        <div class="err ${state.authError?"":"hidden"}">${escapeHtml(state.authError)}</div>
      </div></div>`;
    }

    function viewProfile(){
      const p=state.profile; const lv=getLevelInfo(p.xp); const badge=getUserBadgeInfo(p.gems); const glow=getUserGlowClass(p.gems);
      const nb=getNextBadge(p.gems); const gp=nb?Math.min(100,Math.round((p.gems/nb.gems)*100)):100;
      const prog=lv.level>=LEVEL_CAP?100:Math.round((lv.xpIntoLevel/Math.max(1,lv.xpForNextLevel))*100);
      const eqTheme=getEquippedTheme(); const eqThemeInfo=eqTheme?getThemeById(eqTheme):null;
      const pStats = calcPlayerCombinedStats();
      const nameBlock=state.isEditingName
        ?`<div class="name-wrap"><input id="username-input" class="input" style="max-width:190px;padding:6px 8px;" value="${escapeHtml(p.username||"")}" /><button id="save-username-btn" class="edit-name-btn">Save</button><button id="cancel-username-btn" class="edit-name-btn">Cancel</button></div>`
        :`<div><div class="name-wrap"><div class="name-text ${badge?badge.badgeClass+" badge-username":""}">${escapeHtml(p.username||"Otaku")}${renderAdminBadge(p.username)}</div><button id="edit-username-btn" class="edit-name-btn">Edit</button>${badge?`<span class="badge-label">${badge.label}</span>`:""}</div><div class="rank-title ${lv.rankClass}">${escapeHtml(lv.title)}</div>${eqThemeInfo?`<div style="margin-top:4px;font-size:11px;font-weight:800;color:#c4b5fd;">${eqThemeInfo.emoji} ${eqThemeInfo.name} Theme Active</div>`:""}</div>`;
      return`<section class="panel ${eqTheme?`themed-profile-panel ${getThemeCssClass(eqTheme)}`:""}">
        <div class="row" style="align-items:flex-start;">
          <div style="position:relative;">
            <button id="main-avatar-btn" class="profile-pic-main ${glow}"><img src="${escapeHtml(p.avatar)}" alt="avatar" /></button>
            <label class="profile-upload-label" title="Upload from Gallery">
              📷
              <input type="file" accept="image/*" id="avatar-file-input" style="display:none;" />
            </label>
          </div>
          <div style="flex:1;">${nameBlock}</div>
        </div>
        <div id="avatar-picker-wrap" class="${state.showAvatarPicker?"":"hidden"}">
          <div class="avatar-grid">${AVATARS.map(a=>`<button class="avatar-choice ${p.avatar===a?"active":""}" data-avatar="${escapeHtml(a)}"><img src="${escapeHtml(a)}" alt="" /></button>`).join("")}</div>
        </div>
        <div style="margin-top:12px;"><div class="row"><span>Level ${lv.level}</span><span>${p.xp} XP</span></div><div class="progress"><span style="width:${prog}%;"></span></div></div>
        <div class="gems-display-row"><span class="gems-icon">💎</span><span class="gems-count">${p.gems} Gems</span><div class="gems-progress"><span style="width:${gp}%;"></span></div><span class="gems-next">${nb?`→ ${nb.gems}💎 ${nb.label}`:"★ MAX"}</span></div>
        <div class="gold-display-row"><span class="gold-icon">🪙</span><span class="gold-count">${p.gold}</span><span class="gold-label">Gold — spend in Theme Store</span></div>
        <!-- Story Mode Stats -->
        <div class="profile-story-stats">
          <div class="profile-story-stat-title">⚔️ Story Mode Power</div>
          <div class="profile-story-stat-row">
            <div class="pss-chip">❤️ <strong>${fmtNum(pStats.hp)}</strong><span>HP</span></div>
            <div class="pss-chip">⚔️ <strong>${fmtNum(pStats.atk)}</strong><span>ATK</span></div>
            <div class="pss-chip">🛡️ <strong>${fmtNum(pStats.def)}</strong><span>DEF</span></div>
          </div>
          ${p.permBonusAtk>0||p.flatBonusAtk>0?`<div class="pss-perm">✨ Perm %Bonus: +${p.permBonusAtk}%ATK +${p.permBonusHp}%HP +${p.permBonusDef}%DEF${p.flatBonusAtk>0?` | ♻️ Recycle: +${fmtNum(p.flatBonusAtk)}ATK +${fmtNum(p.flatBonusHp)}HP +${fmtNum(p.flatBonusDef)}DEF`:""}</div>`:""}
        </div>
        <div style="margin-top:12px;" class="stack"><input id="bio-input" class="input" value="${escapeHtml(p.Bio||"")}" placeholder="Bio..." /><button id="save-bio-btn" class="btn">Save Bio</button></div>
        <div class="cards-title">Featured Cards</div>${renderSlots(p.equippedSlots,true)}
        <div class="row" style="margin-top:10px;"><button id="daily-btn" class="btn btn-brand">Claim Daily +20XP</button><button id="logout-btn" class="btn">Sign Out</button></div>
      </section>`;
    }

    /* Relative time helper */
    function relativeTime(ms){
      const diff=Date.now()-Number(ms||0); const m=Math.floor(diff/60000); const h=Math.floor(m/60); const d=Math.floor(h/24);
      if(d>7) return new Date(Number(ms)).toLocaleDateString("bn-BD");
      if(d>0) return `${d}দিন আগে`;
      if(h>0) return `${h} ঘণ্টা আগে`;
      if(m>0) return `${m} মিনিট আগে`;
      return "এইমাত্র";
    }
    const FEED_EMOJIS = ["👍","❤️","😂","😮","😢"];

    const FEED_REACTIONS = ["👍","❤️","😂","😮","😢","🔥"];

    function viewFeed(){
      const uid    = state.currentUser?.uid||"";
      const p      = state.profile;
      const isAdmin= (p.username||"").trim()===ADMIN_NAME;
      const np     = Math.min(100,(state.news.dailyCount/NEWS_MAX_DAILY)*100);

      /* ── News Hub card ── */
      const newsBox = `
        <div class="news-hub-card sf-news-card" id="open-news-hub">
          <div class="row" style="align-items:flex-start;">
            <div style="flex:1;">
              <h3 class="news-hub-title">📰 Anime News Hub</h3>
              <div class="news-hub-sub">Read anime news & earn XP!</div>
              <span class="news-hub-badge">🔥 +${NEWS_XP_PER_READ} XP per article</span>
              <div class="news-hub-xp-info">
                <span>${state.news.dailyCount}/${NEWS_MAX_DAILY} today</span>
                <div class="news-hub-progress"><span style="width:${np}%;"></span></div>
              </div>
            </div>
            <div style="font-size:32px;">📰</div>
          </div>
        </div>`;

      /* ── Post Creation Box ── */
      const mediaPreview = state.feed.pendingMediaPreview;
      const mediaType    = state.feed.pendingMediaType;
      const createBox = `
        <div class="sf-create-box">
          <div class="sf-create-top">
            <img src="${escapeHtml(p.avatar||AVATARS[0])}" class="sf-create-avatar" alt="you" />
            <textarea id="post-caption" class="sf-create-textarea" placeholder="What's on your mind, anime lover?" rows="2">${escapeHtml(state.feed.editingPostId?"":"")}
</textarea>
          </div>
          ${mediaPreview ? `
            <div class="sf-media-preview-wrap">
              ${mediaType==="video"
                ? `<video src="${mediaPreview}" class="sf-media-preview-vid" controls></video>`
                : `<img src="${mediaPreview}" class="sf-media-preview-img" alt="media" />`}
              <button class="sf-remove-media-btn" id="sf-remove-media">✕</button>
            </div>` : ""}
          ${state.feed.showLinkInput ? `
            <div class="sf-link-row">
              <span class="sf-link-icon">🔗</span>
              <input id="sf-link-input" class="sf-link-input" placeholder="Paste a link..." value="${escapeHtml(state.feed.pendingLink)}" />
              <button class="sf-link-clear" id="sf-link-clear">✕</button>
            </div>` : ""}
          <div class="sf-create-actions">
            <div class="sf-create-media-btns">
              <label class="sf-media-btn" title="Photo / Video">
                📷 Photo/Video
                <input type="file" id="sf-media-upload" accept="image/*,video/*" style="display:none;" />
              </label>
              <button class="sf-media-btn" id="sf-link-btn">🔗 Link</button>
            </div>
            <button class="sf-post-btn ${state.feed.posting?"sf-post-disabled":""}" id="post-btn" ${state.feed.posting?"disabled":""}>
              ${state.feed.posting?"⏳ Posting...":"Post"}
            </button>
          </div>
          <div class="sf-xp-hints">
            <span>📝 Post: +${POST_XP_CREATE}XP</span>
            <span>👍 Like given: +${POST_XP_LIKE_GIVE}XP</span>
            <span>💬 Comment: +${POST_XP_CMT_GIVE}XP</span>
            <span>🔗 Share: +${POST_XP_SHARE_GIVE}XP</span>
          </div>
        </div>`;

      /* ── Posts Feed ── */
      const activePosts = filterActivePosts(state.posts);
      const feedItems = activePosts.length ? activePosts.map(post=>{
        const reactions   = post.reactions||{};
        const myReaction  = Object.keys(reactions).find(e=>(reactions[e]||[]).includes(uid));
        const comments    = Array.isArray(post.comments)?post.comments:[];
        const mine        = post.uid===uid;
        const postThemeCls= post.equippedTheme?getThemeCssClass(post.equippedTheme):"";
        const postBadge   = getUserBadgeInfo(post.gems||0);
        const postGlow    = getUserGlowClass(post.gems||0);
        const ageMs       = Date.now()-Number(post.created_at_ms||0);
        const daysLeft    = !post.isAdmin ? Math.max(0, Math.ceil((POST_7DAY_MS-ageMs)/(24*3600*1000))) : null;

        /* Reaction summary */
        const rxnSummary = FEED_REACTIONS.map(e=>{
          const cnt=(reactions[e]||[]).length;
          return cnt>0?`<span class="sf-rxn-chip ${myReaction===e?"sf-rxn-mine":""}" data-feed-rxn="${e}" data-feed-rxn-post="${post.id}">${e} ${cnt}</span>`:"";
        }).join("");

        /* Comments */
        const commentHtml = comments.slice().reverse().map(c=>{
          const isMyC   = c.uid===uid;
          const cGlow   = "";
          const isEditing = state.feed.editingCommentId===c.id;
          return`<div class="sf-comment-row">
            <img src="${escapeHtml(c.avatar||fallbackAvatar(c.username))}" class="sf-cmt-avatar" alt="" />
            <div class="sf-cmt-bubble">
              <div class="sf-cmt-header">
                <span class="sf-cmt-name">${escapeHtml(c.username||"User")}</span>
                <span class="sf-cmt-time">${relativeTime(c.createdAtMs)}${c.edited?" · edited":""}</span>
              </div>
              ${isEditing
                ? `<div class="sf-cmt-edit-row">
                     <input id="sf-edit-cmt-${c.id}" class="sf-cmt-edit-input" value="${escapeHtml(c.text||"")}" />
                     <button class="sf-cmt-edit-save" data-save-comment="${post.id}|${c.id}">✓</button>
                     <button class="sf-cmt-edit-cancel" id="sf-cancel-edit-cmt">✕</button>
                   </div>`
                : `<div class="sf-cmt-text">${escapeHtml(c.text||"")}</div>`}
              ${isMyC&&!isEditing?`<div class="sf-cmt-actions">
                <button class="sf-cmt-act-btn" data-edit-comment="${post.id}|${c.id}">Edit</button>
                <button class="sf-cmt-act-btn sf-cmt-delete" data-del-comment="${post.id}|${c.id}">Delete</button>
              </div>`:""}
            </div>
          </div>`;
        }).join("") || `<div class="sf-no-comments">Be the first to comment 💬</div>`;

        return`<div class="sf-post-card ${postThemeCls}" id="post-${post.id}">
          <!-- Post Header -->
          <div class="sf-post-header">
            <img src="${escapeHtml(post.avatar||AVATARS[0])}" class="sf-post-avatar ${postGlow}" alt="" />
            <div class="sf-post-meta">
              <div class="sf-post-author">${escapeHtml(post.username||"Otaku")}${renderAdminBadge(post.username)} ${postBadge?`<span class="badge-label">${postBadge.label}</span>`:""}</div>
              <div class="sf-post-time">${relativeTime(post.created_at_ms)}${post.edited?" · edited":""}${daysLeft!==null&&daysLeft<=2?`<span class="sf-expiry-warn"> · ${daysLeft}d left</span>`:""}</div>
            </div>
            ${mine?`<div class="sf-post-menu-wrap">
              <button class="sf-post-menu-btn" data-post-menu="${post.id}">⋯</button>
              <div class="sf-post-menu hidden" id="post-menu-${post.id}">
                <button class="sf-menu-item" data-edit-post="${post.id}">✏️ Edit</button>
                <button class="sf-menu-item sf-menu-danger" data-delete="${post.id}">🗑️ Delete</button>
              </div>
            </div>`:""}
          </div>
          <!-- Caption always on top -->
          ${post.caption?`<div class="sf-post-caption">${escapeHtml(post.caption||post.text||"")}</div>`:""}
          <!-- Media below caption -->
          ${post.mediaUrl&&post.mediaType==="image"?`<div class="sf-post-media-wrap"><img src="${escapeHtml(post.mediaUrl)}" class="sf-post-img" alt="media" loading="lazy" /></div>`:""}
          ${post.mediaUrl&&post.mediaType==="video"?`<div class="sf-post-media-wrap"><video src="${escapeHtml(post.mediaUrl)}" class="sf-post-video" controls preload="metadata"></video></div>`:""}
          <!-- Link preview -->
          ${post.linkUrl?`<div class="sf-link-preview"><span class="sf-link-icon-sm">🔗</span><a href="${escapeHtml(post.linkUrl)}" target="_blank" rel="noopener noreferrer" class="sf-link-text">${escapeHtml(post.linkUrl)}</a></div>`:""}
          <!-- Counters row -->
          <div class="sf-counters-row">
            ${rxnSummary||`<span class="sf-counter-empty">No reactions yet</span>`}
            <span class="sf-counter-chip">💬 ${comments.length}</span>
            <span class="sf-counter-chip">🔗 ${post.shareCount||0}</span>
          </div>
          <!-- Action Buttons -->
          <div class="sf-post-actions">
            <div class="sf-like-wrap" style="position:relative;">
              <button class="sf-action-btn ${myReaction?"sf-liked":""}" data-like-open="${post.id}">
                ${myReaction||"👍"} Like
              </button>
              <div class="sf-rxn-popup hidden" id="rxn-popup-${post.id}">
                ${FEED_REACTIONS.map(e=>`<button class="sf-rxn-pick" data-feed-rxn="${e}" data-feed-rxn-post="${post.id}">${e}</button>`).join("")}
              </div>
            </div>
            <button class="sf-action-btn" data-comment-focus="${post.id}">💬 Comment</button>
            <button class="sf-action-btn" data-share="${post.id}">🔗 Share</button>
          </div>
          <!-- Comments Section -->
          <div class="sf-comments-section">
            ${commentHtml}
            <div class="sf-cmt-input-row">
              <img src="${escapeHtml(p.avatar||AVATARS[0])}" class="sf-cmt-self-av" alt="" />
              <input id="sf-comment-input-${post.id}" class="sf-cmt-input" placeholder="Write a comment..." />
              <button class="sf-cmt-send" data-comment="${post.id}">➤</button>
            </div>
          </div>
        </div>`;
      }).join("") : `<div class="sf-empty-feed"><div class="sf-empty-icon">📭</div><div>No posts yet.<br/>Be the first to share something!</div></div>`;

      return`
        <div class="sf-feed-wrap">
          ${newsBox}
          ${createBox}
          <div class="sf-posts-list">${feedItems}</div>
        </div>`;
    }

    function viewTracker(){
      return`<section class="panel"><h3 style="margin:0 0 8px;">AI Sensei</h3>
        <div class="sensei"><div>Ask for recommendations, watch order, or manga guidance.</div>
          <div class="sensei-chat">${state.senseiMessages.map(m=>`<div class="sensei-msg ${m.role==="user"?"user":"assistant"}">${escapeHtml(m.text)}</div>`).join("")}</div>
          <div class="row" style="margin-top:8px;"><input id="sensei-input" class="input" placeholder="Ask Sensei..." /><button id="sensei-ask-btn" class="btn btn-brand" ${state.senseiLoading?"disabled":""}>Ask</button></div>
          <div class="sensei-loading ${state.senseiLoading?"":"hidden"}">Sensei is thinking...</div></div>
      </section>
      <section class="panel"><div class="row"><h3 style="margin:0;">My Watchlist</h3><button id="open-import" class="btn btn-brand">Import</button></div>
        <div style="margin-top:8px;">${state.profile.tracker.length?state.profile.tracker.map(t=>`<div class="track-item"><div class="row"><div><div style="font-weight:700;">${escapeHtml(t.title)}</div><div class="meta">Episode ${t.episode||1}</div></div><div class="row" style="gap:6px;"><button class="btn btn-soft" data-plus="${t.id}">+1 Ep</button><button class="btn" data-remove="${t.id}">Remove</button></div></div></div>`).join(""):`<div class="track-item"><span class="meta">No anime imported.</span></div>`}
        </div>
      </section>`;
    }

    function viewChatList(){
      const online=state.allUsers.filter(u=>isOnline(u)&&u.uid!==state.currentUser?.uid).length;
      const uid = state.currentUser?.uid||"";

      // Build inbox rows from state.chatInbox
      const inboxHtml = state.chatInbox.length
        ? state.chatInbox.map(entry=>{
            const u = getUserById(entry.otherId);
            if(!u) return "";
            const unread  = entry.unread||0;
            const lastMsg = entry.lastText ? (entry.lastText.length>38 ? entry.lastText.slice(0,38)+"…" : entry.lastText) : "Tap to chat";
            const isMine  = entry.lastSenderId===uid;
            const timeStr = entry.updatedAtMs ? new Date(entry.updatedAtMs).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "";
            const glow    = getUserGlowClass(u.gems);
            return`<button class="inbox-row ${unread>0?"inbox-unread":""}" data-open-chat="${u.uid}">
              <div class="inbox-avatar ${glow}">
                <img src="${escapeHtml(u.avatar)}" alt="" />
                ${isOnline(u)?'<span class="online-dot"></span>':""}
              </div>
              <div class="inbox-info">
                <div class="inbox-name-row">
                  <span class="inbox-name">${escapeHtml(u.username)}</span>
                  <span class="inbox-time">${timeStr}</span>
                </div>
                <div class="inbox-last">
                  ${isMine?"<span class='inbox-you'>You: </span>":""}${escapeHtml(lastMsg)}
                </div>
              </div>
              ${unread>0?`<div class="inbox-badge">${unread>9?"9+":unread}</div>`:""}
            </button>`;
          }).join("")
        : `<div class="inbox-empty">No conversations yet.<br/>Search for someone to start chatting!</div>`;

      return`<section class="panel inbox-panel">
        <div class="inbox-header">
          <h3 class="inbox-title">💬 Messages</h3>
          <span class="inbox-online-pill">${online} online</span>
        </div>
        <!-- Search -->
        <div class="inbox-search-wrap">
          <input id="chat-search-input" class="gc-input" placeholder="🔍 Search users..." value="${escapeHtml(state.chatSearchTerm)}" />
        </div>
        <div id="chat-search-label" class="meta ${state.chatSearchTerm.trim()?"":"hidden"}" style="margin:6px 0 4px;font-size:11px;">Results</div>
        <div id="chat-search-results">${renderChatSearchHTML()}</div>
        <!-- Inbox list -->
        <div class="inbox-list" id="chat-recent-list">${inboxHtml}</div>
        <!-- Global Chat shortcut -->
        <div class="global-chat-card" style="margin-top:10px;">
          <div class="row"><div><div class="global-chat-title">🌐 Global Community Chat</div>
          <div class="global-chat-online">${online} users online</div></div>
          <button class="global-join-btn" id="join-global-chat">Join Room</button></div>
        </div>
      </section>`;
    }

    /* ── Premium DM Chat Window (no emoji picker — native keyboard handles emojis) ── */
    function viewChatWindow(){
      const target = getUserById(state.activeChatUserId);
      if(!target) return`<section class="panel"><div class="meta">User not found.</div><button id="chat-back-btn" class="btn" style="margin-top:8px;">Back</button></section>`;
      const uid = state.currentUser?.uid;
      const msgs = state.chatMessages;
      const msgHtml = msgs.length ? msgs.map(m=>{
        const mine = m.senderId === uid;
        const tc   = m.senderTheme ? getThemeCssClass(m.senderTheme) : "";
        const time = new Date(Number(m.createdAtMs||Date.now())).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
        return`<div class="gc-msg ${mine?"gc-msg-mine":"gc-msg-theirs"}">
          <div class="gc-bubble-wrap">
            <div class="gc-bubble ${mine?"gc-bubble-mine":"gc-bubble-theirs"} ${tc}">${escapeHtml(m.text||"")}</div>
            <div class="gc-time ${mine?"gc-time-mine":""}">
              ${time}
              ${mine?`<button class="gc-delete-btn" data-dm-delete="${m.id}" title="মেসেজ মুছুন">🗑</button>`:""}
            </div>
          </div>
        </div>`;
      }).join("") : `<div class="gc-empty">💬 Say hi to ${escapeHtml(target.username)}!</div>`;

      return`<section class="panel gc-panel">
        <div class="gc-head">
          <button id="chat-back-btn" class="btn gc-back-btn">← Back</button>
          <div class="gc-avatar-sm ${getUserGlowClass(target.gems)}" style="flex:0 0 36px;"><img src="${escapeHtml(target.avatar)}" alt="" /></div>
          <div class="gc-head-info">
            <span class="gc-head-title">${escapeHtml(target.username)} ${renderBadgeLabel(target.gems)}</span>
            <span class="gc-head-sub">${isOnline(target)?"🟢 Online":"⚫ Offline"}</span>
          </div>
        </div>
        <div class="gc-body" id="chat-body-scroll">${msgHtml}</div>
        <div class="gc-input-row">
          <input id="chat-message-input" class="gc-input" placeholder="Message..." autocomplete="off" />
          <button id="chat-send-btn" class="gc-send-btn">Send ➤</button>
        </div>
      </section>`;
    }

    /* ── Premium Global Chat View (no custom emoji picker — reactions instead) ── */
    const REACTION_EMOJIS = ["❤️","😂","👍","🔥","😞"];

    function renderReactionsBar(msgId, reactions, uid){
      // reactions: { "❤️": ["uid1","uid2"], ... }
      const counts = REACTION_EMOJIS.map(e=>{
        const users = (reactions&&reactions[e]) ? reactions[e] : [];
        const myReacted = users.includes(uid);
        return users.length>0
          ? `<button class="rxn-chip ${myReacted?"rxn-mine":""}" data-rxn="${e}" data-msg="${msgId}">${e}<span class="rxn-count">${users.length}</span></button>`
          : "";
      }).join("");
      return counts ? `<div class="rxn-bar">${counts}</div>` : "";
    }

    function renderReactionPicker(msgId){
      return`<div class="rxn-picker" id="rxnpick-${msgId}">
        ${REACTION_EMOJIS.map(e=>`<button class="rxn-pick-item" data-rxn="${e}" data-msg="${msgId}">${e}</button>`).join("")}
      </div>`;
    }

    function viewGlobalChatWindow(){
      const msgs = state.globalMessages;
      const uid  = state.currentUser?.uid;
      const msgHtml = msgs.length ? msgs.map(m=>{
        const mine  = m.senderId === uid;
        const tc    = m.senderTheme ? getThemeCssClass(m.senderTheme) : "";
        const glow  = getUserGlowClass(m.senderGems||0);
        const badge = renderBadgeLabel(m.senderGems||0);
        const time  = new Date(Number(m.createdAtMs||Date.now())).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
        const rxnBar = renderReactionsBar(m.id, m.reactions||{}, uid);
        if(mine){
          return`<div class="gc-msg gc-msg-mine" id="gcmsg-${m.id}">
            <div class="gc-bubble-wrap">
              ${renderReactionPicker(m.id)}
              <div class="gc-bubble gc-bubble-mine ${tc}" data-open-rxn="${m.id}">${escapeHtml(m.text||"")}</div>
              ${rxnBar}
              <div class="gc-time gc-time-mine">
                ${time}
                <button class="gc-delete-btn" data-gc-delete="${m.id}" title="메시지 삭제">🗑</button>
              </div>
            </div>
            <div class="gc-avatar-sm ${glow}"><img src="${escapeHtml(m.senderAvatar||AVATARS[0])}" alt="" /></div>
          </div>`;
        } else {
          return`<div class="gc-msg gc-msg-theirs" id="gcmsg-${m.id}">
            <div class="gc-avatar-sm ${glow}"><img src="${escapeHtml(m.senderAvatar||AVATARS[0])}" alt="" /></div>
            <div class="gc-bubble-wrap">
              <div class="gc-sender-name">${escapeHtml(m.senderName||"Otaku")} ${badge}</div>
              ${renderReactionPicker(m.id)}
              <div class="gc-bubble gc-bubble-theirs ${tc}" data-open-rxn="${m.id}">${escapeHtml(m.text||"")}</div>
              ${rxnBar}
              <div class="gc-time">${time}</div>
            </div>
          </div>`;
        }
      }).join("") : `<div class="gc-empty">🌐 No messages yet — be the first!</div>`;

      return`<section class="panel gc-panel">
        <div class="gc-head">
          <button id="global-chat-back-btn" class="btn gc-back-btn">← Back</button>
          <div class="gc-head-info">
            <span class="gc-head-title">🌐 Global Chat</span>
            <span class="gc-head-sub">${state.allUsers.filter(u=>isOnline(u)).length} online</span>
          </div>
        </div>
        <div class="gc-body" id="global-chat-body-scroll">${msgHtml}</div>
        <div class="gc-input-row">
          <input id="global-chat-input" class="gc-input" placeholder="Type a message..." autocomplete="off" />
          <button id="global-chat-send-btn" class="gc-send-btn">Send ➤</button>
        </div>
      </section>`;
    }

    const viewChat = () => state.globalChatOpen?viewGlobalChatWindow():state.activeChatUserId?viewChatWindow():viewChatList();

    /* ══════════════════════════════════════════════
       BATTLE ARENA ENGINE
    ══════════════════════════════════════════════ */

    /* Build a battle-ready card — reads REAL stats from cardsList */
    function makeBattleCard(inventoryCard){
      const base  = cardsList.find(c=>c.id===inventoryCard.id);
      const stats = getCardStats(base||inventoryCard);
      return {
        instanceId: inventoryCard.instanceId,
        id:         inventoryCard.id,
        name:       inventoryCard.name,
        rarity:     inventoryCard.rarity,
        image:      inventoryCard.image,
        hp:  stats.hp,
        atk: stats.atk,
        def: stats.def
      };
    }

    /* Generate AI deck matching player's rarity distribution */
    function generateAIDeck(playerCards){
      const aiDeck = [];
      playerCards.forEach(pc=>{
        const pool  = cardsList.filter(c=>c.rarity===pc.rarity);
        const base  = pool[Math.floor(Math.random()*pool.length)];
        const stats = getCardStats(base);
        aiDeck.push({
          instanceId:`ai-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          id:base.id, name:base.name, rarity:base.rarity, image:base.image, ...stats
        });
      });
      return aiDeck;
    }

    /* Compute battle totals from a deck */
    function calcTotals(deck){
      const hp  = deck.reduce((s,c)=>s+c.hp,0)  * 2; // 2x HP
      const def = deck.reduce((s,c)=>s+c.def,0);
      return{hp,def};
    }

    /* Apply damage respecting shield rule */
    function applyDamage(dmg, hp, def){
      let newHP=hp, newDef=def, shieldBroken=false;
      if(def>0){
        const toMain  = Math.round(dmg * 2/3);
        const toShield= Math.round(dmg * 1/3);
        newDef = Math.max(0, def - toShield);
        newHP  = Math.max(0, hp  - toMain);
        if(newDef<=0) shieldBroken=true;
      } else {
        newHP = Math.max(0, hp - dmg);
      }
      return{hp:newHP, def:newDef, shieldBroken};
    }

    /* Start battle: deduct fee, set up state */
    async function startBattle(){
      const b = state.battle;
      const inv = state.profile.inventoryCards||[];
      if(inv.length < BATTLE_MIN_CARDS){
        showToast("ব্যাটেল শুরু করতে কমপক্ষে ৩টি কার্ড প্রয়োজন!"); return;
      }
      if(Number(state.profile.gold||0) < BATTLE_ENTRY_FEE){
        showToast(`যথেষ্ট Gold নেই! দরকার ${BATTLE_ENTRY_FEE}🪙`); return;
      }
      // Deduct fee
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data();
          if(Number(d.gold||0)<BATTLE_ENTRY_FEE)throw new Error("low-gold");
          tx.update(getMetaRef(state.currentUser.uid),{gold:Number(d.gold||0)-BATTLE_ENTRY_FEE,updated_at:serverTimestamp()});
        });
      }catch(e){
        if(String(e.message).includes("low-gold"))showToast("Gold কম! 400🪙 দরকার।");
        else alert("ব্যাটেল শুরু হয়নি। আবার চেষ্টা করো।");
        return;
      }
      showGoldFlash(-BATTLE_ENTRY_FEE);

      // Build player deck from selected cards
      const selected = b.selectedCards.map(iid=>inv.find(c=>c.instanceId===iid)).filter(Boolean);
      const playerDeck = selected.map(makeBattleCard);
      const aiDeck     = generateAIDeck(playerDeck);

      const pTotals = calcTotals(playerDeck);
      const aTotals = calcTotals(aiDeck);

      // Coin toss
      const firstTurn = Math.random()<0.5?"player":"ai";

      state.battle={
        ...state.battle,
        active:true, phase:"coinToss",
        playerDeck:[...playerDeck], playerUsed:[], currentPlayerCard:null,
        aiDeck:[...aiDeck],         aiUsed:[],     currentAiCard:aiDeck[0],
        playerHP:pTotals.hp, playerHPmax:pTotals.hp,
        playerDEF:pTotals.def, playerDEFmax:pTotals.def,
        aiHP:aTotals.hp, aiHPmax:aTotals.hp,
        aiDEF:aTotals.def, aiDEFmax:aTotals.def,
        turn:firstTurn, turnNum:1,
        log:[{type:"info",text:`🪙 코인 토스! ${firstTurn==="player"?"আপনি":"AI"} প্রথম আক্রমণ করবে!`}],
        duelPlayerCard:null, duelAiCard:null, duelPhase:"",
        animMsg:"", animType:"", shieldBroken:false, aiShieldBroken:false,
        winner:null, rewardClaimed:false, confirmOpen:false, rulesOpen:false,
        selectedCards:b.selectedCards
      };
      render();
      // Auto-advance to fight after coin toss display (1.5s)
      setTimeout(()=>{
        state.battle.phase="fight";
        if(state.battle.turn==="ai") aiTakeTurn();
        else render();
      },1800);
    }

    /* Player selects a card and attacks — with duel animation */
    function playerAttack(instanceId){
      const b = state.battle;
      if(b.phase!=="fight"||b.turn!=="player"||b.animMsg||b.duelPhase)return;
      const idx = b.playerDeck.findIndex(c=>c.instanceId===instanceId);
      if(idx===-1)return;
      const card = b.playerDeck[idx];
      const aiCard = b.aiDeck[0] || b.aiUsed[b.aiUsed.length-1] || null;

      b.playerDeck.splice(idx,1);
      b.playerUsed.push(card);
      // Pick AI card for duel view (next in deck)
      const aiDuelCard = b.aiDeck.length>0 ? b.aiDeck[0] : (b.aiUsed[b.aiUsed.length-1]||null);
      b.duelPlayerCard = card;
      b.duelAiCard     = aiDuelCard;
      b.duelPhase      = "dueling";
      render();

      // After 1.2s duel animation — apply damage
      setTimeout(()=>{
        const dmg = Math.round(card.atk * 0.5);
        const res = applyDamage(dmg, b.aiHP, b.aiDEF);
        b.animMsg        = `-${dmg}`;
        b.animType       = "dmg";
        b.aiShieldBroken = res.shieldBroken;
        b.aiHP   = res.hp;
        b.aiDEF  = res.def;
        b.log.unshift({type:"player", text:`⚔️ ${card.name}: -${dmg} dmg${res.shieldBroken?" 🛡️ SHIELD BREAK!":""}`});
        render();

        setTimeout(()=>{
          b.animMsg=""; b.aiShieldBroken=false; b.duelPhase=""; b.duelPlayerCard=null; b.duelAiCard=null;
          if(b.aiHP<=0){ endBattle("player"); return; }
          if(b.playerDeck.length===0 && b.aiDeck.length===0){ endBattle("points"); return; }
          b.turn="ai"; b.turnNum++;
          render();
          setTimeout(()=>aiTakeTurn(),800);
        },900);
      },1200);
    }

    /* AI auto-picks its next card and attacks — with duel animation */
    function aiTakeTurn(){
      const b = state.battle;
      if(b.phase!=="fight"||b.turn!=="ai")return;
      if(b.aiDeck.length===0){ b.turn="player"; render(); return; }
      const card = b.aiDeck.shift();
      b.aiUsed.push(card);
      b.currentAiCard = b.aiDeck[0]||null;
      // Pick player duel card (last used or first in remaining hand)
      const playerDuelCard = b.playerDeck[0]||(b.playerUsed[b.playerUsed.length-1]||null);
      b.duelAiCard     = card;
      b.duelPlayerCard = playerDuelCard;
      b.duelPhase      = "ai-dueling";
      render();

      setTimeout(()=>{
        const dmg = Math.round(card.atk * 0.5);
        const res = applyDamage(dmg, b.playerHP, b.playerDEF);
        b.animMsg      = `-${dmg}`;
        b.animType     = "dmg";
        b.shieldBroken = res.shieldBroken;
        b.playerHP     = res.hp;
        b.playerDEF    = res.def;
        b.log.unshift({type:"ai", text:`🤖 ${card.name}: -${dmg} dmg${res.shieldBroken?" 🛡️ SHIELD BREAK!":""}`});
        render();

        setTimeout(()=>{
          b.animMsg=""; b.shieldBroken=false; b.duelPhase=""; b.duelPlayerCard=null; b.duelAiCard=null;
          if(b.playerHP<=0){ endBattle("ai"); return; }
          if(b.playerDeck.length===0 && b.aiDeck.length===0){ endBattle("points"); return; }
          b.turn="player"; b.turnNum++;
          render();
        },900);
      },1200);
    }

    /* End battle and determine winner */
    function endBattle(reason){
      const b = state.battle;
      b.phase="ended";
      let winner;
      if(reason==="player")      winner="player";
      else if(reason==="ai")     winner="ai";
      else winner = b.playerHP >= b.aiHP ? "player" : "ai"; // points
      b.winner=winner;
      b.log.unshift({type:"result",text:winner==="player"?"🏆 당신이 이겼다!":"💀 AI가 이겼다!"});
      render();
    }

    /* Claim battle reward */
    async function claimBattleReward(){
      const b = state.battle;
      if(b.rewardClaimed||!b.winner)return;
      b.rewardClaimed=true;
      const win = b.winner==="player";
      const gold = win?BATTLE_WIN_GOLD:BATTLE_LOSE_GOLD;
      const gems = win?BATTLE_WIN_GEMS:BATTLE_LOSE_GEMS;
      const xp   = win?BATTLE_WIN_XP:BATTLE_LOSE_XP;
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data(); const nXp=Number(d.xp||0)+xp;
          tx.update(getMetaRef(state.currentUser.uid),{
            gold:Number(d.gold||0)+gold, gems:Number(d.gems||0)+gems,
            xp:nXp, level:lvFromXp(nXp), updated_at:serverTimestamp()
          });
          checkAndShowLevelUp(nXp);
        });
        showToast(`${win?"🏆 승리!":"💀 패배..."} +${gold}🪙 +${gems}💎 +${xp}XP`);
        showGoldFlash(gold);
      }catch(e){ console.error(e); }
      // Exit battle
      state.battle.active=false; state.battle.phase="select";
      state.battle.selectedCards=[]; render();
    }

    /* Toggle card selection for battle deck */
    function toggleBattleCard(instanceId){
      const b = state.battle;
      const idx = b.selectedCards.indexOf(instanceId);
      if(idx>=0) b.selectedCards.splice(idx,1);
      else if(b.selectedCards.length < (state.profile.inventoryCards||[]).length) b.selectedCards.push(instanceId);
      render();
    }

    /* ── Private Chat message delete ── */
    function deleteDmMessage(msgId){
      if(!state.currentUser||!state.activeChatUserId)return;
      showNeonModal({
        title:"🗑️ মেসেজ ডিলিট", body:"এই Private মেসেজটি মুছে ফেলা হবে।",
        okText:"✓ হ্যাঁ, মুছো", cancelText:"✗ বাতিল", danger:true,
        onOk: async()=>{
          const chatId = getChatId(state.currentUser.uid, state.activeChatUserId);
          try{ await deleteDoc(doc(db,"direct_chats",chatId,"messages",msgId)); }
          catch(e){ showToast("মুছে ফেলা সম্ভব হয়নি।"); }
        }
      });
    }

    /* ── Global Chat message delete ── */
    function deleteGlobalMessage(msgId){
      if(!state.currentUser)return;
      showNeonModal({
        title:"🗑️ মেসেজ ডিলিট", body:"এই মেসেজটি মুছে ফেলা হবে।",
        okText:"✓ হ্যাঁ, মুছো", cancelText:"✗ বাতিল", danger:true,
        onOk: async()=>{ try{ await deleteDoc(doc(db,"global_messages",msgId)); } catch(e){ showToast("মুছে ফেলা সম্ভব হয়নি।"); } }
      });
    }

    /* ── Weekly Leaderboard Rewards ── */
    function getWeekKey(){
      const d=new Date(); const start=new Date(d); start.setHours(0,0,0,0);
      start.setDate(d.getDate()-d.getDay()); // Sunday
      return start.toISOString().slice(0,10);
    }
    async function claimWeeklyReward(rank){
      if(!state.currentUser)return;
      const weekKey=getWeekKey();
      const rewardMap={1:{gems:30,gold:500,xp:50},2:{gems:20,gold:300,xp:30},3:{gems:10,gold:100,xp:15}};
      const reward=rewardMap[rank]; if(!reward)return;
      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data();
          const claimed=d.weeklyRewardClaimed||"";
          if(claimed===weekKey)throw new Error("already-claimed");
          const nXp=Number(d.xp||0)+reward.xp;
          tx.update(getMetaRef(state.currentUser.uid),{
            gold:Number(d.gold||0)+reward.gold, gems:Number(d.gems||0)+reward.gems,
            xp:nXp, level:lvFromXp(nXp), weeklyRewardClaimed:weekKey, updated_at:serverTimestamp()
          });
        });
        showToast(`🏆 Top ${rank} Weekly Reward! +${reward.gold}🪙 +${reward.gems}💎 +${reward.xp}XP`);
      }catch(e){ if(String(e.message).includes("already-claimed"))showToast("이번 주 보상은 이미 받았어요!"); }
    }

    /* ── Leaderboard with weekly reward button ── */
    function renderLeaderboard(){
      const myUid = state.currentUser?.uid||"";
      const weekKey = getWeekKey();
      return state.leaderboard.map((u,i)=>{
        const r=i+1; const uTheme=u.equippedTheme?getThemeCssClass(u.equippedTheme):"";
        const isMe=u.uid===myUid;
        const weeklyRewards={1:{gems:30,gold:500,xp:50},2:{gems:20,gold:300,xp:30},3:{gems:10,gold:100,xp:15}};
        const wr=weeklyRewards[r];
        const alreadyClaimed=u.weeklyRewardClaimed===weekKey;
        const weeklyBtn=isMe&&wr&&!alreadyClaimed
          ?`<button class="weekly-reward-btn" data-weekly-rank="${r}">🏆 주간 보상</button>`
          :isMe&&wr&&alreadyClaimed
            ?`<span class="weekly-claimed">✅ 수령완료</span>`:"";;
        return`<div class="leader-row ${r<=3?`leader-top-${r}`:""} ${uTheme}" data-open-public-profile="${u.uid}">
          <div class="leader-rank">${r}</div><div class="leader-medal">${medalForRank(r)}</div>
          <div class="leader-avatar ${getUserGlowClass(u.gems)}"><img src="${escapeHtml(u.avatar)}" alt="" /></div>
          <div class="leader-main">
            <div class="leader-name">${escapeHtml(u.username)} ${renderBadgeLabel(u.gems)}${renderAdminBadge(u.username)}</div>
            <div class="leader-rank-title ${u.rankClass}">${escapeHtml(u.title)}</div>
            ${wr?`<div class="weekly-reward-info" style="font-size:9px;color:#bca8ef;">Top${r}: 💎${wr.gems} 🪙${wr.gold} +${wr.xp}XP</div>`:""}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <div class="leader-xp">${u.xp} XP</div>
            ${weeklyBtn}
          </div>
        </div>`;
      }).join("")||`<div class="meta">No data.</div>`;
    }

    /* ── Battle Arena Screen — Full Overhaul ── */
    function viewBattleScreen(){
      const b   = state.battle;
      const inv = state.profile.inventoryCards||[];

      /* ── RULES MODAL ── */
      if(b.rulesOpen){
        return`<div class="battle-modal-overlay">
          <div class="battle-modal-card">
            <h3 class="battle-modal-title">📜 গেমের নিয়মাবলী</h3>
            <ol class="battle-rules-list">
              <li>প্রবেশ মূল্য <strong>${BATTLE_ENTRY_FEE} গোল্ড</strong>।</li>
              <li>সব কার্ডের মোট HP <strong>দ্বিগুণ (2x)</strong> হবে।</li>
              <li>কার্ডের অরিজিনাল অ্যাটাকের <strong>৫০% ড্যামেজ</strong> হিসেবে গণ্য হবে।</li>
              <li>ডিফেন্স থাকলে <strong>২:১ অনুপাতে</strong> ড্যামেজ ভাগ হবে (২/৩ মেইন HP + ১/৩ DEF)। ডিফেন্স ভেঙে গেলে <strong>১০০% ড্যামেজ</strong> মেইন HP-তে পড়বে।</li>
            </ol>
            <div class="battle-modal-btns">
              <button class="battle-btn-enter" id="battle-close-rules">✓ বুঝেছি</button>
            </div>
          </div>
        </div>`;
      }

      /* ── CONFIRM MODAL ── */
      if(b.confirmOpen){
        const selCards = b.selectedCards.map(iid=>inv.find(c=>c.instanceId===iid)).filter(Boolean);
        const totalHP  = selCards.reduce((s,c)=>{ const st=getCardStats(cardsList.find(x=>x.id===c.id)||c); return s+st.hp*2; },0);
        const totalDEF = selCards.reduce((s,c)=>{ const st=getCardStats(cardsList.find(x=>x.id===c.id)||c); return s+st.def; },0);
        return`<div class="battle-modal-overlay">
          <div class="battle-modal-card">
            <h3 class="battle-modal-title">⚔️ ব্যাটেলে প্রবেশ করবেন?</h3>
            <p class="battle-modal-sub">আপনি কি সব নিয়ম পড়ে বুঝে নিয়েছেন?</p>
            <div class="confirm-stats-row">
              <div class="confirm-stat"><span class="cstat-label">❤️ আপনার HP</span><span class="cstat-val">${totalHP}</span></div>
              <div class="confirm-stat"><span class="cstat-label">🛡️ আপনার DEF</span><span class="cstat-val">${totalDEF}</span></div>
              <div class="confirm-stat"><span class="cstat-label">💰 প্রবেশ মূল্য</span><span class="cstat-val">${BATTLE_ENTRY_FEE}🪙</span></div>
            </div>
            <div class="battle-modal-btns">
              <button class="battle-btn-exit" id="battle-cancel-enter">না, বাতিল</button>
              <button class="battle-btn-enter" id="battle-confirm-enter">হ্যাঁ, যুদ্ধে যাই! ⚔️</button>
            </div>
          </div>
        </div>`;
      }

      /* ── COIN TOSS ── */
      if(b.phase==="coinToss"){
        const firstLabel = b.turn==="player"?"⚔️ আপনি প্রথম আক্রমণ করবেন!":"🤖 AI প্রথম আক্রমণ করবে!";
        return`<div class="battle-screen battle-screen-toss">
          <div class="battle-coin-toss">
            <div class="coin-toss-emoji">🪙</div>
            <div class="coin-toss-label">${firstLabel}</div>
            <div class="coin-toss-sub">প্রস্তুত হও...</div>
          </div>
        </div>`;
      }

      /* ── CARD SELECT ── */
      if(b.phase==="select"){
        const hasEnough = inv.length >= BATTLE_MIN_CARDS;
        const hasGold   = Number(state.profile.gold||0) >= BATTLE_ENTRY_FEE;
        const selCount  = b.selectedCards.length;

        // Preview selected stats
        const selCards = b.selectedCards.map(iid=>inv.find(c=>c.instanceId===iid)).filter(Boolean);
        const previewHP  = selCards.reduce((s,c)=>{ const st=getCardStats(cardsList.find(x=>x.id===c.id)||c); return s+st.hp*2; },0);
        const previewDEF = selCards.reduce((s,c)=>{ const st=getCardStats(cardsList.find(x=>x.id===c.id)||c); return s+st.def; },0);

        return`<div class="battle-select-screen">
          <div class="battle-select-header">
            <button class="battle-exit-btn-sm" id="battle-exit-btn">← ফিরে যাও</button>
            <h3 class="battle-select-title">⚔️ AI ব্যাটেল Arena</h3>
            <button class="battle-rules-pill" id="battle-open-rules">📜 গেমের নিয়মাবলী</button>
          </div>

          <div class="battle-select-info">
            <span class="battle-info-chip ${hasGold?"":"chip-warn"}">🪙 ${state.profile.gold||0}</span>
            <span class="battle-info-chip">🃏 ${inv.length} কার্ড</span>
            <span class="battle-info-chip">প্রবেশ: ${BATTLE_ENTRY_FEE}🪙</span>
          </div>

          ${!hasEnough
            ?`<div class="battle-warn-msg">⚠️ ব্যাটেল শুরু করতে কমপক্ষে ${BATTLE_MIN_CARDS}টি কার্ড প্রয়োজন!<br/>Shop থেকে কার্ড Pull করো।</div>`
            :`<div class="battle-preview-stats">
                <div class="bps-chip">❤️ HP: <strong>${previewHP||"—"}</strong></div>
                <div class="bps-chip">🛡️ DEF: <strong>${previewDEF||"—"}</strong></div>
                <div class="bps-chip">${selCount}/${BATTLE_MIN_CARDS} নির্বাচিত</div>
              </div>
              <p class="battle-select-hint">যে কার্ডগুলো নিয়ে যুদ্ধ করতে চাও সেগুলো বেছে নাও (ন্যূনতম ${BATTLE_MIN_CARDS}টি):</p>
              <div class="battle-card-grid">
                ${inv.map(c=>{
                  const base = cardsList.find(x=>x.id===c.id)||c;
                  const st   = getCardStats(base);
                  const sel  = b.selectedCards.includes(c.instanceId);
                  return`<button class="battle-card-cell ${sel?"selected":""} ${c.rarity}" data-battle-select="${c.instanceId}">
                    <div class="battle-card-img-wrap"><img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" /></div>
                    <div class="battle-card-name">${escapeHtml(c.name)}</div>
                    <div class="battle-card-stats">❤️${st.hp*2} ⚔️${Math.round(st.atk*0.5)} 🛡️${st.def}</div>
                    ${sel?'<div class="battle-selected-badge">✓</div>':""}
                  </button>`;
                }).join("")}
              </div>
              <button class="battle-enter-btn ${selCount>=BATTLE_MIN_CARDS&&hasGold?"":"btn-disabled"}"
                id="battle-enter-btn" ${selCount<BATTLE_MIN_CARDS||!hasGold?"disabled":""}>
                ⚔️ ব্যাটেলে প্রবেশ করো (${BATTLE_ENTRY_FEE}🪙)
              </button>`}
        </div>`;
      }

      /* ── FIGHT / ENDED PHASE ── */
      const pHPpct  = Math.max(0, Math.round((b.playerHP  / Math.max(1,b.playerHPmax))  * 100));
      const pDEFpct = Math.max(0, Math.round((b.playerDEF / Math.max(1,b.playerDEFmax)) * 100));
      const aHPpct  = b.phase==="ended" ? Math.max(0, Math.round((b.aiHP / Math.max(1,b.aiHPmax)) * 100)) : 0;
      const isDueling = b.duelPhase==="dueling"||b.duelPhase==="ai-dueling";

      /* Duel view — both cards side by side */
      const duelHtml = isDueling
        ?`<div class="battle-duel-stage">
            <div class="duel-card-slot player-card-slot ${b.duelPlayerCard?.rarity||""} ${b.duelPhase==="dueling"?"slot-attacking":""}">
              ${b.duelPlayerCard?`<img src="${escapeHtml(b.duelPlayerCard.image)}" alt="${escapeHtml(b.duelPlayerCard.name)}" class="duel-card-img" /><div class="duel-card-name">${escapeHtml(b.duelPlayerCard.name)}</div>`:""}
            </div>
            <div class="duel-vs-center">⚡</div>
            <div class="duel-card-slot ai-card-slot ${b.duelAiCard?.rarity||""} ${b.duelPhase==="ai-dueling"?"slot-attacking":""}">
              ${b.duelAiCard?`<img src="${escapeHtml(b.duelAiCard.image)}" alt="${escapeHtml(b.duelAiCard.name)}" class="duel-card-img" /><div class="duel-card-name">${escapeHtml(b.duelAiCard.name)}</div>`:`<div class="duel-card-face-down">?</div>`}
            </div>
          </div>`
        :"";

      /* AI hidden cards (face-down row) during fight */
      const aiHiddenRow = b.phase==="fight"&&!isDueling&&b.aiDeck.length>0
        ?`<div class="ai-hidden-row">
            ${b.aiDeck.map((_,i)=>`<div class="ai-card-back" style="transform:rotate(${(i-b.aiDeck.length/2)*3}deg);">🂠</div>`).join("")}
            <div class="ai-hidden-label">AI: ${b.aiDeck.length} cards remaining</div>
          </div>`:"";

      /* Player hand */
      const playerHandHtml = b.phase==="fight"&&b.turn==="player"&&b.playerDeck.length>0&&!isDueling
        ?`<div class="battle-hand-label">⚔️ কার্ড বেছে আক্রমণ করো:</div>
          <div class="battle-hand-grid">
            ${b.playerDeck.map(c=>`<button class="battle-hand-card ${c.rarity}" data-battle-attack="${c.instanceId}">
              <div class="bhc-img"><img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" /></div>
              <div class="bhc-name">${escapeHtml(c.name)}</div>
              <div class="bhc-atk">⚔️ ${Math.round(c.atk*0.5)}</div>
            </button>`).join("")}
          </div>`
        : b.phase==="fight"&&b.turn==="ai"&&!isDueling
          ? `<div class="battle-ai-thinking"><span class="think-dot">●</span><span class="think-dot">●</span><span class="think-dot">●</span> AI ভাবছে...</div>`
          : "";

      /* Result */
      const resultHtml = b.phase==="ended"
        ?`<div class="battle-result-box ${b.winner==="player"?"win":"lose"}">
            <div class="battle-result-icon">${b.winner==="player"?"🏆":"💀"}</div>
            <div class="battle-result-label">${b.winner==="player"?"তুমি জিতেছো!":"AI জিতেছে!"}</div>
            <div class="battle-final-hp">
              <span>তোমার HP: <strong style="color:${b.playerHP>b.aiHP?"#86efac":"#fca5a5"};">${b.playerHP}</strong></span>
              <span>AI HP: <strong style="color:${b.aiHP>b.playerHP?"#86efac":"#fca5a5"};">${b.aiHP}</strong></span>
            </div>
            ${!b.rewardClaimed
              ?`<button class="battle-reward-btn" id="battle-claim-reward">
                  🎁 পুরস্কার নাও (+${b.winner==="player"?BATTLE_WIN_GOLD:BATTLE_LOSE_GOLD}🪙 +${b.winner==="player"?BATTLE_WIN_GEMS:BATTLE_LOSE_GEMS}💎 +${b.winner==="player"?BATTLE_WIN_XP:BATTLE_LOSE_XP}XP)
                </button>`
              :`<div class="reward-claimed-badge">✅ পুরস্কার নেওয়া হয়েছে!</div>`}
          </div>`:"";

      return`<div class="battle-screen">
        <!-- Bold HP Bars at top corners -->
        <div class="battle-hpbars-v2">
          <!-- PLAYER -->
          <div class="bf2-side player-side">
            <div class="bf2-fighter-label">👤 তুমি</div>
            <div class="bf2-bar-row">
              <div class="bf2-bar-wrap">
                <div class="bf2-hp-fill" style="width:${pHPpct}%;"></div>
              </div>
              <span class="bf2-hp-num">${b.playerHP}<span class="bf2-hp-max">/${b.playerHPmax}</span></span>
            </div>
            <div class="bf2-bar-row">
              <div class="bf2-bar-wrap def-bar">
                <div class="bf2-def-fill" style="width:${pDEFpct}%;"></div>
              </div>
              <span class="bf2-def-num">🛡️${b.playerDEF}</span>
            </div>
            ${b.shieldBroken?'<div class="shield-broken-alert">🛡️ SHIELD BREAK!</div>':""}
          </div>

          <div class="bf2-vs-divider">
            <span class="bf2-turn-indicator ${b.turn==="player"?"turn-player":"turn-ai"}">${b.turn==="player"?"⚔️ 당신차례":"🤖 AI차례"}</span>
            <div class="bf2-vs-text">VS</div>
          </div>

          <!-- AI — fog of war during fight -->
          <div class="bf2-side ai-side">
            <div class="bf2-fighter-label">🤖 AI</div>
            ${b.phase==="fight"
              ?`<div class="bf2-fog-row"><div class="bf2-fog-bar"></div><span class="bf2-fog-num">??? HP</span></div>
                <div class="bf2-fog-row"><div class="bf2-fog-bar"></div><span class="bf2-fog-num">??? DEF</span></div>`
              :`<div class="bf2-bar-row"><div class="bf2-bar-wrap"><div class="bf2-hp-fill" style="width:${aHPpct}%;"></div></div><span class="bf2-hp-num">${b.aiHP}<span class="bf2-hp-max">/${b.aiHPmax}</span></span></div>`}
            ${b.aiShieldBroken?'<div class="shield-broken-alert">🛡️ AI SHIELD BREAK!</div>':""}
          </div>
        </div>

        <!-- Floating damage number -->
        ${b.animMsg?`<div class="damage-float ${b.animType}">${b.animMsg}</div>`:""}
        <!-- Shield break flash -->
        ${b.shieldBroken||b.aiShieldBroken?`<div class="shield-flash"></div>`:""}

        <!-- AI hidden cards row -->
        ${aiHiddenRow}

        <!-- Duel view -->
        ${duelHtml}

        <!-- Player hand -->
        ${playerHandHtml}

        <!-- Result -->
        ${resultHtml}

        <!-- Battle log -->
        <div class="battle-log">
          ${b.log.slice(0,6).map(l=>`<div class="blog-entry ${l.type}">${escapeHtml(l.text)}</div>`).join("")}
        </div>

        ${b.phase==="fight"?`<button class="battle-exit-btn" id="battle-exit-btn">← Arena-তে ফিরে যাও</button>`:""}
      </div>`;
    }

    function viewArena(){
      const b = state.battle;
      // If in battle, show battle screen (full-page)
      if(b.active||b.confirmOpen||b.rulesOpen){
        return`<section class="panel" style="padding:0;">${viewBattleScreen()}</section>`;
      }
      const rc=state.arena.resultTone==="good"?"arena-result-box good":state.arena.resultTone==="bad"?"arena-result-box bad":"arena-result-box";
      return`<section class="panel"><div class="arena-wrap">
        <h3 class="arena-title">Lucky XP Spin Wheel</h3>
        <div class="arena-sub">5s realistic spin • 20 XP entry</div>
        <div class="neon-wheel-stage"><div class="neon-wheel-pointer"></div><div class="neon-wheel-outer"><div class="neon-wheel-inner"><canvas id="neon-wheel-canvas" class="neon-wheel-canvas"></canvas></div></div><div class="neon-wheel-center">SPIN</div></div>
        <div class="${rc}">${escapeHtml(state.arena.lastResult)}</div>
        <div class="row" style="margin-top:8px;">
          <div>${Number(state.profile.freeSpins||0)>0?`<span class="neon-free-badge">FREE x${state.profile.freeSpins}</span>`:`<span class="neon-xp-display">XP: ${state.profile.xp}</span>`}</div>
          <button id="spin-wheel-btn" class="neon-spin-btn" ${state.arena.spinning?"disabled":""}>${state.arena.spinning?"Spinning...":"🎡 Spin"}</button>
        </div>
        <!-- AI Battle Card -->
        <div class="battle-entry-card">
          <div class="row" style="align-items:flex-start;gap:12px;">
            <div style="flex:1;">
              <div class="battle-entry-title">⚔️ AI Battle Arena</div>
              <div class="battle-entry-sub">কার্ড দিয়ে AI-এর বিরুদ্ধে যুদ্ধ করো!</div>
              <div style="margin-top:6px;font-size:11px;color:#fbbf24;">প্রবেশ: ${BATTLE_ENTRY_FEE}🪙 • জয়: +${BATTLE_WIN_GOLD}🪙 +${BATTLE_WIN_GEMS}💎</div>
            </div>
            <div style="font-size:40px;">⚔️</div>
          </div>
          <button class="battle-quick-enter-btn" id="battle-open-select">কার্ড বেছে ব্যাটেলে যাও →</button>
        </div>
        <div class="quiz-arena-card" id="open-quiz-rules">
          <div class="row" style="align-items:flex-start;"><div style="flex:1;"><h3 class="quiz-arena-title">🎯 Anime Quiz Challenge</h3><div class="quiz-arena-sub">AI Sensei quiz — XP ও Gems পাবে!</div><span class="quiz-arena-badge">5/5=+10💎 | 4/5=+5💎</span></div><div style="font-size:36px;">🎯</div></div>
        </div>
        <div class="leaderboard-wrap"><h4 class="leaderboard-title">Leaderboard (Top 10)</h4>
          <div class="leaderboard-list">${renderLeaderboard()}</div>
        </div>
      </div></section>`;
    }

    /* ── Card Preview Modal ── */
    function viewCardPreviewModal(){
      if(!state.shop.previewOpen) return "";
      const uid = state.currentUser?.uid||"";
      const ownedIds = (state.profile.inventoryCards||[]).map(c=>c.id);
      const byRarity = r => cardsList.filter(c=>c.rarity===r);
      function cardGrid(rarity, label, colorCls){
        const cards = byRarity(rarity);
        return`<div class="cpv-rarity-section">
          <div class="cpv-rarity-label ${colorCls}">${label}</div>
          <div class="cpv-card-grid">
            ${cards.map(c=>{
              const owned = ownedIds.includes(c.id);
              return`<div class="cpv-card ${rarity} ${owned?"cpv-owned":"cpv-locked"}">
                <div class="cpv-card-img-wrap">
                  ${owned
                    ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" class="cpv-card-img" />`
                    : `<div class="cpv-silhouette"><img src="${escapeHtml(c.image)}" alt="?" class="cpv-card-img cpv-sil" /></div>`
                  }
                </div>
                <div class="cpv-card-name">${owned?escapeHtml(c.name):"???"}</div>
                <div class="cpv-rarity-chip cpv-chip-${rarity}">${rarity.toUpperCase()}</div>
              </div>`;
            }).join("")}
          </div>
        </div>`;
      }
      return`<div class="modal" id="card-preview-modal">
        <div class="modal-card cpv-modal">
          <div class="row" style="margin-bottom:10px;">
            <h3 style="margin:0;color:#fde68a;">📦 Card Collection</h3>
            <button id="close-card-preview" class="btn">✕ Close</button>
          </div>
          <div class="meta" style="margin-bottom:12px;font-size:11px;">Silhouette = Unowned. Pull to unlock!</div>
          ${cardGrid("legendary","⭐ Legendary","cpv-legendary-label")}
          ${cardGrid("rare","💎 Rare","cpv-rare-label")}
          ${cardGrid("common","⚔️ Common","cpv-common-label")}
        </div>
      </div>`;
    }

    function viewShop(){
      const pulled    = state.shop.lastPull;
      const activeTab = state.shop.activeTab || "box";
      const missOpen  = state.shop.missionsOpen;
      const mUnclaimed= MISSIONS.filter(m=>isMissionComplete(m)&&!isMissionClaimed(m)).length;
      const mTotalDone= MISSIONS.filter(m=>isMissionComplete(m)).length;
      const pR  = Number(state.profile.pityRare||0);
      const pL  = Number(state.profile.pityLegendary||0);
      const nextRareIn      = Math.max(0, PITY_RARE - pR);
      const nextLegendaryIn = Math.max(0, PITY_LEGENDARY - pL);

      // ── Mystery Box section ──
      const isShaking   = state.shop.shaking;
      const isRevealing = state.shop.revealing;
      const isOpening   = state.shop.opening;
      const canPull     = Number(state.profile.gold||0) >= BOX_COST_GOLD;

      const boxSection = `
        <section class="panel shop-section neon-box-panel ${isShaking?"box-shaking":""}" id="shop-sec-box">
          <div class="shop-box-header row">
            <div>
              <div class="neon-box-title">📦 Mystery Character Box</div>
              <div class="meta" style="margin-top:3px;">Cost: ${BOX_COST_GOLD}🪙 Gold per pull</div>
            </div>
            <button class="shop-info-btn" id="open-card-preview" title="View all cards">👁️</button>
          </div>
          <!-- Box icon -->
          <div class="mystery-box-stage">
            <div class="mystery-box-icon ${isShaking?"shake":""} ${isRevealing?"beam":""}">
              <span class="box-emoji">📦</span>
              ${isRevealing?'<div class="light-beam"></div>':""}
            </div>
          </div>
          <!-- Pity counter -->
          <div class="pity-row">
            <div class="pity-chip">
              <span class="pity-label">Rare pity</span>
              <span class="pity-val ${pR>=8?"pity-close":""}">${pR}/${PITY_RARE}</span>
            </div>
            <div class="pity-chip">
              <span class="pity-label">Legendary pity</span>
              <span class="pity-val ${pL>=18?"pity-close":"pity-legend"}">${pL}/${PITY_LEGENDARY}</span>
            </div>
          </div>
          <!-- Pull result -->
          ${pulled && !isShaking && !isRevealing && !isOpening ? `
            <div class="gacha-result-card ${pulled.rarity} gacha-result-animate">
              <div class="gacha-result-img-wrap">
                <img src="${escapeHtml(pulled.image)}" alt="${escapeHtml(pulled.name)}" class="gacha-result-img" />
              </div>
              <div style="flex:1;min-width:0;">
                <div class="gacha-result-name">${escapeHtml(pulled.name)}</div>
                <div class="gacha-result-rarity gacha-rarity-${pulled.rarity}">${pulled.rarity.toUpperCase()}</div>
              </div>
            </div>
          ` : (!isShaking&&!isRevealing&&!isOpening)?`<div class="gacha-empty-hint">🎲 Pull to discover a character!</div>`:""}
          <!-- Pull button -->
          <button id="buy-box-btn" class="shop-pull-btn ${canPull?"":"shop-pull-disabled"}" ${(isOpening||isShaking||isRevealing)?"disabled":""}>
            ${isOpening?"💰 Spending Gold..."
              :isShaking?"🎲 Opening..."
              :isRevealing?"✨ Revealing..."
              :canPull?`🎲 Pull — ${BOX_COST_GOLD}🪙 Gold`
              :`🔒 Need ${BOX_COST_GOLD}🪙 Gold`}
          </button>
        </section>`;

      // ── Missions accordion ──
      const missSection = `
        <section class="panel missions-accordion-panel" id="shop-sec-missions">
          <button class="missions-accordion-header" id="toggle-missions-accordion">
            <div class="missions-accordion-left">
              <span class="missions-accordion-icon">🎯</span>
              <div>
                <div class="missions-accordion-title">Daily Missions</div>
                <div class="missions-accordion-sub">${mTotalDone}/${MISSIONS.length} done • resets in ${missionResetCountdown()}</div>
              </div>
            </div>
            <div class="missions-accordion-right">
              ${mUnclaimed>0?`<span class="missions-claim-badge">${mUnclaimed} Ready!</span>`:""}
              <span class="missions-accordion-arrow ${missOpen?"open":""}">▼</span>
            </div>
          </button>
          <div class="missions-accordion-body ${missOpen?"open":""}">
            <div class="missions-accordion-inner">${viewDailyMissionsInner()}</div>
          </div>
        </section>`;

      // ── Theme store ──
      const themeSection = viewThemeStore().replace('<section class="panel theme-store-panel">',
        '<section class="panel theme-store-panel" id="shop-sec-themes">');

      // ── Sticky Tab Bar ──
      const tabBar = `
        <div class="shop-tab-bar">
          <button class="shop-tab ${activeTab==="box"?"active":""}" data-shop-tab="box">📦 Mystery Box</button>
          <button class="shop-tab ${activeTab==="missions"?"active":""}" data-shop-tab="missions">🎯 Missions</button>
          <button class="shop-tab ${activeTab==="themes"?"active":""}" data-shop-tab="themes">🎨 Themes</button>
        </div>`;

      return tabBar + boxSection + missSection + themeSection;
    }

    function viewCardDetailModal(){
      const card = state.cardPreview?.card;
      if(!state.cardPreview?.open || !card) return "";
      const rewards = {legendary:{gold:600,xp:300},rare:{gold:300,xp:150},common:{gold:100,xp:50}};
      const r = rewards[card.rarity]||rewards.common;
      const rarityColors = {legendary:"#fde68a",rare:"#c4b5fd",common:"#bca8ef"};
      const col = rarityColors[card.rarity]||"#bca8ef";
      const equippedIds = Object.values(state.profile.equippedSlots||{}).map(s=>s?.instanceId).filter(Boolean);
      const isEquipped = equippedIds.includes(card.instanceId);
      return`<div class="card-detail-overlay" id="card-detail-overlay">
        <div class="card-detail-modal">
          <button class="card-detail-close" id="close-card-detail">✕</button>
          <div class="card-detail-img-wrap ${card.rarity}">
            <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" class="card-detail-img" />
          </div>
          <div class="card-detail-info">
            <div class="card-detail-name">${escapeHtml(card.name)}</div>
            <div class="card-detail-rarity" style="color:${col};">${card.rarity.toUpperCase()}</div>
            <div class="card-detail-recycle-info">
              ♻️ Recycle value: <strong style="color:#ffd700;">${r.gold}🪙 + ${r.xp} XP</strong>
            </div>
          </div>
          <div class="card-detail-actions">
            <button class="card-detail-btn equip-btn ${isEquipped?"equipped":""}" data-open-equip="${card.instanceId}">
              ${isEquipped?"✅ Equipped":"⚙️ Equip"}
            </button>
            <button class="card-detail-btn recycle-btn" data-recycle="${card.instanceId}">
              ♻️ Recycle
            </button>
          </div>
        </div>
      </div>`;
    }

    function viewInventory(){
      const cards=state.profile.inventoryCards||[];
      const equippedIds=Object.values(state.profile.equippedSlots||{}).map(s=>s?.instanceId).filter(Boolean);
      const army = getShadowArmy();
      return`<section class="panel">
        <div class="row" style="margin-bottom:10px;">
          <h3 style="margin:0;">My Cards</h3>
          <div class="meta">${cards.length} cards</div>
        </div>
        ${cards.length
          ?`<div class="inv-grid-3col">${cards.map(c=>{
              const isEquipped=equippedIds.includes(c.instanceId);
              return`<div class="inv-card-cell ${isEquipped?"inv-equipped":""}" data-preview-card="${c.instanceId}">
                ${renderCardVisual(c,true)}
                <div class="inv-card-actions">
                  <button class="inv-act-btn inv-equip-btn ${isEquipped?"inv-act-equipped":""}" data-open-equip="${c.instanceId}">
                    ${isEquipped?"✅":"⚙️"}
                  </button>
                  <button class="inv-act-btn inv-recycle-btn" data-recycle="${c.instanceId}">♻️</button>
                </div>
              </div>`;
            }).join("")}</div>`
          :`<div class="inventory-empty">No cards yet. Pull from the Shop! 📦</div>`}
      </section>
      <section class="panel shadow-soldier-section">
        <div class="shadow-soldier-header">
          <div class="shadow-soldier-title">⚫ Solo Leveling Story Mode — Shadow Soldiers</div>
          <div class="shadow-soldier-sub">${army.length} Shadow${army.length!==1?"s":""} collected • Defeat enemies to add more</div>
        </div>
        ${army.length===0
          ? `<div class="shadow-soldier-empty">⚫ No Shadows yet.<br/>Defeat story enemies to add them to your army!</div>`
          : `<div class="shadow-soldier-grid">${army.map(sh=>`
              <div class="shadow-soldier-card">
                <div class="shadow-soldier-img-wrap">
                  <img src="${escapeHtml(sh.image)}" alt="${escapeHtml(sh.name)}" class="shadow-soldier-img" />
                  <div class="shadow-soldier-aura"></div>
                </div>
                <div class="shadow-soldier-name">${escapeHtml(sh.name)}</div>
                <div class="shadow-soldier-stats">
                  <span>⚔️ ${fmtNum(Math.round(sh.atk*0.5))}</span>
                  <span>❤️ ${fmtNum(Math.round(sh.hp*0.5))}</span>
                  <span>🛡️ ${fmtNum(Math.round(sh.def*0.5))}</span>
                </div>
                <div class="shadow-soldier-label">50% contribution</div>
              </div>`).join("")}
            </div>`
        }
      </section>`;
    }

    /* ── Modals ── */
    function viewImportModal(){
      if(!state.showImportModal)return"";
      return`<div class="modal"><div class="modal-card"><div class="row"><h3 style="margin:0;">Import Anime</h3><button id="close-import" class="btn">Close</button></div><input id="import-input" class="input" placeholder="Anime title..." value="${escapeHtml(state.animeSearch)}" style="margin-top:10px;"><div class="row" style="margin-top:10px;"><span class="meta">Any anime name.</span><button id="import-add" class="btn btn-brand">Add</button></div></div></div>`;
    }
    function viewEquipModal(){
      if(!state.equip.open)return"";
      const card=state.profile.inventoryCards.find(c=>c.instanceId===state.equip.cardId); if(!card)return"";
      return`<div class="modal"><div class="modal-card"><div class="row"><h3 style="margin:0;">Equip Card</h3><button id="close-equip-modal" class="btn">Close</button></div><div style="margin-top:8px;">${renderCardVisual(card,true)}</div><div class="meta" style="margin-top:8px;">Select slot:</div><div class="equip-slots-modal-grid">${SLOT_IDS.map(id=>`<button class="equip-slot-btn" data-equip-slot="${id}">${escapeHtml(id)}</button>`).join("")}</div></div></div>`;
    }
    function viewInspectProfile(){
      const u=state.inspectUser; if(!u)return"";
      const lv=getLevelInfo(u.xp||0); const badge=getUserBadgeInfo(u.gems); const glow=getUserGlowClass(u.gems);
      const uTheme=u.equippedTheme?getThemeById(u.equippedTheme):null;
      const uThemeCls=uTheme?uTheme.cssClass:"";
      // Compute story stats for this user using their equipped cards + perm bonuses
      const uInv = normalizeInventory(u.inventoryCards||[]);
      let uTotalHp=0,uTotalAtk=0,uTotalDef=0;
      uInv.forEach(c=>{const base=cardsList.find(x=>x.id===c.id)||c;const st=getCardStats(base||c);uTotalHp+=st.hp;uTotalAtk+=st.atk;uTotalDef+=st.def;});
      uTotalHp  = Math.round(uTotalHp  * (1 + (u.permBonusHp||0)/100))  + Number(u.flatBonusHp||0);
      uTotalAtk = Math.round(uTotalAtk * (1 + (u.permBonusAtk||0)/100)) + Number(u.flatBonusAtk||0);
      uTotalDef = Math.round(uTotalDef * (1 + (u.permBonusDef||0)/100)) + Number(u.flatBonusDef||0);
      const storyStatsHtml = `
        <div class="profile-story-stats" style="margin-top:10px;">
          <div class="profile-story-stat-title">⚔️ Story Mode Power</div>
          <div class="profile-story-stat-row">
            <div class="pss-chip">❤️ <strong>${fmtNum(Math.max(0,uTotalHp))}</strong><span>HP</span></div>
            <div class="pss-chip">⚔️ <strong>${fmtNum(Math.max(0,uTotalAtk))}</strong><span>ATK</span></div>
            <div class="pss-chip">🛡️ <strong>${fmtNum(Math.max(0,uTotalDef))}</strong><span>DEF</span></div>
          </div>
        </div>`;
      return`<div class="inspect-overlay"><div class="inspect-card"><div class="inspect-head"><div style="font-weight:900;color:#ede9fe;">Public Profile</div><button id="close-inspect-btn" class="inspect-close">Close</button></div><div class="inspect-profile-top ${uThemeCls}"><div class="inspect-avatar ${glow}"><img src="${escapeHtml(u.avatar||AVATARS[0])}" alt=""></div><div style="flex:1;"><div class="name-text ${badge?badge.badgeClass+" badge-username":""}">${escapeHtml(u.username||"Otaku")}${renderAdminBadge(u.username)}</div>${badge?`<div>${badge.label}</div>`:""}<div class="rank-title ${lv.rankClass}">${escapeHtml(lv.title)}</div>${uTheme?`<div style="font-size:11px;color:#c4b5fd;margin-top:3px;">${uTheme.emoji} ${uTheme.name} Theme</div>`:""}<div class="meta" style="margin-top:6px;">Lv ${lv.level} • ${u.xp} XP • ${u.gems||0}💎 • ${u.gold||0}🪙</div></div></div>${storyStatsHtml}<div class="inspect-bio">${escapeHtml(u.Bio||"No bio.")}</div><div class="cards-title">Featured Cards</div>${renderSlots(u.equippedSlots||{},false)}</div></div>`;
    }
    function viewNewsModal(){
      if(!state.news.modalOpen)return"";
      const maxed=state.news.dailyCount>=NEWS_MAX_DAILY;
      const anyRunning=Object.values(state.news.readTimers).some(t=>t.active);
      return`<div class="news-modal"><div class="news-modal-inner">
        <div class="news-modal-head"><div class="news-modal-title">📰 Anime News Hub</div><button id="close-news-modal" class="news-close-btn">✕ Close</button></div>
        <div class="news-modal-body">
          <div class="news-daily-status">${maxed?`✅ Daily limit! ${state.news.dailyCount}/${NEWS_MAX_DAILY}`:`📖 ${state.news.dailyCount}/${NEWS_MAX_DAILY} today`}</div>
          ${anyRunning?`<div class="news-daily-status" style="border-color:rgba(139,92,246,.5);color:#c4b5fd;">⏳ Finish current first!</div>`:""}
          ${state.news.loading?`<div class="news-loading">⏳ Loading...</div>`:""}
          ${!state.news.loading&&!state.news.articles.length?`<div class="news-loading">No news.</div>`:""}
          ${state.news.articles.map(a=>{
            const claimed=state.news.claimedIds[a.id]; const timer=state.news.readTimers[a.id];
            const counting=timer?.active; const elapsed=timer?.elapsed||0; const locked=anyRunning&&!counting;
            let bc,bt,bd;
            if(claimed){bc="news-read-btn claimed";bt="✅ Claimed";bd=true;}
            else if(maxed){bc="news-read-btn maxed";bt="Limit Reached";bd=true;}
            else if(counting){bc="news-read-btn counting";bt=`Reading... ${NEWS_READ_SECONDS-elapsed}s`;bd=true;}
            else if(locked){bc="news-read-btn locked";bt="🔒 Finish current";bd=true;}
            else{bc="news-read-btn active";bt="📖 Read & Earn 10 XP";bd=false;}
            return`<div class="news-item">${a.image?`<img class="news-item-image" src="${escapeHtml(a.image)}" alt="" onerror="this.style.display='none'" />`:""}
              <div class="news-item-body"><h4 class="news-item-title">${escapeHtml(a.title)}</h4><p class="news-item-excerpt">${escapeHtml(a.excerpt)}</p>
              <div class="news-item-meta"><span class="news-item-date">⭐ ${a.score} • Ep: ${a.episodes} • ${a.date}</span><a class="news-item-url" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">MAL ↗</a></div>
              <div style="margin-top:8px;"><button class="${bc}" id="nrb-${a.id}" ${bd?"disabled":""} data-read-news="${a.id}">${bt}</button></div>
              ${counting?`<div class="news-timer-bar"><span id="ntf-${a.id}" style="width:${(elapsed/NEWS_READ_SECONDS)*100}%;"></span></div>`:""}
              </div></div>`;
          }).join("")}
        </div>
      </div></div>`;
    }

    /* ══════════════════════════════════════════════
       MAIN RENDER
    ══════════════════════════════════════════════ */
    /* ══════════════════════════════════════════════
       SOLO LEVELING STORY MODE — CHAPTER 1
    ══════════════════════════════════════════════ */

    /* ── Jin-Woo images per chapter ── */
    const JINWOO_IMAGES = {
      1: "https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_164742.jpg",
      2: "https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_164742.jpg",
      3: "https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202630.jpg",
      4: "https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202630.jpg",
      5: "https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202940.jpg"
    };
    function getJinwooImage(chapterId){ return JINWOO_IMAGES[chapterId] || JINWOO_IMAGES[1]; }
    const JINWOO_IMAGE = JINWOO_IMAGES[1]; // default fallback

    /* Chapter definitions — Chapters 1–5, all unlocked */
    const STORY_CHAPTERS = [
      {
        id:1, title:"Chapter 1: The Dungeon Awakens", mapLabel:"Kasaka's Lair",
        requirement:{ level:3, cards:3 },
        enemies:[
          { id:"goblin", name:"Goblin Scout",       hp:170,   atk:350,   def:310,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_165012.jpg" },
          { id:"wolf",   name:"Iron Fang Wolf",      hp:290,   atk:550,   def:450,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_165130.jpg" },
          { id:"kasaka", name:"Kasaka the Venomous", hp:8000,  atk:15000, def:4080,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_165212.jpg", isBoss:true }
        ],
        reward:{ xp:100, gold:300, gems:10, title:"Dungeon Conqueror", permAtk:5, permHp:5, permDef:3 }
      },
      {
        id:2, title:"Chapter 2: The Knight Baran", mapLabel:"Demon Castle Gates",
        requirement:{ level:3, cards:3 },
        enemies:[
          { id:"archer",  name:"Archer",  hp:15000,   atk:3200,  def:800,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202749.jpg" },
          { id:"baran",   name:"Baran",   hp:120000,  atk:18000, def:5000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202550.jpg", isBoss:true }
        ],
        reward:{ xp:20000, gold:10000, gems:25, title:"Demon Slayer", permAtk:8, permHp:8, permDef:5 }
      },
      {
        id:3, title:"Chapter 3: The Red Gate — Igris", mapLabel:"Red Gate Dungeon",
        requirement:{ level:3, cards:3 },
        enemies:[
          { id:"demon_soldier", name:"Demon Soldier", hp:500000,    atk:45000,   def:12000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202705.jpg" },
          { id:"igris",         name:"Igris",          hp:2500000,   atk:120000,  def:40000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_205510.jpg", isBoss:true }
        ],
        reward:{ xp:200000, gold:100000, gems:50, title:"Red Gate Conqueror", permAtk:12, permHp:12, permDef:8 }
      },
      {
        id:4, title:"Chapter 4: The High Orc King Tusk", mapLabel:"Orc Territory",
        requirement:{ level:3, cards:3 },
        enemies:[
          { id:"high_orc", name:"High Orc Scout", hp:8500000,  atk:350000,  def:150000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_202818.jpg" },
          { id:"tusk",     name:"Tusk",            hp:35000000, atk:900000,  def:450000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_211233.jpg", isBoss:true }
        ],
        reward:{ xp:1000000, gold:500000, gems:100, title:"Orc Slayer", permAtk:18, permHp:18, permDef:12 }
      },
      {
        id:5, title:"Chapter 5: The Ant King Beru", mapLabel:"Jeju Island S-Rank Gate",
        requirement:{ level:3, cards:3 },
        enemies:[
          { id:"ice_elf_baruka", name:"Ice Elf Baruka", hp:120000000,  atk:2500000,  def:1000000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260325_202505.jpg" },
          { id:"beru",           name:"Beru",            hp:600000000,  atk:8000000,  def:30000000,
            image:"https://raw.githubusercontent.com/yasin636/anime-card-assets/refs/heads/main/IMG_20260326_205131.jpg", isBoss:true }
        ],
        reward:{ xp:10000000, gold:5000000, gems:500, title:"Shadow Monarch", permAtk:25, permHp:25, permDef:20 }
      }
    ];

    /* ══ Bengali Dialogue Bank — 4 stages per boss ══ */
    const BOSS_DIALOGUES = {
      kasaka:{
        intro:[ {speaker:"enemy",text:"তুই কি মরতে চাস, মানুষ! এই অন্ধকূপ আমার রাজত্ব!"}, {speaker:"player",text:"তোর রাজত্বের পতন এখানেই। শিকার শুরু হচ্ছে এখন থেকে।"} ],
        mid:  [ {speaker:"enemy",text:"অসম্ভব! একটা E-Rank এত শক্তিশালী?! তুই কে আসলে?!"}, {speaker:"player",text:"আমি আর দুর্বল নই। আমি প্রতিটি সীমা ছাড়িয়ে যাব!"} ],
        defeat:[ {speaker:"enemy",text:"এই তোর ক্ষমতা? ফিরে যা নগণ্য তস্কর! একটা E-Rank আমাকে চ্যালেঞ্জ করে?"} ],
        victory:[ {speaker:"enemy",text:"কীভাবে... একটা E-Rank... আমাকে হারাল... অবিশ্বাস্য..."}, {speaker:"player",text:"এটা শুধু শুরু। System আমাকেই বেছে নিয়েছে।"} ]
      },
      baran:{
        intro:[ {speaker:"enemy",text:"তুচ্ছ মানব, তুই আমার এলাকায় পা দিয়েছিস?! বজ্রপাত তোর কবর হবে!"}, {speaker:"player",text:"বজ্রপাত আমার কাছে কিছুই না। তোর ক্ষমতার সময় শেষ!"} ],
        mid:  [ {speaker:"enemy",text:"অসম্ভব! আমার ম্যাজিক কাজ করছে না?! তুই কোন দানব?!"}, {speaker:"player",text:"আমি সেই মানুষ যে সব সীমা অতিক্রম করে। এখন আমার Shadow দেখ!"} ],
        defeat:[ {speaker:"enemy",text:"দুর্বল! তুই কি ভেবেছিলি এই শক্তি দিয়ে রাজাকে হারাবি?"} ],
        victory:[ {speaker:"enemy",text:"একজন... মানুষ... রাজ-রাক্ষসকে... হারিয়েছে... এটা কীভাবে সম্ভব..."}, {speaker:"player",text:"তুই শুধু একটা সিঁড়ি। আসল যুদ্ধ এখনো শুরু হয়নি।"} ]
      },
      igris:{
        intro:[ {speaker:"enemy",text:"রক্ত-লাল সেনাপতি Igris-এর সামনে নতজানু হও! কেউ এখানে যেতে পারবে না!"}, {speaker:"player",text:"আমি কারো সামনে নতজানু হই না। এখনো না, কখনো না!"} ],
        mid:  [ {speaker:"enemy",text:"তোমার শক্তি... যুক্তির বাইরে। তুমি কি সত্যিই E-Rank?!"}, {speaker:"player",text:"Rank কোনো ব্যাপার না। শুধু শক্তিই আসল — আর আমার শক্তি বাড়ছে।"} ],
        defeat:[ {speaker:"enemy",text:"এই Dungeon পরিচালনার যোগ্যতা তোমার নেই। পিছিয়ে যাও।"} ],
        victory:[ {speaker:"enemy",text:"...যোগ্য... Shadow Monarch... আমি আত্মসমর্পণ করছি..."}, {speaker:"player",text:"উঠে দাঁড়াও, Igris। তুমি এখন থেকে আমার Shadow Knight।"} ]
      },
      tusk:{
        intro:[ {speaker:"enemy",text:"GRAAA! তুই High Orc King Tusk-কে চ্যালেঞ্জ করার সাহস পেলি কোথায়?! তোর হাড় গুঁড়ো করব!"}, {speaker:"player",text:"বড় মুখ কোনো কাজে আসবে না — তুই শীঘ্রই আমার Shadow হবি।"} ],
        mid:  [ {speaker:"enemy",text:"অসম্ভব! আমার Berserker Rage-ও কাজ করছে না?! তুই কি মানুষ নাকি দানব?!"}, {speaker:"player",text:"আমি Sung Jin-Woo। এই নাম মনে রাখ — এটাই তোর শেষ কথা হবে।"} ],
        defeat:[ {speaker:"enemy",text:"CRUSH! DESTROY! তোর মতো দুর্বল প্রাণী King Tusk-এর সামনে কিছুই না!"} ],
        victory:[ {speaker:"enemy",text:"...হেরে গেলাম... একটা মানুষের কাছে... এই লজ্জা..."}, {speaker:"player",text:"Tusk, তুমি ভালো লড়েছ। এখন উঠে দাঁড়াও — আমার Shadow Army-তে যোগ দাও।"} ]
      },
      beru:{
        intro:[ {speaker:"enemy",text:"কেকেকে... অবশেষে একজন যোগ্য শিকার এসেছে। আমি Beru, Ant King। গ্রাস হওয়ার জন্য প্রস্তুত হও!"}, {speaker:"player",text:"Ant King Shadow Monarch-কে চ্যালেঞ্জ করছে? দেখি তুমি আমার সেনাদলে যোগ দেওয়ার যোগ্য কিনা।"} ],
        mid:  [ {speaker:"enemy",text:"অসম্ভব! আমার বিষ... আমার শক্তি... কিছুই কাজ করছে না?! তুই কী?!"}, {speaker:"player",text:"আমি সব Shadow-এর শীর্ষে দাঁড়িয়ে আছি। মাথা নামাও, নইলে ধ্বংস হও!"} ],
        defeat:[ {speaker:"enemy",text:"কেকেকে... তুমি কি সত্যিই ভেবেছিলে Ant King-কে হারাবে? বোকার মতো শিকার।"} ],
        victory:[ {speaker:"enemy",text:"...হেরে গেলাম... একজন মানুষের কাছে... কেকে... এই মানুষটার কাছে..."}, {speaker:"player",text:"Beru। তুমি সবচেয়ে শক্তিশালী Shadow যাকে আমি কখনো দেখেছি। উঠে দাঁড়াও — Shadow Monarch-এর সেবা করো।"} ]
      }
    };
    function getEnemyDialogue(enemy, type){
      if(enemy?.isBoss && BOSS_DIALOGUES[enemy.id]) return BOSS_DIALOGUES[enemy.id][type]||[];
      if(type==="intro")   return [{speaker:"enemy",text:`${enemy?.name||"শত্রু"} আবির্ভূত হয়েছে! সতর্ক থাকো!`},{speaker:"player",text:"আরেকটি বাধা। দ্রুত শেষ করে ফেলি।"}];
      if(type==="defeat")  return [{speaker:"enemy",text:"দুর্বল! তুমি এই Dungeon-এর যোগ্য নও!"}];
      if(type==="victory") return [{speaker:"player",text:"পরাজিত! Shadow Monarch-এর আরেকটি জয়।"}];
      if(type==="mid")     return [{speaker:"enemy",text:"তুমি আমার ভাবনার চেয়ে শক্তিশালী..."},{speaker:"player",text:"তুমি এখনো কিছু দেখনি।"}];
      return [];
    }

    /* Calculate player's COMBINED raw stats from all inventory cards */
    function calcPlayerCombinedStats(){
      const inv = state.profile.inventoryCards||[];
      const pb  = state.profile;
      let totalHp=0, totalAtk=0, totalDef=0;
      inv.forEach(c=>{
        const base = cardsList.find(x=>x.id===c.id)||c;
        const st   = getCardStats(base||c);
        totalHp  += st.hp;
        totalAtk += st.atk;
        totalDef += st.def;
      });
      // Apply permanent % bonuses (from boss clears)
      totalHp  = Math.round(totalHp  * (1 + (pb.permBonusHp||0)/100));
      totalAtk = Math.round(totalAtk * (1 + (pb.permBonusAtk||0)/100));
      totalDef = Math.round(totalDef * (1 + (pb.permBonusDef||0)/100));
      // Apply permanent FLAT bonuses (from duplicate card recycles — 100% of card stats)
      totalHp  += Number(pb.flatBonusHp||0);
      totalAtk += Number(pb.flatBonusAtk||0);
      totalDef += Number(pb.flatBonusDef||0);
      return { hp:Math.max(1,totalHp), atk:Math.max(1,totalAtk), def:Math.max(1,totalDef) };
    }

    /* SFX helpers for story mode */
    function sfxSwordSlash(){
      if(!musicState.sfxEnabled)return;
      try{
        const ctx=getSfxCtx(); if(!ctx)return;
        [1200,800,400].forEach((f,i)=>{
          const o=ctx.createOscillator(),g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          o.type="sawtooth";o.frequency.value=f;
          g.gain.setValueAtTime(0.2,ctx.currentTime+i*0.04);
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.04+0.12);
          o.start(ctx.currentTime+i*0.04);o.stop(ctx.currentTime+i*0.04+0.14);
        });
      }catch{}
    }
    function sfxElectricZing(){
      if(!musicState.sfxEnabled)return;
      try{
        const ctx=getSfxCtx(); if(!ctx)return;
        for(let i=0;i<6;i++){
          const o=ctx.createOscillator(),g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          const f=400+Math.random()*1600;
          o.type=i%2===0?"square":"sawtooth";o.frequency.value=f;
          g.gain.setValueAtTime(0.15,ctx.currentTime+i*0.035);
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.035+0.09);
          o.start(ctx.currentTime+i*0.035);o.stop(ctx.currentTime+i*0.035+0.1);
        }
      }catch{}
    }
    function sfxDigitalPulse(){
      if(!musicState.sfxEnabled)return;
      [600,900,1200].forEach((f,i)=>setTimeout(()=>playSfxTone(f,0.1,"square",0.15),i*60));
    }
    function sfxHit(){
      if(!musicState.sfxEnabled)return;
      playSfxTone(150+Math.random()*80,0.15,"sawtooth",0.25);
    }

    /* Enter story mode */
    function openStoryMode(){
      const lv  = state.profile.level;
      const inv = state.profile.inventoryCards||[];
      const ch  = STORY_CHAPTERS[0];
      if(lv < ch.requirement.level || inv.length < ch.requirement.cards){
        showNeonModal({
          title:"🔒 Adventure Locked",
          body:`<div style="text-align:center;padding:8px 0;">
            <div style="font-size:32px;margin-bottom:10px;">⚔️</div>
            <div style="margin-bottom:8px;">Solo Leveling Story Mode unlock করতে:</div>
            <div class="sl-req-chip ${lv>=ch.requirement.level?"met":""}">Level ${ch.requirement.level}+ — তোমার Level: ${lv}</div>
            <div class="sl-req-chip ${inv.length>=ch.requirement.cards?"met":""}">কমপক্ষে ${ch.requirement.cards}টি কার্ড — তোমার: ${inv.length}টি</div>
          </div>`,
          okText:"বুঝেছি",cancelText:"",
        });
        return;
      }
      // Show rules first time
      const rulesShown = state.profile.storyRulesShown || state.story.rulesShownOnce;
      state.story.active = true;
      state.story.phase  = "map";
      state.story.rulesShownOnce = rulesShown;
      render();
      if(!rulesShown) setTimeout(()=>showStoryRulesModal(),200);
    }

    function showStoryRulesModal(){
      state.story.rulesShownOnce = true;
      if(state.currentUser&&!state.profile.storyRulesShown){
        updateDoc(getMetaRef(state.currentUser.uid),{storyRulesShown:true,updated_at:serverTimestamp()}).catch(()=>{});
      }
      const overlay = document.createElement("div");
      overlay.id="sl-rules-overlay";
      overlay.className="sl-overlay";
      overlay.innerHTML=`
        <div class="sl-modal sl-rules-modal">
          <div class="sl-modal-badge">⚔️ DUNGEON SYSTEM</div>
          <h3 class="sl-modal-title">Dungeon নিয়মাবলী</h3>
          <ol class="sl-rules-list">
            <li><span class="sl-rule-num">১</span><strong>পাওয়ার সিস্টেম:</strong> তোমার ইনভেন্টরির সব কার্ডের ATK, HP ও DEF যোগ হয়ে তোমার মোট শক্তি হয়। Permanent Bonus যোগ হয়।</li>
            <li><span class="sl-rule-num">২</span><strong>৫টি Chapter:</strong> Chapter 1 থেকে 5 পর্যন্ত সব Chapter ও Enemy সাথে সাথে Available। Ch.3 ও Ch.5-এ Jin-Woo-র রূপ পরিবর্তন হয়।</li>
            <li><span class="sl-rule-num">৩</span><strong>Coin Toss:</strong> প্রতিটি যুদ্ধ শুরুতে Coin Toss — কে আগে আক্রমণ করবে নির্ধারণ হয়।</li>
            <li><span class="sl-rule-num">৪</span><strong>তিনটি স্কিল:</strong>
              <br>⚔️ <b>Strike</b> — Normal ক্ষতি।
              <br>💥 <b>Heavy Strike</b> — 1.5x ক্ষতি, ৩ টার্ন Cooldown।
              <br>🛡️ <b>Guard</b> — Turn skip করে পরের enemy আঘাত ৫০% কমাও।
            </li>
            <li><span class="sl-rule-num">৫</span><strong>RNG:</strong> ১০% সম্ভাবনায় <b>CRITICAL!</b> (2x ক্ষতি 🔴) এবং ৫% সম্ভাবনায় <b>MISS!</b> (⚫ কোনো ক্ষতি নেই)।</li>
            <li><span class="sl-rule-num">৬</span><strong>Boss Rage:</strong> Boss-এর HP ২০%-এ নামলে ENRAGED — ATK ৫০% বাড়ে 😡</li>
            <li><span class="sl-rule-num">৭</span><strong>পুরস্কার:</strong> প্রথমবার জিতলে সম্পূর্ণ পুরস্কার। পরের বার শুধু ৩০% XP — Gold/Gems শূন্য।</li>
          </ol>
          <button class="sl-confirm-btn" id="sl-rules-ok">⚔️ বুঝেছি, শুরু করি!</button>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(()=>overlay.classList.add("visible"));
      sfxElectricZing();
      document.getElementById("sl-rules-ok").onclick=()=>{
        overlay.classList.remove("visible");
        setTimeout(()=>overlay.remove(),300);
      };
    }

    /* Start a chapter fight */
    function startStoryFight(chapterId, enemyIdx){
      const ch = STORY_CHAPTERS.find(c=>c.id===chapterId);
      if(!ch) return;
      const enemy = ch.enemies[enemyIdx];
      if(!enemy) return;

      const pStats = calcPlayerCombinedStats();

      state.story.chapter    = ch;
      state.story.enemyIdx   = enemyIdx;
      state.story.phase      = "coinToss";
      state.story.playerName = state.profile.username||"Jin-Woo";
      state.story.enemyName  = enemy.name;
      state.story.playerHP   = pStats.hp;
      state.story.playerHPmax= pStats.hp;
      state.story.playerDEF  = pStats.def;
      state.story.playerDEFmax=pStats.def;
      state.story.playerATK  = pStats.atk;
      state.story.enemyHP    = enemy.hp;
      state.story.enemyHPmax = enemy.hp;
      state.story.enemyDEF   = enemy.def;
      state.story.enemyDEFmax= enemy.def;
      state.story.enemyATK   = enemy.atk;
      state.story.currentEnemyATK = enemy.atk;
      state.story.animMsg    = "";
      state.story.animTarget = "";
      state.story.playerShake= false;
      state.story.enemyShake = false;
      state.story.lastAction = "";
      state.story.rewardClaimed = false;
      state.story.midDialogueDone= false;
      state.story.heavyStrikeCooldown = 0;
      state.story.guardActive = false;
      state.story.enrageTriggered = false;
      state.story.coinTossResult = "";
      state.story.firstAttacker = "";

      // Coin toss
      const firstAttacker = Math.random()<0.5 ? "player" : "enemy";
      state.story.firstAttacker = firstAttacker;
      state.story.coinTossResult = firstAttacker==="player" ? "PLAYER INITIATIVE" : "ENEMY INITIATIVE";

      render(); sfxSwordSlash();

      // After 2.5s coin toss → show dialogue
      setTimeout(()=>{
        const dl = getEnemyDialogue(enemy, "intro");
        state.story.dialogue   = dl;
        state.story.dialogueIdx= 0;
        state.story.phase      = "dialogue";
        render(); sfxElectricZing();
      }, 2500);
    }

    /* Story damage calculation: 2% to main HP, 1% to DEF */
    function storyApplyDamage(atkVal, hp, def){
      const dmgToMain = Math.max(1, Math.round(atkVal * 0.02));
      const dmgToDef  = Math.max(1, Math.round(atkVal * 0.01));
      let newHp=hp, newDef=def, shieldBroken=false;
      if(def>0){
        newDef = Math.max(0, def - dmgToDef);
        newHp  = Math.max(0, hp  - dmgToMain);
        if(newDef<=0) shieldBroken=true;
      } else {
        // Shield gone — full ATK hits HP
        const fullDmg = Math.max(1, Math.round(atkVal*0.05));
        newHp = Math.max(0, hp - fullDmg);
      }
      return{hp:newHp, def:newDef, shieldBroken, dmg:dmgToMain};
    }

    /* Player attacks enemy — action: "strike" | "heavy" | "guard" */
    function storyPlayerAttack(action="strike"){
      const s = state.story;
      if(s.phase!=="fight"||s.animMsg) return;
      sfxClick();

      if(action==="guard"){
        s.guardActive = true;
        s.lastAction  = "🛡️ Guard! নেক্সট enemy আক্রমণ ৫০% কমবে।";
        s.animMsg=""; s.animTarget="";
        render();
        setTimeout(()=>{ storyEnemyAttack(); },600);
        return;
      }

      if(action==="heavy"){
        if(s.heavyStrikeCooldown>0){
          showToast(`⏳ Heavy Strike cooldown: ${s.heavyStrikeCooldown} turn বাকি!`);
          return;
        }
        s.heavyStrikeCooldown = 3;
      }

      // Decrement cooldown at start of player turn
      if(s.heavyStrikeCooldown>0 && action!=="heavy") s.heavyStrikeCooldown--;

      let atkVal = s.playerATK;
      if(action==="heavy") atkVal = Math.round(s.playerATK * 1.5);

      // RNG: 10% crit (2x) | 5% miss
      const roll = Math.random();
      let isCrit = false, isMiss = false;
      if(roll < 0.05){ isMiss = true; }
      else if(roll < 0.15){ isCrit = true; atkVal = Math.round(atkVal * 2); }

      if(isMiss){
        s.animMsg   = "MISS!";
        s.animTarget= "enemy";
        s.lastAction= "💨 আক্রমণ মিস হয়ে গেছে!";
        sfxHit(); render();
        setTimeout(()=>{
          s.animMsg=""; s.animTarget="";
          storyEnemyAttack();
        },900);
        return;
      }

      const res = storyApplyDamage(atkVal, s.enemyHP, s.enemyDEF);
      s.enemyHP  = res.hp;
      s.enemyDEF = res.def;

      let msg = isCrit ? `CRITICAL! -${res.dmg}` : `-${res.dmg}`;
      if(action==="heavy") msg = `💥 HEAVY! ${msg}`;
      s.animMsg   = msg;
      s.animTarget= "enemy";
      s.enemyShake= true;
      s.lastAction= `${isCrit?"⚡ CRITICAL HIT! ":""}${action==="heavy"?"💥 Heavy Strike":"⚔️ Strike"}: -${res.dmg} dmg!${res.shieldBroken?" 🛡️ Shield Broken!":""}`;
      sfxHit(); render();

      // Boss Kasaka ENRAGE at 20% HP
      const ch = s.chapter;
      const enemy = ch?.enemies[s.enemyIdx];
      if(enemy?.isBoss && !s.enrageTriggered && s.enemyHP <= s.enemyHPmax * 0.20 && s.enemyHP > 0){
        s.enrageTriggered = true;
        s.currentEnemyATK = Math.round(enemy.atk * 1.5);
        s.enemyATK = s.currentEnemyATK;
        setTimeout(()=>{
          s.animMsg=""; s.animTarget=""; s.enemyShake=false;
          s.lastAction = "⚠️ BOSS ENRAGED! ATK +50%!";
          sfxElectricZing();
          render();
          setTimeout(()=>{
            if(!s.midDialogueDone){
              s.midDialogueDone=true;
              s.phase="dialogue";
              s.dialogue=getEnemyDialogue(enemy,"mid");
              s.dialogueIdx=0;
              render();
            } else {
              if(s.enemyHP<=0){ storyEndBattle("player"); return; }
              storyEnemyAttack();
            }
          },1200);
        },900);
        return;
      }

      // Mid-boss dialogue at 50% HP (non-enrage)
      if(enemy?.isBoss && !s.midDialogueDone && s.enemyHP <= s.enemyHPmax*0.5){
        s.midDialogueDone=true;
        setTimeout(()=>{
          s.animMsg="";s.animTarget="";s.enemyShake=false;
          s.phase="dialogue";
          s.dialogue=getEnemyDialogue(enemy,"mid");
          s.dialogueIdx=0;
          render();
        },900);
        return;
      }

      setTimeout(()=>{
        s.animMsg="";s.animTarget="";s.enemyShake=false;
        if(s.enemyHP<=0){ storyEndBattle("player"); return; }
        storyEnemyAttack();
      },900);
    }

    /* Enemy attacks player (auto after player) */
    function storyEnemyAttack(){
      const s = state.story;
      if(s.phase!=="fight") return;

      // Enemy initiative (if coin toss said enemy goes first, this handles first turn)
      let atkVal = s.enemyATK;

      // Guard reduces incoming by 50%
      if(s.guardActive){
        atkVal = Math.round(atkVal * 0.5);
        s.guardActive = false;
      }

      // Enemy crit/miss RNG (same odds)
      const roll = Math.random();
      let isCrit = false, isMiss = false;
      if(roll < 0.05){ isMiss = true; }
      else if(roll < 0.15){ isCrit = true; atkVal = Math.round(atkVal * 2); }

      if(isMiss){
        s.animMsg   = "MISS!";
        s.animTarget= "player";
        s.lastAction= `💨 ${s.enemyName} missed!`;
        sfxHit(); render();
        setTimeout(()=>{ s.animMsg=""; s.animTarget=""; render(); },900);
        return;
      }

      const res = storyApplyDamage(atkVal, s.playerHP, s.playerDEF);
      s.playerHP  = res.hp;
      s.playerDEF = res.def;
      s.animMsg   = isCrit ? `CRITICAL! -${res.dmg}` : `-${res.dmg}`;
      s.animTarget= "player";
      s.playerShake=true;
      s.lastAction= `${isCrit?"⚡ ENEMY CRIT! ":""}${s.enemyName}: -${res.dmg} dmg!${res.shieldBroken?" 🛡️ Shield Broken!":""}`;
      sfxHit(); render();

      setTimeout(()=>{
        s.animMsg="";s.animTarget="";s.playerShake=false;
        if(s.playerHP<=0){ storyEndBattle("enemy"); return; }
        render();
      },900);
    }

    /* End story battle */
    function storyEndBattle(winner){
      const s = state.story;
      const ch = s.chapter;
      const enemy = ch?.enemies[s.enemyIdx];
      if(winner==="player"){
        // Add defeated enemy to Shadow Army (Ch2+ only for boss, all enemies collected)
        if(enemy) addShadow(enemy);
        s.phase="dialogue";
        s.dialogue = getEnemyDialogue(enemy, "victory");
        s.dialogueIdx=0;
        s._pendingVictory=true;
        render();
      } else {
        s.phase="dialogue";
        s.dialogue = getEnemyDialogue(enemy, "defeat");
        s.dialogueIdx=0;
        s._pendingDefeat=true;
        render();
      }
    }

    /* ══ ARISE System ══ */
    function openAriseModal(){
      const ch = state.story.chapter;
      if(!ch || ch.id < 2){ showToast("⚠️ ARISE — Chapter 2 থেকে পাওয়া যাবে!"); return; }
      state.story.ariseOpen = true;
      state.story.selectedShadows = [...(state.story.selectedShadows||[])];
      render();
    }
    function closeAriseModal(){ state.story.ariseOpen = false; render(); }
    function toggleAriseShadow(id){
      const sel = state.story.selectedShadows;
      const idx = sel.indexOf(id);
      if(idx>=0) sel.splice(idx,1); else sel.push(id);
      render();
    }
    function confirmArise(){
      const s = state.story;
      const army = getShadowArmy();
      const chosen = army.filter(sh=>s.selectedShadows.includes(sh.id));
      if(!chosen.length){ showToast("কোনো Shadow বেছে নাওনি!"); return; }

      // Calculate 50% of original stats
      let bonusHP=0, bonusATK=0, bonusDEF=0;
      chosen.forEach(sh=>{ bonusHP+=Math.round(sh.hp*0.5); bonusATK+=Math.round(sh.atk*0.5); bonusDEF+=Math.round(sh.def*0.5); });

      // Play ARISE audio
      playAriseAudio();

      // Trigger kinetic burst animation from ARISE button position
      triggerAriseBurst(chosen);

      // Apply bonuses
      s.playerHP    += bonusHP;
      s.playerHPmax += bonusHP;
      s.playerATK   += bonusATK;
      s.playerDEF   += bonusDEF;
      s.playerDEFmax+= bonusDEF;
      s.shadowBonusHP  = bonusHP;
      s.shadowBonusATK = bonusATK;
      s.shadowBonusDEF = bonusDEF;
      s.ariseActive = true;
      s.ariseOpen   = false;
      s.lastAction  = `⚫ ARISE! +${fmtNum(bonusATK)} ATK, +${fmtNum(bonusHP)} HP, +${fmtNum(bonusDEF)} DEF`;
      render();
    }

    function triggerAriseBurst(chosenShadows){
      // Remove existing overlay
      const existing = document.getElementById("arise-mist-overlay");
      if(existing) existing.remove();
      const existingBurst = document.getElementById("arise-burst-overlay");
      if(existingBurst) existingBurst.remove();

      // Get ARISE button position for burst origin
      const ariseBtn = document.getElementById("arise-confirm-btn");
      const btnRect = ariseBtn ? ariseBtn.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width:120, height:44 };
      const originX = btnRect.left + btnRect.width/2;
      const originY = btnRect.top + btnRect.height/2;

      // Create mist overlay
      const mistEl = document.createElement("div");
      mistEl.id = "arise-mist-overlay";
      mistEl.className = "arise-mist";
      document.body.appendChild(mistEl);

      // Create burst container
      const burstEl = document.createElement("div");
      burstEl.id = "arise-burst-overlay";
      burstEl.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;`;
      document.body.appendChild(burstEl);

      // Screen shake
      document.getElementById("app")?.classList.add("screen-shake");

      // Spawn shadow thumbnails bursting from button
      chosenShadows.forEach((sh, i)=>{
        const thumb = document.createElement("div");
        thumb.className = "arise-burst-thumb";
        thumb.style.cssText = `
          position:fixed;
          left:${originX}px;
          top:${originY}px;
          width:60px;height:60px;
          border-radius:50%;
          overflow:hidden;
          opacity:0;
          transform:translate(-50%,-50%) scale(0.3);
          box-shadow:0 0 20px rgba(139,0,255,0.9),0 0 40px rgba(100,0,200,0.6);
          border:2px solid rgba(180,0,255,0.8);
          z-index:9999;
          pointer-events:none;
          animation: ariseBurstVibrate 0.15s ease-in-out infinite alternate;
        `;
        thumb.innerHTML = `<img src="${escapeHtml(sh.image)}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;filter:saturate(0.4) brightness(0.7) hue-rotate(240deg);" />`;
        burstEl.appendChild(thumb);

        // Animate: burst outward from origin to final position
        const angle = (i / Math.max(chosenShadows.length,1)) * Math.PI * 2;
        const radius = 80 + i * 20;
        const finalX = originX + Math.cos(angle) * radius;
        const finalY = originY + Math.sin(angle) * radius - 60;

        // Phase 1: appear and burst out with vibration
        setTimeout(()=>{
          thumb.style.transition = "all 0.6s cubic-bezier(0.34,1.56,0.64,1)";
          thumb.style.opacity = "0.85";
          thumb.style.left = finalX+"px";
          thumb.style.top  = finalY+"px";
          thumb.style.transform = "translate(-50%,-50%) scale(1)";
        }, 50 + i*80);

        // Phase 2: settle into position behind Jin-Woo card
        setTimeout(()=>{
          // Find jin-woo player card position
          const playerImg = document.querySelector(".sl-char-img.player-img");
          const pRect = playerImg ? playerImg.getBoundingClientRect() : { left:window.innerWidth*0.25, top:window.innerHeight*0.4, width:80, height:120 };
          const settleX = pRect.left + pRect.width*0.5 + (i - chosenShadows.length/2)*30;
          const settleY = pRect.top  + pRect.height*0.6;
          thumb.style.transition = "all 0.8s ease-in-out";
          thumb.style.left  = settleX+"px";
          thumb.style.top   = settleY+"px";
          thumb.style.width = "44px";
          thumb.style.height= "44px";
          thumb.style.opacity="0.75";
          thumb.style.zIndex="2"; // behind Jin-Woo
        }, 700 + i*80);
      });

      // Cleanup
      setTimeout(()=>{
        document.getElementById("app")?.classList.remove("screen-shake");
        mistEl.classList.add("arise-mist-fade");
        setTimeout(()=>{ mistEl.remove(); burstEl.remove(); }, 800);
      }, 3000);
    }

    function viewAriseModal(){
      const s = state.story;
      if(!s.ariseOpen) return "";
      const army = getShadowArmy();
      const ch = s.chapter;
      if(!ch || ch.id < 2) return "";
      return`<div class="arise-overlay" id="arise-overlay">
        <div class="arise-modal">
          <div class="arise-modal-header">
            <div class="arise-title">⚫ ARISE — Shadow Army</div>
            <button class="arise-close-btn" id="arise-close-btn">✕</button>
          </div>
          <div class="arise-sub">Shadow বেছে নাও। প্রতিটি Shadow তার original stats-এর 50% যোগ করবে।</div>
          ${army.length===0
            ? `<div class="arise-empty">এখনো কোনো Shadow নেই।<br/>শত্রু হারাও এবং তাদের Shadow হিসেবে সংগ্রহ করো!</div>`
            : `<div class="arise-army-grid">${army.map(sh=>{
                const sel = s.selectedShadows.includes(sh.id);
                return`<div class="arise-shadow-card ${sel?"arise-selected":""}" data-toggle-shadow="${sh.id}">
                  <img src="${escapeHtml(sh.image)}" class="arise-shadow-img ${sel?"arise-shadow-glow":""}" />
                  <div class="arise-shadow-name">${escapeHtml(sh.name)}</div>
                  <div class="arise-shadow-stats">⚔️${fmtNum(Math.round(sh.atk*0.5))} ❤️${fmtNum(Math.round(sh.hp*0.5))} 🛡️${fmtNum(Math.round(sh.def*0.5))}</div>
                  ${sel?`<div class="arise-check">✓</div>`:""}
                </div>`;
              }).join("")}</div>`
          }
          ${army.length>0?`<button class="arise-confirm-btn" id="arise-confirm-btn">⚫ ARISE! (${s.selectedShadows.length} selected)</button>`:""}
        </div>
      </div>`;
    }

    /* Advance story dialogue — also handles pending victory/defeat */
    function advanceStoryDialogue(){
      const s = state.story;
      s.dialogueIdx++;
      if(s.dialogueIdx >= s.dialogue.length){
        if(s._pendingVictory){ s._pendingVictory=false; s.phase="victory"; sfxElectricZing(); render(); return; }
        if(s._pendingDefeat){ s._pendingDefeat=false; s.phase="defeat"; render(); return; }
        s.phase = "fight";
        render();
        // If enemy had initiative and it's the very first entry into fight, let enemy attack first
        if(s.firstAttacker==="enemy" && !s.midDialogueDone && s.lastAction===""){
          setTimeout(()=>storyEnemyAttack(), 500);
        }
      } else render();
    }

    /* Claim story victory reward */
    async function claimStoryReward(){
      const s = state.story;
      if(s.rewardClaimed||s.phase!=="victory") return;
      s.rewardClaimed=true;
      const ch = s.chapter; if(!ch) return;
      const enemy = ch.enemies[s.enemyIdx];
      const rw = ch.reward;
      const firstClear = isFirstClearEnemy(enemy?.id||"enemy");
      sfxDigitalPulse();

      const isBoss = !!enemy?.isBoss;

      // Boss: 100% of listed reward. Normal enemy: 5% of chapter reward.
      // On repeat clears: 30% XP only (no gold/gems).
      let xpGain, goldGain, gemsGain;
      if(firstClear){
        if(isBoss){
          xpGain   = rw.xp;
          goldGain = rw.gold;
          gemsGain = rw.gems;
        } else {
          xpGain   = Math.max(1, Math.round(rw.xp   * 0.05));
          goldGain = Math.max(1, Math.round(rw.gold  * 0.05));
          gemsGain = 0;
        }
      } else {
        // repeat clear
        xpGain   = isBoss ? Math.round(rw.xp * 0.3) : Math.max(1, Math.round(rw.xp * 0.05 * 0.3));
        goldGain = 0;
        gemsGain = 0;
      }

      let permAtk  = (firstClear && isBoss) ? (rw.permAtk||0)  : 0;
      let permHp   = (firstClear && isBoss) ? (rw.permHp||0)   : 0;
      let permDef  = (firstClear && isBoss) ? (rw.permDef||0)  : 0;

      if(firstClear) markEnemyCleared(enemy?.id||"enemy");

      try{
        await runTransaction(db,async tx=>{
          const snap=await tx.get(getMetaRef(state.currentUser.uid)); if(!snap.exists())throw new Error();
          const d=snap.data();
          // STORY MODE: XP is added to player XP. Power (permBonus%) is SEPARATE from XP.
          const nXp=Number(d.xp||0)+xpGain;
          const update = {
            xp:nXp, level:lvFromXp(nXp),
            gold:Number(d.gold||0)+goldGain,
            gems:Number(d.gems||0)+gemsGain,
            updated_at:serverTimestamp()
          };
          if(isBoss && firstClear){
            update.dungeonConqueror=true;
            update.permBonusAtk=Number(d.permBonusAtk||0)+permAtk;
            update.permBonusHp=Number(d.permBonusHp||0)+permHp;
            update.permBonusDef=Number(d.permBonusDef||0)+permDef;
          }
          tx.update(getMetaRef(state.currentUser.uid), update);
          checkAndShowLevelUp(nXp);
        });
        if(firstClear){
          showToast(`🏆 First Clear! +${xpGain}XP +${goldGain}🪙 +${gemsGain}💎`);
          if(goldGain>0) showGoldFlash(goldGain);
        } else {
          showToast(`🔄 Repeat: +${xpGain}XP (Gold শুধু প্রথমবার)`);
        }
      }catch(e){ console.error(e); }
      render();
    }

    /* Exit story mode — full reset to prevent freezing */
    function exitStoryMode(){
      const prev = state.story;
      state.story = {
        active:false, phase:"map", chapter:null,
        activeMapChapter: prev.activeMapChapter||1,
        rulesShownOnce:prev.rulesShownOnce,
        dialogue:[], dialogueIdx:0,
        playerHP:0, playerHPmax:0, playerDEF:0, playerDEFmax:0, playerATK:0,
        enemyHP:0, enemyHPmax:0, enemyDEF:0, enemyDEFmax:0, enemyATK:0,
        playerName:"Jin-Woo", enemyName:"", animMsg:"", animTarget:"",
        playerShake:false, enemyShake:false, lastAction:"", rewardClaimed:false,
        permanentBonus:{ atk:0, hp:0, def:0 },
        coinTossResult:"", firstAttacker:"",
        heavyStrikeCooldown:0, guardActive:false, enrageTriggered:false,
        currentEnemyATK:0,
        _pendingVictory:false, _pendingDefeat:false, midDialogueDone:false, enemyIdx:0
      };
      state.activeTab = "adventure";
      render();
    }

    /* ─── Story Mode Views ─── */
    function viewStoryMode(){
      const s = state.story;
      if(s.phase==="map")      return viewStoryMap();
      if(s.phase==="coinToss") return viewStoryCoinToss();
      if(s.phase==="dialogue") return viewStoryDialogue();
      if(s.phase==="fight")    return viewStoryFight();
      if(s.phase==="victory")  return viewStoryVictory();
      if(s.phase==="defeat")   return viewStoryDefeat();
      return viewStoryMap();
    }

    function viewStoryCoinToss(){
      const s = state.story;
      const isPlayer = s.firstAttacker === "player";
      const jinwooImg = getJinwooImage(s.chapter?.id||1);
      return`<div class="sl-screen sl-cointoss-screen">
        <div class="sl-cointoss-wrap">
          <div class="sl-cointoss-coin ${isPlayer?"coin-heads":"coin-tails"}">🪙</div>
          <div class="sl-cointoss-result ${isPlayer?"sl-initiative-player":"sl-initiative-enemy"}">
            ${s.coinTossResult}
          </div>
          <div class="sl-cointoss-sub">${isPlayer?"⚔️ 당신이 먼저 공격합니다!":"⚡ 적이 먼저 공격합니다!"}</div>
          <div class="sl-cointoss-loading"><div class="sl-cointoss-bar"></div></div>
        </div>
      </div>`;
    }

    function viewStoryMap(){
      const lv = state.profile.level;
      const inv= state.profile.inventoryCards||[];
      const pStats = calcPlayerCombinedStats();
      const activeChId = state.story.activeMapChapter || 1;
      const ch = STORY_CHAPTERS.find(c=>c.id===activeChId) || STORY_CHAPTERS[0];
      const jinwooImg = getJinwooImage(activeChId);

      const chapterTabs = STORY_CHAPTERS.map(c=>`
        <button class="sl-ch-tab ${c.id===activeChId?"sl-ch-tab-active":""}" data-select-chapter="${c.id}">
          Ch.${c.id}
        </button>`).join("");

      const enemyCards = ch.enemies.map((e,i)=>`
        <div class="sl-enemy-node ${e.isBoss?"boss-node":"normal-node"}" data-fight-enemy="${i}" data-chapter-id="${ch.id}">
          <div class="sl-enemy-img-wrap">
            <img src="${e.image}" alt="${e.name}" class="sl-enemy-thumb ${e.isBoss?"boss-thumb":""}" />
            ${e.isBoss?`<div class="sl-boss-crown">👑</div>`:""}
          </div>
          <div class="sl-enemy-node-name">${e.name}</div>
          <div class="sl-enemy-node-stats">❤️${fmtNum(e.hp)} ⚔️${fmtNum(e.atk)} 🛡️${fmtNum(e.def)}</div>
          ${e.isBoss?`<div class="sl-boss-label">BOSS</div>`:""}
          <button class="sl-fight-btn" data-fight-enemy="${i}" data-chapter-id="${ch.id}">⚔️ Fight</button>
        </div>`).join(`<div class="sl-path-arrow">→</div>`);

      return`<div class="sl-screen">
        <div class="sl-map-header">
          <button class="sl-back-btn" id="sl-exit">← Exit</button>
          <div class="sl-map-title">⚔️ Solo Leveling</div>
          <div style="display:flex;gap:6px;">
            <button class="sl-refresh-btn" id="sl-refresh-btn" title="Refresh">🔄</button>
            <button class="sl-help-btn" id="sl-rules-btn" title="Rules">ℹ️</button>
          </div>
        </div>

        <!-- Chapter tabs -->
        <div class="sl-chapter-tabs">${chapterTabs}</div>

        <!-- Active chapter title -->
        <div class="sl-ch-title-row">
          <div class="sl-ch-number">CH.${ch.id}</div>
          <div class="sl-ch-title">${ch.title}</div>
        </div>

        <!-- Player stats bar -->
        <div class="sl-player-stats-bar">
          <img src="${jinwooImg}" alt="Jin-Woo" class="sl-player-thumb" />
          <div class="sl-pstat-info">
            <div class="sl-pstat-name">${escapeHtml(state.profile.username||"Jin-Woo")} <span class="sl-rank-e sl-rank-ch${activeChId}">${getChapterRank(activeChId)}</span>${state.profile.dungeonConqueror?'<span class="sl-title-badge">Dungeon Conqueror</span>':""}</div>
            <div class="sl-pstat-row">❤️<strong>${fmtNum(pStats.hp)}</strong> ⚔️<strong>${fmtNum(pStats.atk)}</strong> 🛡️<strong>${fmtNum(pStats.def)}</strong></div>
            ${state.profile.permBonusAtk>0?`<div class="sl-perm-bonus">✨ Perm: +${state.profile.permBonusAtk}%ATK +${state.profile.permBonusHp}%HP +${state.profile.permBonusDef}%DEF</div>`:""}
          </div>
        </div>

        <!-- Enemy path -->
        <div class="sl-dungeon-map">
          <div class="sl-enemy-path">${enemyCards}</div>
        </div>

        <!-- Chapter reward -->
        <div class="sl-map-footer">
          <div class="sl-reward-preview">
            🏆 ${ch.title} Reward: +${fmtNum(ch.reward.xp)}XP +${fmtNum(ch.reward.gold)}🪙 +${ch.reward.gems}💎
            ${ch.reward.permAtk?`| Perm: +${ch.reward.permAtk}%ATK +${ch.reward.permHp}%HP +${ch.reward.permDef}%DEF`:""}
          </div>
          <div style="margin-top:4px;color:#f87171;font-size:11px;">⚠️ প্রথমবার জিতলেই পূর্ণ পুরস্কার। পরে শুধু XP (30%)।</div>
        </div>
      </div>`;
    }

    /* Small number formatter — 1,500,000 → 1.5M */
    function fmtNum(n){
      if(n>=1e9) return (n/1e9).toFixed(1).replace(/\.0$/,"")+"B";
      if(n>=1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"")+"M";
      if(n>=1e3) return (n/1e3).toFixed(1).replace(/\.0$/,"")+"K";
      return String(n);
    }

    function viewStoryDialogue(){
      const s = state.story;
      const ch = s.chapter;
      const enemy = ch?.enemies?.[s.enemyIdx];
      const dlg = s.dialogue[s.dialogueIdx]||{};
      const isPlayer = dlg.speaker==="player";
      const jinwooImg = getJinwooImage(ch?.id||1);
      const speakerImg = isPlayer ? jinwooImg : (enemy?.image||"");
      const speakerName = isPlayer ? (state.profile.username||"Jin-Woo") : (enemy?.name||"Enemy");
      return`<div class="sl-screen sl-dialogue-screen">
        <div class="sl-dialogue-bg">
          <img src="${isPlayer?enemy?.image||"":jinwooImg}" alt="" class="sl-dlg-bg-char sl-dlg-enemy" />
          <img src="${isPlayer?jinwooImg:enemy?.image||""}" alt="" class="sl-dlg-bg-char sl-dlg-player" />
        </div>
        <div class="sl-dialogue-box" id="sl-dialogue-box" onclick="advanceStoryDialogue()">
          <div class="sl-dlg-speaker ${isPlayer?"player":"enemy"}">${escapeHtml(speakerName)}</div>
          <div class="sl-dlg-text">${escapeHtml(dlg.text||"")}</div>
          <div class="sl-dlg-tap">Tap to continue ▶</div>
        </div>
      </div>`;
    }

    function viewStoryFight(){
      const s = state.story;
      const ch = s.chapter;
      const enemy = ch?.enemies?.[s.enemyIdx]||{};
      const pHPpct  = Math.max(0,Math.round((s.playerHP/Math.max(1,s.playerHPmax))*100));
      const pDEFpct = Math.max(0,Math.round((s.playerDEF/Math.max(1,s.playerDEFmax))*100));
      const eHPpct  = Math.max(0,Math.round((s.enemyHP/Math.max(1,s.enemyHPmax))*100));
      const eDEFpct = Math.max(0,Math.round((s.enemyDEF/Math.max(1,s.enemyDEFmax))*100));
      const isAnimating = !!s.animMsg;
      const hsCd = s.heavyStrikeCooldown||0;
      const isEnraged = s.enrageTriggered;

      // Detect critical/miss for floating text color
      const isCritMsg = s.animMsg && s.animMsg.includes("CRITICAL");
      const isMissMsg = s.animMsg && s.animMsg.includes("MISS");

      return`<div class="sl-screen sl-fight-screen">
        <!-- HP bars -->
        <div class="sl-fight-hud">
          <div class="sl-hud-side player-hud">
            <div class="sl-hud-name">${escapeHtml(s.playerName)}</div>
            <div class="sl-hud-bar-row">
              <div class="sl-hud-bar-wrap"><div class="sl-hud-hp-fill" style="width:${pHPpct}%;"></div></div>
              <span class="sl-hud-num">${s.playerHP}/${s.playerHPmax}</span>
            </div>
            <div class="sl-hud-bar-row">
              <div class="sl-hud-bar-wrap sl-def-wrap"><div class="sl-hud-def-fill" style="width:${pDEFpct}%;"></div></div>
              <span class="sl-hud-def-num">🛡️${s.playerDEF}</span>
            </div>
            ${s.guardActive?`<div class="sl-guard-status">🛡️ GUARDING</div>`:""}
          </div>
          <div class="sl-hud-vs">VS</div>
          <div class="sl-hud-side enemy-hud">
            <div class="sl-hud-name enemy-name">${escapeHtml(s.enemyName)}${isEnraged?` <span class="sl-enrage-tag">😡ENRAGED</span>`:""}
            </div>
            <div class="sl-hud-bar-row">
              <div class="sl-hud-bar-wrap"><div class="sl-hud-hp-fill enemy-hp" style="width:${eHPpct}%;"></div></div>
              <span class="sl-hud-num">${s.enemyHP}/${s.enemyHPmax}</span>
            </div>
            <div class="sl-hud-bar-row">
              <div class="sl-hud-bar-wrap sl-def-wrap"><div class="sl-hud-def-fill" style="width:${eDEFpct}%;"></div></div>
              <span class="sl-hud-def-num">🛡️${s.enemyDEF}</span>
            </div>
          </div>
        </div>
        <!-- Battle field -->
        <div class="sl-field">
          <div class="sl-char-col player-col">
            <img src="${getJinwooImage(s.chapter?.id||1)}" alt="${escapeHtml(s.playerName)}"
              class="sl-char-img player-img ${s.playerShake?"sl-shake":""} ${s.animTarget==="player"?"sl-hit":""}" />
            ${s.animTarget==="player"&&s.animMsg?`<div class="sl-dmg-num player-dmg ${isCritMsg?"sl-crit-text":""} ${isMissMsg?"sl-miss-text":""}">${s.animMsg}</div>`:""}
          </div>
          <div class="sl-vs-center">⚡</div>
          <div class="sl-char-col enemy-col">
            <img src="${escapeHtml(enemy.image||"")}" alt="${escapeHtml(s.enemyName)}"
              class="sl-char-img enemy-img ${s.enemyShake?"sl-shake":""} ${s.animTarget==="enemy"?"sl-hit":""} ${isEnraged?"sl-enraged-img":""}" />
            ${s.animTarget==="enemy"&&s.animMsg?`<div class="sl-dmg-num enemy-dmg ${isCritMsg?"sl-crit-text":""} ${isMissMsg?"sl-miss-text":""}">${s.animMsg}</div>`:""}
          </div>
        </div>
        <!-- Action log -->
        ${s.lastAction?`<div class="sl-action-log">${escapeHtml(s.lastAction)}</div>`:""}

        <!-- 3-Skill Action Bar -->
        <div class="sl-skill-bar">
          <button class="sl-skill-btn sl-strike-btn ${isAnimating?"sl-skill-disabled":""}"
            id="sl-attack-btn" data-action="strike" ${isAnimating?"disabled":""}>
            ⚔️ Strike
            <span class="sl-skill-sub">Normal DMG</span>
          </button>
          <button class="sl-skill-btn sl-heavy-btn ${isAnimating||hsCd>0?"sl-skill-disabled":""}"
            data-action="heavy" ${isAnimating||hsCd>0?"disabled":""}>
            💥 Heavy
            <span class="sl-skill-sub">${hsCd>0?`CD: ${hsCd}`:"1.5x DMG"}</span>
          </button>
          <button class="sl-skill-btn sl-guard-btn ${isAnimating?"sl-skill-disabled":""}"
            data-action="guard" ${isAnimating?"disabled":""}>
            🛡️ Guard
            <span class="sl-skill-sub">-50% next hit</span>
          </button>
        </div>
        ${(s.chapter?.id||1) >= 2 ? `
        <div class="sl-arise-row">
          ${s.ariseActive
            ? `<div class="sl-shadow-active-badge">⚫ Shadows Active: +${fmtNum(s.shadowBonusATK)} ATK +${fmtNum(s.shadowBonusHP)} HP +${fmtNum(s.shadowBonusDEF)} DEF</div>`
            : `<button class="sl-arise-btn" id="sl-arise-btn">⚫ ARISE</button>`
          }
        </div>` : ""}
        <button class="sl-back-btn" style="margin-top:8px;width:100%;" id="sl-exit">← Retreat</button>
      </div>
      ${viewAriseModal()}`;
    }

    function viewStoryVictory(){
      const s = state.story;
      const ch = s.chapter;
      const rw = ch?.reward;
      return`<div class="sl-screen sl-system-screen">
        <div class="sl-system-notification">
          <div class="sl-system-glitch">SYSTEM NOTIFICATION</div>
          <div class="sl-system-title">⚡ You Have Slain the Boss ⚡</div>
          <div class="sl-system-divider"></div>
          <div class="sl-reward-list">
            <div class="sl-reward-item">📦 Quest: Kasaka Slayer — <span class="sl-reward-val">COMPLETE</span></div>
            <div class="sl-reward-item">⚡ EXP Gained — <span class="sl-reward-val">+${rw?.xp||0}</span></div>
            <div class="sl-reward-item">🪙 Gold — <span class="sl-reward-val">+${rw?.gold||0}</span></div>
            <div class="sl-reward-item">💎 Gems — <span class="sl-reward-val">+${rw?.gems||0}</span></div>
            <div class="sl-reward-item">🏆 New Title — <span class="sl-reward-val">${rw?.title||""}</span></div>
            <div class="sl-reward-item">✨ Permanent Buff — <span class="sl-reward-val">+${rw?.permAtk||0}%ATK +${rw?.permHp||0}%HP +${rw?.permDef||0}%DEF</span></div>
          </div>
          <div class="sl-system-divider"></div>
          ${!s.rewardClaimed
            ?`<button class="sl-confirm-btn" id="sl-claim-reward">[ CONFIRM ]</button>`
            :`<div class="sl-claimed-msg">✅ Rewards Claimed!</div>`}
          <button class="sl-back-btn" style="margin-top:12px;" id="sl-exit-after">← Return to Map</button>
        </div>
      </div>`;
    }

    function viewStoryDefeat(){
      return`<div class="sl-screen sl-defeat-screen">
        <div class="sl-defeat-text">YOU FAILED</div>
        <div class="sl-defeat-sub">তুমি পরাজিত হয়েছো। আবার চেষ্টা করো।</div>
        <button class="sl-back-btn" style="margin-top:20px;" id="sl-exit">← আবার চেষ্টা করো</button>
      </div>`;
    }

    function viewApp(){
      const p=state.profile;
      const content=
        state.activeTab==="profile"?viewProfile():
        state.activeTab==="feed"?viewFeed():
        state.activeTab==="tracker"?viewTracker():
        state.activeTab==="chat"?viewChat():
        state.activeTab==="arena"?viewArena():
        state.activeTab==="shop"?viewShop():
        state.activeTab==="adventure"?(state.story.active?viewStoryMode():viewStoryMap()):
        viewInventory();
      return`${state.toast?`<div class="toast">${escapeHtml(state.toast)}</div>`:""}
        <header class="top">
          <div class="brand">Anime Meta Hub</div>
          <div class="top-chips">
            <div class="chip">${p.xp} XP</div>
            <div class="gem-chip">💎 ${p.gems||0}</div>
            <div class="gold-chip">🪙 ${p.gold||0}</div>
            <button class="music-open-btn" id="music-panel-btn" title="Music & SFX">${musicState.enabled?"🎵":"🔇"}</button>
          </div>
        </header>
        <div id="music-panel-wrap" class="${musicState.open?"music-panel-open":"music-panel-closed"}"></div>
        <main class="main">${content}</main>
        <nav class="nav">
          <button data-tab="profile"   class="nav-btn ${state.activeTab==="profile"?"active":""}"><span class="nav-icon">👤</span><span class="nav-label">Profile</span></button>
          <button data-tab="arena"     class="nav-btn ${state.activeTab==="arena"?"active":""}"><span class="nav-icon">🎡</span><span class="nav-label">Arena</span></button>
          <button data-tab="feed"      class="nav-btn ${state.activeTab==="feed"?"active":""}"><span class="nav-icon">📣</span><span class="nav-label">Feed</span></button>
          <button data-tab="shop"      class="nav-btn ${state.activeTab==="shop"?"active":""}"><span class="nav-icon">🛍️</span><span class="nav-label">Shop</span></button>
          <button id="nav-more-btn"    class="nav-btn ${["inventory","tracker","chat","adventure"].includes(state.activeTab)?"active":""}"><span class="nav-icon">⋯</span><span class="nav-label">More</span></button>
        </nav>
        ${state.navMoreOpen?`<div class="nav-more-overlay" id="nav-more-overlay">
          <div class="nav-more-drawer">
            <div class="nav-more-title">More</div>
            <div class="nav-more-grid">
              <button data-tab="inventory" class="nav-more-item ${state.activeTab==="inventory"?"active":""}"><span>🃏</span>Cards</button>
              <button data-tab="tracker"   class="nav-more-item ${state.activeTab==="tracker"?"active":""}"><span>📺</span>Tracker</button>
              <button data-tab="chat"      class="nav-more-item ${state.activeTab==="chat"?"active":""}"><span>💬</span>Chat${(state.totalUnread||0)>0?`<span class="nav-more-badge">${(state.totalUnread||0)>9?"9+":state.totalUnread}</span>`:""}</button>
              <button data-tab="adventure" class="nav-more-item ${state.activeTab==="adventure"?"active":""}"><span>⚔️</span>Adventure</button>
            </div>
          </div>
        </div>`:""}
        ${viewImportModal()}${viewEquipModal()}${viewInspectProfile()}${viewNewsModal()}${viewQuizRulesModal()}${viewQuizModal()}${viewCardPreviewModal()}${viewCardDetailModal()}`;
    }

    function render(){
      const ae=document.activeElement;
      const ps=ae?.id==="chat-search-input"&&state.activeTab==="chat"&&!state.activeChatUserId&&!state.globalChatOpen?{value:ae.value,s:ae.selectionStart,e:ae.selectionEnd}:null;
      if(!state.authReady){root.innerHTML=`<div class="loading">Loading Anime Meta Hub...</div>`;return;}
      if(!state.currentUser){root.innerHTML=viewAuth();bindAuth();return;}
      root.innerHTML=viewApp();bindApp();
      if(ps){const inp=document.getElementById("chat-search-input");if(inp){inp.focus();inp.value=ps.value;try{inp.setSelectionRange(ps.s,ps.e);}catch{}}}
    }

    /* ══════════════════════════════════════════════
       BIND AUTH
    ══════════════════════════════════════════════ */
    function bindAuth(){
      const mapErr=code=>{ if(code==="auth/invalid-credential")return"Invalid email or password."; if(code==="auth/email-already-in-use")return"Email already in use."; if(code==="auth/weak-password")return"Password must be 6+ chars."; return"Authentication failed."; };
      const submit=async()=>{
        if(state.authBusy)return;
        const email=(document.getElementById("auth-email")?.value||"").trim();
        const pass=document.getElementById("auth-pass")?.value||"";
        const username=(document.getElementById("auth-username")?.value||"").trim();
        if(!email||!pass){state.authError="Please fill all fields.";render();return;}
        state.authBusy=true; state.authError=""; render();
        try{
          if(state.authMode==="login") await signInWithEmailAndPassword(auth,email,pass);
          else{
            const cred=await createUserWithEmailAndPassword(auth,email,pass);
            await setDoc(getMetaRef(cred.user.uid),{uid:cred.user.uid,email,username:username||email.split("@")[0],avatar:AVATARS[0],Bio:"",xp:0,level:1,gems:0,gold:0,tracker:[],recentChats:[],freeSpins:0,inventoryCards:[],equippedSlots:{},inventory:{themes:[]},equippedTheme:"",online:true,lastSeenMs:Date.now(),last_claim_date:Timestamp.fromMillis(0),daily_read_count:0,last_read_date:"",missionData:{date:"",progress:emptyProgress(),claimed:emptyClaimed()},created_at:serverTimestamp(),updated_at:serverTimestamp()});
            await setDoc(getActivityRef(cred.user.uid),{uid:cred.user.uid,day_key:"",count:0,updated_at:serverTimestamp()});
          }
        }catch(err){ state.authError=mapErr(err?.code); state.authBusy=false; render(); }
      };
      document.getElementById("auth-submit-btn")?.addEventListener("click",e=>{e.preventDefault();submit();});
      document.getElementById("auth-pass")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submit();}});
      document.getElementById("switch-auth")?.addEventListener("click",()=>{state.authMode=state.authMode==="login"?"signup":"login";state.authError="";render();});
    }

    /* ══════════════════════════════════════════════
       BIND APP
    ══════════════════════════════════════════════ */
    function bindApp(){
      document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{state.activeTab=b.getAttribute("data-tab");render();}));
      document.getElementById("logout-btn")?.addEventListener("click",()=>signOut(auth));
      document.getElementById("save-bio-btn")?.addEventListener("click",saveBio);
      document.getElementById("edit-username-btn")?.addEventListener("click",()=>{state.isEditingName=true;render();});
      document.getElementById("cancel-username-btn")?.addEventListener("click",()=>{state.isEditingName=false;render();});
      document.getElementById("save-username-btn")?.addEventListener("click",saveUsername);
      document.getElementById("daily-btn")?.addEventListener("click",claimDaily);
      document.getElementById("main-avatar-btn")?.addEventListener("click",()=>{
        // Trigger file input for gallery access
        const fi=document.getElementById("global-avatar-upload");
        if(fi){ fi.click(); }
        else { state.showAvatarPicker=!state.showAvatarPicker; render(); }
      });
      // File input change handler
      const gau=document.getElementById("global-avatar-upload");
      if(gau){ gau.onchange=e=>{ if(e.target.files&&e.target.files[0]) handleProfilePicUpload(e.target.files[0]); e.target.value=""; }; }
      document.querySelectorAll("[data-avatar]").forEach(b=>b.addEventListener("click",()=>setAvatar(b.getAttribute("data-avatar"))));
      document.querySelectorAll("[data-unequip-slot]").forEach(b=>b.addEventListener("click",()=>{
        const s=b.getAttribute("data-unequip-slot");
        if(state.profile.equippedSlots?.[s]){
          showNeonModal({title:"🗑️ Unequip Card",body:`Slot <strong>${s}</strong> থেকে card সরাবেন?`,
            okText:"✓ হ্যাঁ",cancelText:"✗ না",onOk:()=>unequipSlot(s)});
        }
      }));

      document.getElementById("post-btn")?.addEventListener("click", createPost);

      /* ── New Social Feed Bindings ── */
      // Media upload
      document.getElementById("sf-media-upload")?.addEventListener("change", async e=>{
        const file = e.target.files?.[0]; if(!file) return;
        const isAdmin = (state.profile.username||"").trim()===ADMIN_NAME;
        if(file.type.startsWith("video/")){
          // Validate video duration (60s max for non-admin)
          if(!isAdmin){
            const url = URL.createObjectURL(file);
            const vid = document.createElement("video");
            vid.preload="metadata"; vid.src=url;
            await new Promise(res=>{ vid.onloadedmetadata=res; vid.onerror=res; });
            URL.revokeObjectURL(url);
            if(vid.duration > 60){ showToast("⚠️ Videos must be ≤ 60 seconds!"); e.target.value=""; return; }
          }
          state.feed.pendingMediaType="video";
        } else { state.feed.pendingMediaType="image"; }
        state.feed.pendingMediaFile = file;
        state.feed.pendingMediaPreview = URL.createObjectURL(file);
        render();
        e.target.value="";
      });
      document.getElementById("sf-remove-media")?.addEventListener("click",()=>{
        state.feed.pendingMediaFile=null; state.feed.pendingMediaPreview=""; state.feed.pendingMediaType=""; render();
      });
      // Link button
      document.getElementById("sf-link-btn")?.addEventListener("click",()=>{
        state.feed.showLinkInput=!state.feed.showLinkInput; render();
      });
      document.getElementById("sf-link-clear")?.addEventListener("click",()=>{
        state.feed.pendingLink=""; state.feed.showLinkInput=false; render();
      });
      document.getElementById("sf-link-input")?.addEventListener("input",e=>{
        state.feed.pendingLink=e.target.value;
      });
      // Post menu toggle
      document.querySelectorAll("[data-post-menu]").forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        const pid = b.getAttribute("data-post-menu");
        const menu= document.getElementById(`post-menu-${pid}`);
        document.querySelectorAll(".sf-post-menu").forEach(m=>{ if(m!==menu)m.classList.add("hidden"); });
        menu?.classList.toggle("hidden");
      }));
      // Edit post
      document.querySelectorAll("[data-edit-post]").forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        const pid = b.getAttribute("data-edit-post");
        const post= state.posts.find(p=>p.id===pid); if(!post)return;
        const newCap = prompt("Edit your post:", post.caption||post.text||"");
        if(newCap!==null && newCap.trim()) editPost(pid, newCap.trim());
        document.getElementById(`post-menu-${pid}`)?.classList.add("hidden");
      }));
      // Reaction popup toggle
      document.querySelectorAll("[data-like-open]").forEach(b=>{
        b.addEventListener("click",e=>{
          e.stopPropagation();
          const pid   = b.getAttribute("data-like-open");
          const popup = document.getElementById(`rxn-popup-${pid}`);
          document.querySelectorAll(".sf-rxn-popup").forEach(p=>{ if(p!==popup)p.classList.add("hidden"); });
          if(popup) popup.classList.toggle("hidden");
        });
      });
      // Reaction pick from popup
      document.querySelectorAll("[data-feed-rxn]").forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        const emoji  = b.getAttribute("data-feed-rxn");
        const postId = b.getAttribute("data-feed-rxn-post");
        document.querySelectorAll(".sf-rxn-popup").forEach(p=>p.classList.add("hidden"));
        // If clicking same reaction as current, treat as unlike
        const post = state.posts.find(p=>p.id===postId);
        const uid  = state.currentUser?.uid||"";
        const myRxn= Object.keys(post?.reactions||{}).find(e=>(post.reactions[e]||[]).includes(uid));
        if(myRxn===emoji){ likePost(postId); } // toggle off via like (simplified)
        else { reactToPost(postId,emoji); }
      }));
      // Close popups on outside click
      document.addEventListener("click",()=>{
        document.querySelectorAll(".sf-rxn-popup,.sf-post-menu").forEach(p=>p.classList.add("hidden"));
      });
      // Comment send
      document.querySelectorAll("[data-comment]").forEach(b=>b.addEventListener("click",()=>commentPost(b.getAttribute("data-comment"))));
      document.querySelectorAll("[data-comment-focus]").forEach(b=>b.addEventListener("click",()=>{
        const inp = document.getElementById(`sf-comment-input-${b.getAttribute("data-comment-focus")}`);
        inp?.focus(); inp?.scrollIntoView({behavior:"smooth",block:"nearest"});
      }));
      // Comment input enter key
      document.querySelectorAll(".sf-cmt-input").forEach(inp=>{
        inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); const pid=inp.id.replace("sf-comment-input-",""); commentPost(pid); } });
      });
      // Delete comment
      document.querySelectorAll("[data-del-comment]").forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        const [postId,commentId] = b.getAttribute("data-del-comment").split("|");
        deleteComment(postId,commentId);
      }));
      // Edit comment
      document.querySelectorAll("[data-edit-comment]").forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        const [postId,commentId] = b.getAttribute("data-edit-comment").split("|");
        state.feed.editingCommentId = commentId; render();
      }));
      document.getElementById("sf-cancel-edit-cmt")?.addEventListener("click",()=>{
        state.feed.editingCommentId=null; render();
      });
      document.querySelectorAll("[data-save-comment]").forEach(b=>b.addEventListener("click",()=>{
        const [postId,commentId] = b.getAttribute("data-save-comment").split("|");
        const inp = document.getElementById(`sf-edit-cmt-${commentId}`);
        if(inp?.value.trim()){ editComment(postId,commentId,inp.value); state.feed.editingCommentId=null; render(); }
      }));
      // Share
      document.querySelectorAll("[data-share]").forEach(b=>b.addEventListener("click",()=>sharePost(b.getAttribute("data-share"))));
      // Delete post
      document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deletePost(b.getAttribute("data-delete"))));

      document.getElementById("open-news-hub")?.addEventListener("click",openNewsModal);
      document.getElementById("close-news-modal")?.addEventListener("click",closeNewsModal);
      document.querySelectorAll("[data-read-news]").forEach(b=>b.addEventListener("click",()=>startNewsReadTimer(b.getAttribute("data-read-news"))));

      document.getElementById("open-import")?.addEventListener("click",()=>{state.showImportModal=true;render();});
      document.getElementById("close-import")?.addEventListener("click",()=>{state.showImportModal=false;render();});
      document.getElementById("import-input")?.addEventListener("input",e=>{state.animeSearch=e.target.value;});
      document.getElementById("import-add")?.addEventListener("click",importAnime);
      document.querySelectorAll("[data-plus]").forEach(b=>b.addEventListener("click",()=>incEpisode(b.getAttribute("data-plus"))));
      document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>removeAnime(b.getAttribute("data-remove"))));

      document.getElementById("sensei-ask-btn")?.addEventListener("click",askSensei);
      document.getElementById("sensei-input")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();askSensei();}});

      const csi=document.getElementById("chat-search-input"); if(csi)csi.oninput=()=>{state.chatSearchTerm=csi.value;updateChatSearchResults();};
      bindDynamicChat(); updateRecentList();
      document.getElementById("chat-back-btn")?.addEventListener("click",closeChatWindow);
      document.getElementById("chat-send-btn")?.addEventListener("click",sendChatMessage);
      const cmi=document.getElementById("chat-message-input"); if(cmi)cmi.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendChatMessage();}});
      const cb=document.getElementById("chat-body-scroll"); if(cb)cb.scrollTop=cb.scrollHeight;

      document.getElementById("join-global-chat")?.addEventListener("click",openGlobalChat);
      document.getElementById("global-chat-back-btn")?.addEventListener("click",closeGlobalChat);
      document.getElementById("global-chat-send-btn")?.addEventListener("click",sendGlobalMessage);
      const gci=document.getElementById("global-chat-input"); if(gci)gci.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendGlobalMessage();}});
      const gcb=document.getElementById("global-chat-body-scroll"); if(gcb)gcb.scrollTop=gcb.scrollHeight;

      /* ── Message Reactions: bubble click → show picker ── */
      document.querySelectorAll("[data-open-rxn]").forEach(bubble=>{
        bubble.addEventListener("click",e=>{
          e.stopPropagation();
          handleReactionPickerToggle(bubble.getAttribute("data-open-rxn"));
        });
      });
      /* ── Reaction picker: item click → toggle reaction ── */
      document.querySelectorAll(".rxn-pick-item").forEach(btn=>{
        btn.addEventListener("click",e=>{
          e.stopPropagation();
          const msgId = btn.getAttribute("data-msg");
          const emoji = btn.getAttribute("data-rxn");
          // hide picker immediately for snappy feel
          const picker = document.getElementById(`rxnpick-${msgId}`);
          if(picker) picker.classList.remove("visible");
          toggleReaction(msgId, emoji);
        });
      });
      /* ── Reaction chip click (toggle existing reaction) ── */
      document.querySelectorAll(".rxn-chip").forEach(chip=>{
        chip.addEventListener("click",e=>{
          e.stopPropagation();
          toggleReaction(chip.getAttribute("data-msg"), chip.getAttribute("data-rxn"));
        });
      });
      /* ── Close any open reaction picker when clicking elsewhere ── */
      document.addEventListener("click",()=>{
        document.querySelectorAll(".rxn-picker.visible").forEach(el=>el.classList.remove("visible"));
      },{once:false,capture:false});
      /* ── Play pop sound on new incoming messages ── */
      if(state.globalChatOpen && state.globalMessages.length){
        const last=state.globalMessages[state.globalMessages.length-1];
        if(last && last.senderId !== state.currentUser?.uid){
          const key=`popped_${last.createdAtMs}`;
          if(!sessionStorage.getItem(key)){ sessionStorage.setItem(key,"1"); playPopSound(); }
        }
      }

      document.getElementById("spin-wheel-btn")?.addEventListener("click",spinArenaWheel);
      /* ── Music panel toggle ── */
      document.getElementById("music-panel-btn")?.addEventListener("click",()=>{
        musicState.open=!musicState.open;
        const w=document.getElementById("music-panel-wrap");
        if(w){ w.className=musicState.open?"music-panel-open":"music-panel-closed"; if(musicState.open)renderMusicPanel(); else w.innerHTML=""; }
      });
      /* ── Global SFX on buttons ── */
      if(musicState.sfxEnabled){
        document.querySelectorAll("button:not(.music-toggle-btn):not(.music-mode-btn):not(.music-track-btn)").forEach(b=>{
          if(!b._sfxBound){ b._sfxBound=true; b.addEventListener("click",sfxClick,{passive:true}); }
        });
      }

      /* ── Battle Arena bindings ── */
      document.getElementById("battle-open-select")?.addEventListener("click",()=>{
        const inv=state.profile.inventoryCards||[];
        if(inv.length<BATTLE_MIN_CARDS){showToast("ব্যাটেল শুরু করতে কমপক্ষে ৩টি কার্ড প্রয়োজন!");return;}
        state.battle.active=true; state.battle.phase="select"; state.battle.selectedCards=[]; render();
      });
      document.getElementById("battle-open-rules")?.addEventListener("click",()=>{state.battle.rulesOpen=true;render();});
      document.getElementById("battle-close-rules")?.addEventListener("click",()=>{state.battle.rulesOpen=false;render();});
      document.getElementById("battle-enter-btn")?.addEventListener("click",()=>{
        if(state.battle.selectedCards.length<BATTLE_MIN_CARDS)return;
        state.battle.confirmOpen=true; render();
      });
      document.getElementById("battle-cancel-enter")?.addEventListener("click",()=>{state.battle.confirmOpen=false;render();});
      document.getElementById("battle-confirm-enter")?.addEventListener("click",startBattle);
      document.getElementById("battle-claim-reward")?.addEventListener("click",claimBattleReward);
      document.getElementById("battle-exit-btn")?.addEventListener("click",()=>{
        state.battle.active=false; state.battle.phase="select"; state.battle.selectedCards=[];
        state.battle.confirmOpen=false; state.battle.rulesOpen=false; render();
      });
      document.querySelectorAll("[data-battle-select]").forEach(b=>b.addEventListener("click",()=>toggleBattleCard(b.getAttribute("data-battle-select"))));
      document.querySelectorAll("[data-battle-attack]").forEach(b=>b.addEventListener("click",()=>playerAttack(b.getAttribute("data-battle-attack"))));
      /* ── DM Chat delete own msg ── */
      document.querySelectorAll("[data-dm-delete]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();deleteDmMessage(b.getAttribute("data-dm-delete"));}));
      /* ── Global Chat delete own msg ── */
      document.querySelectorAll("[data-gc-delete]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();deleteGlobalMessage(b.getAttribute("data-gc-delete"));}));
      /* ── Weekly leaderboard rewards ── */
      document.querySelectorAll("[data-weekly-rank]").forEach(b=>b.addEventListener("click",()=>claimWeeklyReward(Number(b.getAttribute("data-weekly-rank")))));
      document.getElementById("buy-box-btn")?.addEventListener("click",buyMysteryBox);
      /* Shop sticky tab switching */
      document.querySelectorAll("[data-shop-tab]").forEach(b=>b.addEventListener("click",()=>{
        const t=b.getAttribute("data-shop-tab");
        state.shop.activeTab=t;
        // Auto-open accordion for missions/themes
        if(t==="missions") state.shop.missionsOpen=true;
        if(t==="themes")   state.shop.themeStoreOpen=true;
        render();
        // Scroll to section after render
        setTimeout(()=>{
          const el=document.getElementById(`shop-sec-${t}`);
          if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
        },80);
      }));
      /* Card preview modal */
      document.getElementById("open-card-preview")?.addEventListener("click",()=>{state.shop.previewOpen=true;render();});
      document.getElementById("close-card-preview")?.addEventListener("click",()=>{state.shop.previewOpen=false;render();});
      document.getElementById("toggle-missions-accordion")?.addEventListener("click",()=>{state.shop.missionsOpen=!state.shop.missionsOpen;render();});
      document.getElementById("toggle-theme-store")?.addEventListener("click",()=>{state.shop.themeStoreOpen=!state.shop.themeStoreOpen;render();});

      /* Theme buy / equip */
      document.querySelectorAll("[data-buy-theme]").forEach(b=>b.addEventListener("click",()=>buyTheme(b.getAttribute("data-buy-theme"))));
      document.querySelectorAll("[data-equip-theme]").forEach(b=>b.addEventListener("click",()=>equipTheme(b.getAttribute("data-equip-theme"))));
      document.querySelectorAll("[data-unequip-theme]").forEach(b=>b.addEventListener("click",()=>equipTheme(b.getAttribute("data-unequip-theme")))); // toggles off

      document.querySelectorAll("[data-open-equip]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();openEquipModal(b.getAttribute("data-open-equip"));}));
      document.querySelectorAll("[data-recycle]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();recycleCard(b.getAttribute("data-recycle"));}));
      /* Card preview — click on card cell in inventory */
      document.querySelectorAll("[data-preview-card]").forEach(cell=>{
        cell.addEventListener("click",()=>{
          const iid=cell.getAttribute("data-preview-card");
          const card=(state.profile.inventoryCards||[]).find(c=>c.instanceId===iid);
          if(card){state.cardPreview={open:true,card};render();}
        });
      });
      document.getElementById("close-card-detail")?.addEventListener("click",()=>{state.cardPreview={open:false,card:null};render();});
      document.getElementById("card-detail-overlay")?.addEventListener("click",e=>{
        if(e.target===e.currentTarget){state.cardPreview={open:false,card:null};render();}
      });
      /* Clear unread when switching to chat tab */
      if(state.activeTab==="chat"&&state.currentUser&&!state.activeChatUserId&&!state.globalChatOpen){
        // Already cleared on open; just ensure badge gone
        state.totalUnread = state.chatInbox.reduce((s,i)=>s+(state.activeChatUserId===i.otherId?0:i.unread),0);
      }
      document.getElementById("close-equip-modal")?.addEventListener("click",closeEquipModal);
      document.querySelectorAll("[data-equip-slot]").forEach(b=>b.addEventListener("click",()=>equipCardToSlot(b.getAttribute("data-equip-slot"))));

      document.querySelectorAll("[data-open-public-profile]").forEach(b=>b.addEventListener("click",()=>{const u=getUserById(b.getAttribute("data-open-public-profile"));if(u){state.inspectUser=u;render();}}));
      document.getElementById("close-inspect-btn")?.addEventListener("click",()=>{state.inspectUser=null;render();});
      document.querySelectorAll("[data-claim-mission]").forEach(b=>b.addEventListener("click",()=>claimMissionReward(b.getAttribute("data-claim-mission"))));

      document.getElementById("open-quiz-rules")?.addEventListener("click",openQuizRules);
      document.getElementById("quiz-cancel-btn")?.addEventListener("click",closeQuizRules);
      document.getElementById("quiz-start-btn")?.addEventListener("click",startQuizFromRules);
      const qai=document.getElementById("quiz-anime-input"); if(qai){qai.addEventListener("input",()=>{state.quiz.animeInputTmp=qai.value;});qai.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const n=(qai.value||"").trim();if(n)fetchQuizQuestions(n);}});}
      document.getElementById("quiz-anime-go-btn")?.addEventListener("click",()=>{const n=(state.quiz.animeInputTmp||"").trim();if(n)fetchQuizQuestions(n);});
      const qans=document.getElementById("quiz-answer-input"); if(qans){qans.addEventListener("input",()=>{state.quiz.answerTmp=qans.value;});qans.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submitQuizAnswer();}});qans.focus();}
      document.getElementById("quiz-submit-btn")?.addEventListener("click",submitQuizAnswer);
      document.getElementById("quiz-skip-btn")?.addEventListener("click",skipQuizQuestion);
      document.getElementById("quiz-next-btn")?.addEventListener("click",nextQuizQuestion);
      document.getElementById("quiz-close-btn")?.addEventListener("click",closeQuiz);

      if(state.activeTab==="arena")requestAnimationFrame(()=>initWheel());

      /* ── Story Mode bindings ── */
      if(state.activeTab==="adventure"||state.story.active){
        document.getElementById("sl-exit")?.addEventListener("click", exitStoryMode);
        document.getElementById("sl-exit-after")?.addEventListener("click",()=>{ exitStoryMode(); });
        document.getElementById("sl-rules-btn")?.addEventListener("click", showStoryRulesModal);
        document.getElementById("sl-refresh-btn")?.addEventListener("click",()=>{ render(); showToast("🔄 Refreshed!"); });

        // Chapter tab selection
        document.querySelectorAll("[data-select-chapter]").forEach(b=>b.addEventListener("click",()=>{
          state.story.activeMapChapter = Number(b.getAttribute("data-select-chapter"));
          render();
        }));

        // Fight buttons — support data-chapter-id
        document.querySelectorAll("[data-fight-enemy]").forEach(b=>b.addEventListener("click",()=>{
          const idx = Number(b.getAttribute("data-fight-enemy"));
          const chId = Number(b.getAttribute("data-chapter-id")||1);
          startStoryFight(chId, idx);
        }));

        // 3-skill attack buttons
        document.querySelectorAll("[data-action]").forEach(b=>{
          b.addEventListener("click",()=>{ storyPlayerAttack(b.getAttribute("data-action")); });
        });
        document.getElementById("sl-attack-btn")?.addEventListener("click",()=>storyPlayerAttack("strike"));
        document.getElementById("sl-claim-reward")?.addEventListener("click", claimStoryReward);
        document.getElementById("sl-dialogue-box")?.addEventListener("click", advanceStoryDialogue);
        // ARISE bindings
        document.getElementById("sl-arise-btn")?.addEventListener("click", openAriseModal);
        document.getElementById("arise-close-btn")?.addEventListener("click", closeAriseModal);
        document.getElementById("arise-confirm-btn")?.addEventListener("click", confirmArise);
        document.querySelectorAll("[data-toggle-shadow]").forEach(b=>b.addEventListener("click",()=>toggleAriseShadow(b.getAttribute("data-toggle-shadow"))));
      }
      /* ── Nav tab bindings (main 5 + More drawer items) ── */
      document.querySelectorAll("[data-tab]").forEach(b=>{
        b.addEventListener("click",()=>{
          const id = b.getAttribute("data-tab");
          state.navMoreOpen = false;
          if(id==="adventure"){
            state.activeTab="adventure";
            state.story.active=false;
            render();
            const lv=state.profile.level, inv=state.profile.inventoryCards||[], ch=STORY_CHAPTERS[0];
            if(lv<ch.requirement.level||inv.length<ch.requirement.cards){ openStoryMode(); }
            else { state.story.active=true; state.story.phase="map"; if(!state.profile.storyRulesShown&&!state.story.rulesShownOnce) setTimeout(showStoryRulesModal,200); }
            render();
          } else {
            state.activeTab=id; render();
          }
        });
      });
      /* More button toggle */
      document.getElementById("nav-more-btn")?.addEventListener("click",()=>{
        state.navMoreOpen=!state.navMoreOpen; render();
      });
      document.getElementById("nav-more-overlay")?.addEventListener("click",(e)=>{
        if(e.target.id==="nav-more-overlay"){ state.navMoreOpen=false; render(); }
      });

      /* ── Avatar file upload from gallery ── */
      document.getElementById("avatar-file-input")?.addEventListener("change", async(e)=>{
        const file = e.target.files?.[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = async(ev)=>{
          const dataUrl = ev.target.result;
          // Save to localStorage for persistence
          try{ localStorage.setItem("custom_avatar", dataUrl); }catch{}
          state.profile.avatar = dataUrl;
          render();
          // Persist to Firestore
          if(state.currentUser){
            try{ await updateDoc(getMetaRef(state.currentUser.uid),{avatar:dataUrl, updated_at:serverTimestamp()}); }
            catch(err){ console.error("Avatar save failed:", err); }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    /* ══════════════════════════════════════════════
       BOOT
    ══════════════════════════════════════════════ */
    async function boot(){
      try{await setPersistence(auth,browserLocalPersistence);}catch{}
      onAuthStateChanged(auth,async user=>{
        clearLive(); stopPresence();
        state.currentUser=user; state.authReady=true; state.authBusy=false;
        state.showAvatarPicker=false; state.isEditingName=false;
        state.activeChatUserId=null; state.chatMessages=[]; state.chatSearchTerm="";
        state.chatInbox=[]; state.totalUnread=0; state.cardPreview={open:false,card:null};
        if(state.inboxUnsub){state.inboxUnsub();state.inboxUnsub=null;}
        state.inspectUser=null; state.equip={open:false,cardId:""};
        state.shop={opening:false,lastPull:null,missionsOpen:false,themeStoreOpen:true,activeTab:'box',previewOpen:false,shaking:false,revealing:false};
        state.arena={spinning:false,wheelRotation:0,lastResult:"Spin to test your luck.",resultTone:"neutral"};
        state.navMoreOpen=false;
        state.battle={active:false,phase:"select",rulesOpen:false,confirmOpen:false,selectedCards:[],playerHP:0,playerDEF:0,aiHP:0,aiDEF:0,playerDEFmax:0,aiDEFmax:0,playerHPmax:0,aiHPmax:0,turn:"player",turnNum:0,log:[],playerDeck:[],aiDeck:[],playerUsed:[],aiUsed:[],currentAiCard:null,animMsg:"",animType:"",shieldBroken:false,aiShieldBroken:false,winner:null,rewardClaimed:false};
        state.story={active:false,phase:"map",chapter:null,activeMapChapter:1,rulesShownOnce:false,dialogue:[],dialogueIdx:0,playerHP:0,playerHPmax:0,playerDEF:0,playerDEFmax:0,playerATK:0,enemyHP:0,enemyHPmax:0,enemyDEF:0,enemyDEFmax:0,enemyATK:0,playerName:"Jin-Woo",enemyName:"",animMsg:"",animTarget:"",playerShake:false,enemyShake:false,lastAction:"",rewardClaimed:false,permanentBonus:{atk:0,hp:0,def:0},coinTossResult:"",firstAttacker:"",heavyStrikeCooldown:0,guardActive:false,enrageTriggered:false,currentEnemyATK:0,_pendingVictory:false,_pendingDefeat:false,midDialogueDone:false,enemyIdx:0};
        state.battle={active:false,phase:"select",rulesOpen:false,confirmOpen:false,selectedCards:[],playerHP:0,playerDEF:0,playerCards:[],aiHP:0,aiDEF:0,aiCards:[],playerDEFmax:0,aiDEFmax:0,playerHPmax:0,aiHPmax:0,turn:"player",turnNum:0,log:[],playerDeck:[],aiDeck:[],playerUsed:[],aiUsed:[],currentAiCard:null,animMsg:"",animType:"",shieldBroken:false,aiShieldBroken:false,winner:null,rewardClaimed:false};
        state.globalChatOpen=false; state.globalMessages=[];
        state.news={modalOpen:false,loading:false,articles:[],readTimers:{},claimedIds:{},dailyCount:0,lastDate:""};
        state.quiz={rulesOpen:false,open:false,animeName:"",animeInputTmp:"",questions:[],currentIndex:0,answers:[],loading:false,answerTmp:"",feedbackVisible:false,currentFeedback:null,resultVisible:false,totalXpEarned:0,gemsEarned:0};
        state.missions={date:todayKey(),progress:emptyProgress(),claimed:emptyClaimed()};
        wheelRot=0;
        if(user){await setupLive(user);startPresence();
          // Restore custom avatar from localStorage if set
          try{ const ca=localStorage.getItem("custom_avatar"); if(ca && ca.startsWith("data:")) state.profile.avatar=ca; }catch{}
        }
        else{
          state.profile={uid:"",username:"",avatar:AVATARS[0],Bio:"",xp:0,level:1,gems:0,gold:0,tracker:[],recentChats:[],freeSpins:0,inventoryCards:[],equippedSlots:{},inventory:{themes:[]},equippedTheme:"",last_claim_date:Timestamp.fromMillis(0),daily_read_count:0,last_read_date:""};
          state.posts=[];state.allUsers=[];state.leaderboard=[];
        }
        render();
      });
    }

    boot();
