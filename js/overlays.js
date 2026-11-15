/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   v0.2.4 - Custom goal counts and install video
   ========================================================================== */

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
  '<rect width="120" height="120" fill="#171a21"/>' +
  '<circle cx="60" cy="44" r="22" fill="#f4acc4"/>' +
  '<path d="M22 108 C22 78, 98 78, 98 108 Z" fill="#53d8bf"/>' +
  '</svg>'
);

const i18nDict = {
  en: {
    tenure: "Tenure", joined: "Joined", loyalty: "Loyalty", months: "Months",
    shoutout: "SHOUTOUT", qa: "Q&A HIGHLIGHT",
    tier: "Tier", gifted: "Gifted", memberships: "Memberships", from: "From",
    anonymous: "Anonymous", amount: "Amount", sent: "Sent", jewels: "Jewels", gift: "Gift",
    newSub: "New Subscriber",
    defaultQaMsg: "Welcome to Leonida! Drop your questions in chat!",
    dragWalkon: "Walk-On Card", dragAlert: "Alert Box", dragShoutout: "Shoutout Toast",
    dragChat: "Horizontal Chat Bar", dragQA: "Q&A Highlight Toast",
    dragFirst5: "First 5", dragGoals: "Goal Bars"
  },
  'pt-br': {
    tenure: "Tempo", joined: "Membro", loyalty: "Lealdade", months: "Meses",
    shoutout: "DESTAQUE", qa: "PERGUNTAS",
    tier: "Nível", gifted: "Presenteou", memberships: "Membros", from: "De",
    anonymous: "Anônimo", amount: "Valor", sent: "Enviou", jewels: "Joias", gift: "Presente",
    newSub: "Novo Inscrito",
    defaultQaMsg: "Bem-vindo a Leonida! Mande suas perguntas no chat!",
    dragWalkon: "Card de Entrada", dragAlert: "Caixa de Alerta", dragShoutout: "Destaque (Shoutout)",
    dragChat: "Barra de Chat Horizontal", dragQA: "Destaque de P&R",
    dragFirst5: "First 5", dragGoals: "Barras de Metas"
  },
  es: {
    tenure: "Antigüedad", joined: "Unió", loyalty: "Lealtad", months: "Meses",
    shoutout: "DESTACADO", qa: "PREGUNTAS",
    tier: "Nivel", gifted: "Regaló", memberships: "Membresías", from: "De",
    anonymous: "Anónimo", amount: "Monto", sent: "Envió", jewels: "Joyas", gift: "Regalo",
    newSub: "Nuevo Suscriptor",
    defaultQaMsg: "¡Bienvenido a Leonida! ¡Deja tus preguntas en el chat!",
    dragWalkon: "Tarjeta de Entrada", dragAlert: "Caja de Alertas", dragShoutout: "Destacado (Shoutout)",
    dragChat: "Barra de Chat Horizontal", dragQA: "Destacado de P&R",
    dragFirst5: "First 5", dragGoals: "Barras de Metas"
  },
  fr: {
    tenure: "Ancienneté", joined: "Rejoint", loyalty: "Fidélité", months: "Mois",
    shoutout: "DÉDICACE", qa: "Q&R",
    tier: "Niveau", gifted: "Offert", memberships: "Adhésions", from: "De",
    anonymous: "Anonyme", amount: "Montant", sent: "Envoyé", jewels: "Joyaux", gift: "Cadeau",
    newSub: "Nouvel Abonné",
    defaultQaMsg: "Bienvenue à Leonida ! Posez vos questions dans le chat !",
    dragWalkon: "Carte d'Entrée", dragAlert: "Boîte d'Alerte", dragShoutout: "Toast Dédicace",
    dragChat: "Barre de Chat Horizontale", dragQA: "Toast Q&R",
    dragFirst5: "First 5", dragGoals: "Barres d'Objectifs"
  },
  de: {
    tenure: "Dauer", joined: "Dabei", loyalty: "Treue", months: "Monate",
    shoutout: "SHOUTOUT", qa: "F&A",
    tier: "Stufe", gifted: "Verschenkt", memberships: "Mitgliedschaften", from: "Von",
    anonymous: "Anonym", amount: "Betrag", sent: "Gesendet", jewels: "Juwelen", gift: "Geschenk",
    newSub: "Neuer Abonnent",
    defaultQaMsg: "Willkommen in Leonida! Stellt eure Fragen im Chat!",
    dragWalkon: "Walk-On-Karte", dragAlert: "Alert-Box", dragShoutout: "Shoutout-Toast",
    dragChat: "Horizontale Chatleiste", dragQA: "F&A-Highlight-Toast",
    dragFirst5: "First 5", dragGoals: "Zielbalken"
  }
};

function parseGoalsCustom(raw) {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch (e) { return []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    on: !(item && (item.on === 0 || item.on === '0' || item.on === false)),
    title: String((item && item.title) || 'Custom'),
    count: String((item && (item.count || item.countVar)) || '').trim(),
    goal: String((item && (item.goal || item.goalVar)) || '').trim()
  }));
}

function readAlertSeconds(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

const GTAOverlayConfig = (() => {
  const params = new URLSearchParams(window.location.search);

  const lang = params.get('lang') || 'en';
  const t = i18nDict[lang] || i18nDict['en'];

  const DEFAULT_STAT_ROWS = [
    { label: t.tenure,  varName: 'months',       suffix: ' ' + t.months, icon: 'fa-heart',          iconColor: 'pink',   valColor: 'yellow', fallback: '12' },
    { label: t.joined,  varName: 'memberSince',  suffix: '',             icon: 'fa-calendar-check', iconColor: 'teal',   valColor: 'pink',   fallback: '05/2025' },
    { label: t.loyalty, varName: 'loyaltyLevel', suffix: '',             icon: 'fa-eye',            iconColor: 'purple', valColor: 'teal',   fallback: 'Level 5' }
  ];

  let parsedStats = DEFAULT_STAT_ROWS;
  if (params.has('stats')) {
    try { parsedStats = JSON.parse(params.get('stats')); } 
    catch (e) { console.warn('[GTA-Overlay] Invalid stats JSON in URL, using defaults.'); }
  }

  const modulesParam   = params.get('modules') || 'all';
  const enableWalkon   = modulesParam === 'all' || modulesParam.includes('walkon');
  const enableAlerts   = modulesParam === 'all' || modulesParam.includes('alerts');
  const enableShoutout = modulesParam === 'all' || modulesParam.includes('shoutout');
  const enableChat     = modulesParam === 'all' || modulesParam.includes('chat');
  const enableQA       = modulesParam === 'all' || modulesParam.includes('qa');
  const enableFirst5   = modulesParam === 'all' || modulesParam.includes('first5');
  const enableGoals    = modulesParam === 'all' || modulesParam.includes('goals');

  const layout = params.get('layout') || 'horizontal';
  const isVert = layout === 'vertical';

  const getPos = (key, vKey, def) => parseFloat(params.get(isVert ? vKey : key) || def);
  const getBool = (key, vKey, defStr) => (params.get(isVert ? vKey : key) || defStr) === '1';

  return {
    previewMode: params.get('preview') === '1',
    modules: {
      walkon:   enableWalkon,
      alerts:   enableAlerts,
      shoutout: enableShoutout,
      chat:     enableChat,
      qa:       enableQA,
      first5:   enableFirst5,
      goals:    enableGoals
    },
    
    layout: layout,
    res: parseInt(params.get('res') || '1080', 10),
    lang: lang,
    t: t,

    host: params.get('host') || '127.0.0.1',
    port: parseInt(params.get('port') || '8080', 10),
    endpoint: params.get('endpoint') || '/',
    password: params.get('password') || '',
    
    // Module 1: Walk-on Card Config
    walkonEvent: params.get('event') || 'MemberWalkOn',
    posX: getPos('x', 'v_x', '60'),
    posY: getPos('y', 'v_y', '60'),
    scale: getPos('scale', 'v_scale', '1'),
    alignH: getBool('alignH', 'v_alignH', '0'),
    alignV: getBool('alignV', 'v_alignV', '0'),
    duration: parseInt(params.get('duration') || '8', 10) * 1000,
    cardAnim: params.get('cardAnim') || 'anim-slide-left',
    avatarAnim: params.get('avatarAnim') || 'av-flip',
    showAvatar: params.get('showAvatar') !== '0',
    showUser: params.get('showUser') !== '0',
    showTier: params.get('showTier') !== '0',
    noBg: params.get('noBg') === '1',

    // Module 2: Alerts Config
    alertEvent: params.get('alertEvent') || 'GTA_Alert',
    alertX: getPos('ax', 'v_ax', '960'),
    alertY: getPos('ay', 'v_ay', '100'),
    alertScale: getPos('ascale', 'v_ascale', '1'),
    alertAlignH: (params.get(isVert ? 'v_aAlignH' : 'aAlignH') || '1') !== '0',
    alertAlignV: getBool('aAlignV', 'v_aAlignV', '0'),
    alertDuration: parseInt(params.get('aDur') || '6', 10) * 1000,
    alertDurations: {
      sub:          readAlertSeconds(params.get('ad_sub')),
      member:       readAlertSeconds(params.get('ad_mem')),
      milestone:    readAlertSeconds(params.get('ad_ms')),
      gift:         readAlertSeconds(params.get('ad_gft')),
      giftRec:      readAlertSeconds(params.get('ad_grc')),
      superchat:    readAlertSeconds(params.get('ad_sc')),
      supersticker: readAlertSeconds(params.get('ad_stk')),
      jewels:       readAlertSeconds(params.get('ad_jwl'))
    },
    alertsConfig: {
      sub:          params.get('al_sub') !== '0',
      member:       params.get('al_mem') !== '0',
      milestone:    params.get('al_ms')  !== '0',
      gift:         params.get('al_gft') !== '0',
      giftRec:      params.get('al_grc') !== '0',
      superchat:    params.get('al_sc')  !== '0',
      supersticker: params.get('al_stk') !== '0',
      jewels:       params.get('al_jwl') !== '0'
    },
    alertColors: {
      sub:          params.get('ac_sub') || 'teal',
      member:       params.get('ac_mem') || 'purple',
      milestone:    params.get('ac_ms')  || 'purple',
      gift:         params.get('ac_gft') || 'pink',
      giftRec:      params.get('ac_grc') || 'teal',
      superchat:    params.get('ac_sc')  || 'yellow',
      supersticker: params.get('ac_stk') || 'yellow',
      jewels:       params.get('ac_jwl') || 'yellow'
    },

    // Module 3: Shoutout Toast Config
    soGlobalVar: params.get('soVar') || 'viShoutOuts',
    soEvent: params.get('soEvent') || 'GTA_Shoutout',
    soTitle: params.get('soTitle') || t.shoutout,
    soX: getPos('soX', 'v_soX', '1380'),
    soY: getPos('soY', 'v_soY', '80'),
    soScale: getPos('soScale', 'v_soScale', '1'),
    soAlignH: getBool('soAlignH', 'v_soAlignH', '0'),
    soAlignV: getBool('soAlignV', 'v_soAlignV', '0'),
    soDuration: parseInt(params.get('soDur') || '5', 10) * 1000,
    soAnim: params.get('soAnim') || 'so-roll',
    soLayout: params.get('soLayout') || 'right',
    soColor: params.get('soColor') || 'pink',
    soNoBg: params.get('soNoBg') === '1',

    // Module 4: Horizontal Chat Bar Config
    chatEvent:        params.get('chatEvent') || 'GTA_Chat',
    chatX:            getPos('chatX', 'v_chatX', '0'),
    chatY:            getPos('chatY', 'v_chatY', '0'),
    chatW:            getPos('chatW', 'v_chatW', isVert ? '1080' : '1920'),
    chatScale:        getPos('chatScale', 'v_chatScale', '1'),
    chatAlignH:       getBool('chatAlignH', 'v_chatAlignH', '0'),
    chatAlignV:       getBool('chatAlignV', 'v_chatAlignV', '0'),
    chatFontSize:     parseInt(params.get('chatFS') || '20', 10),
    chatMaxMsgs:      parseInt(params.get('chatMax') || '15', 10),
    chatHideAfter:    parseInt(params.get('chatHide') || '0', 10),
    chatColorMember:  params.get('cMem') || '#53d8bf',
    chatColorMod:     params.get('cMod') || '#a688ff',
    chatColorViewer:  params.get('cView') || '#fede9a',
    chatColorMsg:     params.get('cMsg') || '#f0f4f8',
    chatBgColor:      params.get('cChatBg') || (params.get('cBg') || '#303030'),
    chatBgOpacity:    parseInt(params.get('chatBgOp') || '88', 10),
    chatNoBg:         params.get('chatNoBg') === '1',
    chatAccent:       params.get('chatAccent') || 'teal',
    chatShowAvatars:  params.get('chatAv') !== '0',
    chatShowBadges:   params.get('chatBadges') !== '0',
    chatUppercase:    params.get('chatUpper') === '1',
    chatIgnoreCmds:   params.get('chatNoCmd') !== '0',
    chatCmdPrefixes:  params.get('chatPrefixes') || '!, #, /, $',
    chatIgnoreUsers:  params.get('chatIgUsers') || '',

    // Module 5: Q&A Highlight Toast Config
    qaGlobalVar: params.get('qaVar') || 'viChatHighlight',
    qaEvent:     params.get('qaEvent') || 'GTA_QA',
    qaTitle:     params.get('qaTitle') || t.qa,
    qaX:         getPos('qaX', 'v_qaX', '960'),
    qaY:         getPos('qaY', 'v_qaY', '60'),
    qaScale:     getPos('qaScale', 'v_qaScale', '1'),
    qaAlignH:    (params.get(isVert ? 'v_qaAlignH' : 'qaAlignH') || '1') !== '0',
    qaAlignV:    getBool('qaAlignV', 'v_qaAlignV', '0'),
    qaDuration:  parseInt(params.get('qaDur') || '15', 10) * 1000,
    qaAnim:      params.get('qaAnim') || 'qa-slide-up',
    qaColor:     params.get('qaColor') || 'teal',
    qaShowBadge: params.get('qaShowBadge') !== '0',
    qaNoBg:      params.get('qaNoBg') === '1',
    f5Event:  params.get('f5Event') || 'GTA_First5',
    goalsX: getPos('goalsX', 'v_goalsX', isVert ? '60' : '1466'),
    goalsY: getPos('goalsY', 'v_goalsY', isVert ? '60' : '243'),
    goalsScale: getPos('goalsScale', 'v_goalsScale', '1'),
    goalsAlignH: getBool('goalsAlignH', 'v_goalsAlignH', '0'),
    goalsAlignV: getBool('goalsAlignV', 'v_goalsAlignV', '0'),
    goalsMode: params.get('goalsMode') || 'ticker',
    goalsShowDur: parseInt(params.get('goalsShowDur') || '10', 10) * 1000,
    goalsGapDur: parseInt(params.get('goalsGapDur') || '1', 10) * 1000,
    goalsRepeatDelay: parseInt(params.get('goalsRepeatDelay') || '30', 10) * 1000,
    goalsAnimIn: params.get('goalsAnimIn') || 'zoom',
    goalsAnimOut: params.get('goalsAnimOut') || 'slide-down',
    goalsColor: params.get('goalsColor') || 'teal',
    goalsLikes: params.get('goalsLikes') !== '0',
    goalsMembers: params.get('goalsMembers') !== '0',
    goalsJewels: params.get('goalsJewels') !== '0',
    goalsSubs: params.get('goalsSubs') !== '0',
    goalsGifts: params.get('goalsGifts') !== '0',
    goalsSupers: params.get('goalsSupers') !== '0',
    goalsBg: params.has('goals-bg') ? (params.get('goals-bg') ?? '') : (params.get('goalsBg') || 'assets/backgrounds/Palms.webp'),
    goalsLikesTitle: params.get('goalsLikesTitle') || 'Likes',
    goalsLikesCount: params.get('goalsLikesCount') || 'likesCount',
    goalsLikesGoal: params.get('goalsLikesGoal') || 'LikesGoal',
    goalsMembersTitle: params.get('goalsMembersTitle') || 'Memberships',
    goalsMembersCount: params.get('goalsMembersCount') || 'memberCount',
    goalsMembersGoal: params.get('goalsMembersGoal') || 'memberGoal',
    goalsJewelsTitle: params.get('goalsJewelsTitle') || 'Jewels',
    goalsJewelsCount: params.get('goalsJewelsCount') || 'jewelsCount',
    goalsJewelsGoal: params.get('goalsJewelsGoal') || 'JewelsGoal',
    goalsSubsTitle: params.get('goalsSubsTitle') || 'Subscribers',
    goalsSubsCount: params.get('goalsSubsCount') || 'liveSubCount',
    goalsSubsGoal: params.get('goalsSubsGoal') || 'liveSubGoal',
    goalsGiftsTitle: params.get('goalsGiftsTitle') || 'Membership Gifts',
    goalsGiftsCount: params.get('goalsGiftsCount') || 'membershipGiftsCount',
    goalsGiftsGoal: params.get('goalsGiftsGoal') || 'membershipGiftsGoal',
    goalsSupersTitle: params.get('goalsSupersTitle') || 'Super Chats/Stickers',
    goalsSupersCount: params.get('goalsSupersCount') || 'superCount',
    goalsSupersGoal: params.get('goalsSupersGoal') || 'superGoal',
    goalsCustom: parseGoalsCustom(params.get('goalsCustom')),
    f5X:      getPos('f5X', 'v_f5X', '0'),
    f5Y:      getPos('f5Y', 'v_f5Y', '0'),
    f5AlignH: (params.get(isVert ? 'v_f5AlignH' : 'f5AlignH') ?? (isVert ? '0' : '1')) === '1',
    f5AlignV: getBool('f5AlignV', 'v_f5AlignV', '0'),
    f5InDir:  params.get('f5InDir') || 'right',
    f5InStyle: params.get('f5InStyle') || 'roll',
    f5OutDir: params.get('f5OutDir') || 'left',
    f5OutStyle: params.get('f5OutStyle') || 'fade',
    f5Shape:  params.get('f5Shape') || 'rounded',
    f5Height: getPos('f5Height', 'v_f5Height', isVert ? '200' : '1080'),
    f5Size:   getPos('f5Size', 'v_f5Size', '80'),
    f5GroupX: getPos('f5GroupX', 'v_f5GroupX', '0'),
    f5GroupY: getPos('f5GroupY', 'v_f5GroupY', isVert ? '0' : '20'),
    f5GroupCenterH: getBool('f5GroupCenterH', 'v_f5GroupCenterH', '1'),
    f5GroupCenterV: getBool('f5GroupCenterV', 'v_f5GroupCenterV', '0'),
    f5Gap:    getPos('f5Gap', 'v_f5Gap', isVert ? '12' : '30'),
    f5Width:  getPos('f5Width', 'v_f5Width', isVert ? '1080' : '1920'),
    f5Align:  params.get('f5Align') || 'center',
    f5EndDelay: parseInt(params.get('f5EndDelay') || '60000', 10),
    f5Exit:   params.get('f5Exit') || 'left',
    f5Sfx:    params.get('f5Sfx') !== '0',
    f5SfxVol: parseInt(params.get('f5SfxVol') || '57', 10),
    f5Color1: params.get('f5Color1') || 'teal',
    f5Color2: params.get('f5Color2') || 'pink',
    f5Color3: params.get('f5Color3') || 'purple',
    f5Color4: params.get('f5Color4') || 'yellow',
    f5Color5: params.get('f5Color5') || 'yellow',

    // Shared Aesthetics & Colors
    fontHeading: params.get('fontHeading') || 'Bebas Neue',
    fontBody: params.get('fontBody') || 'Inter',
    bgUrl: params.get('bg') || '',
    walkonBg: params.get('walkon-bg') || params.get('walkonBg') || 'global',
    soBg: params.has('so-bg') ? (params.get('so-bg') ?? '') : (params.has('soBg') ? (params.get('soBg') ?? '') : 'assets/backgrounds/Palms-Vertical.webp'),
    qaBg: params.get('qa-bg') || params.get('qaBg') || 'global',
    alertBg: params.get('alert-bg') || params.get('alertBg') || 'global',
    chatBg: params.has('chat-bg') ? (params.get('chat-bg') ?? '') : (params.get('chatBg') || 'assets/backgrounds/Ultimate.webp'),
    bgOpacity: parseInt(params.get('bgOpacity') || '65', 10),
    walkonBgOpacity: parseInt(params.get('walkon-bgOpacity') || params.get('walkonBgOpacity') || '65', 10),
    soBgOpacity: parseInt(params.get('so-bgOpacity') || params.get('soBgOpacity') || '65', 10),
    qaBgOpacity: parseInt(params.get('qa-bgOpacity') || params.get('qaBgOpacity') || '65', 10),
    alertBgOpacity: parseInt(params.get('alert-bgOpacity') || params.get('alertBgOpacity') || '65', 10),

    colors: {
      pink:       params.get('cPink')   || '#f4acc4',
      teal:       params.get('cTeal')   || '#53d8bf',
      purple:     params.get('cPurple') || '#a688ff',
      yellow:     params.get('cYellow') || '#fede9a',
      iconStroke: params.get('cStroke') || '#171a21',
      border:     params.get('cBorder') || '#0b2328',
      bgFill:     params.get('cBg')     || '#303030'
    },

    varAvatar: params.get('vAvatar') || 'avatarUrl',
    varTier:   params.get('vTier')   || 'levelName',
    stats:     Array.isArray(parsedStats) ? parsedStats : DEFAULT_STAT_ROWS
  };
})();

class GTAOverlayEngine {
  constructor(config) {
    this.config = config;
    this.client = null;
    
    this.walkonQueue = [];
    this.isWalkonAnimating = false;
    
    this.alertQueue = [];
    this.isAlertAnimating = false;

    this.shoutoutQueue = [];
    this.isShoutoutAnimating = false;
    this.lastShoutoutTs = 0;

    this.qaQueue = [];
    this.isQAAnimating = false;
    this.lastQATs = 0;

    this.chatMsgCounter = 0;
    
    this.lastWalkonData = {};
    this.lastAlertType = 'sub';
    this.goalsData = {};
    this.memberEmojiMap = {};
    this._memberEmojiKeys = [];
    this.first5Avatars = [];

    this.dom = {
      walkonContainer:   document.getElementById('walkon-container'),
      walkonCard:        document.querySelector('.walkon-card'),
      avatarWrap:        document.getElementById('avatar-wrapper'),
      avatar:            document.getElementById('card-avatar'),
      username:          document.getElementById('card-username'),
      tier:              document.getElementById('card-tier'),
      metaBox:           document.getElementById('meta-box'),
      alertContainer:    document.getElementById('alert-container'),
      alertBox:          document.getElementById('alert-box'),
      shoutoutContainer: document.getElementById('shoutout-container'),
      shoutoutWrapper:   document.getElementById('shoutout-wrapper'),
      shoutoutTitle:     document.getElementById('shoutout-title'),
      shoutoutName:      document.getElementById('shoutout-name'),
      shoutoutAvatar:    document.getElementById('shoutout-avatar'),
      chatContainer:     document.getElementById('chat-container'),
      chatBar:           document.getElementById('chat-bar'),
      chatTrack:         document.getElementById('chat-track'),
      qaContainer:       document.getElementById('qa-container'),
      qaBox:             document.getElementById('qa-box'),
      qaAvatar:          document.getElementById('qa-avatar'),
      qaUsername:        document.getElementById('qa-username'),
      qaBadge:           document.getElementById('qa-badge'),
      qaMessage:         document.getElementById('qa-message'),
      first5Container:   document.getElementById('first5-container'),
      first5Row:         document.getElementById('first5-row'),
      goalsContainer:    document.getElementById('goals-container'),
      goalsInner:        document.getElementById('goals-inner')
    };

    [this.dom.avatar, document.getElementById('alert-avatar'), this.dom.shoutoutAvatar, this.dom.qaAvatar].forEach(imgEl => {
      if (imgEl) {
        imgEl.onerror = () => { if (imgEl.src !== DEFAULT_AVATAR_SVG) imgEl.src = DEFAULT_AVATAR_SVG; };
        if (!imgEl.getAttribute('src')) imgEl.src = DEFAULT_AVATAR_SVG;
      }
    });

    if (this.dom.walkonContainer && !this.config.modules.walkon) this.dom.walkonContainer.style.display = 'none';
    if (this.dom.alertContainer && !this.config.modules.alerts) this.dom.alertContainer.style.display = 'none';
    if (this.dom.shoutoutContainer && !this.config.modules.shoutout) this.dom.shoutoutContainer.style.display = 'none';
    if (this.dom.chatContainer && !this.config.modules.chat) this.dom.chatContainer.style.display = 'none';
    if (this.dom.qaContainer && !this.config.modules.qa) this.dom.qaContainer.style.display = 'none';
    if (this.dom.first5Container && !this.config.modules.first5) this.dom.first5Container.style.display = 'none';
    if (this.dom.goalsContainer && !this.config.modules.goals) this.dom.goalsContainer.style.display = 'none';

    if (this.config.modules.walkon) {
      this.renderStatRows({});
    }

    this.applyGlobalStyles();
    window.addEventListener('resize', () => this.applyGlobalStyles());


    if (this.config.previewMode) {
      document.body.classList.add('preview-interactive');
      this.initStudioInteractivity();
      this.setPreviewPinned(true);
      if (this.config.modules.chat && this.dom.chatTrack && this.dom.chatTrack.children.length === 0) {
        this.seedPreviewChatMessages();
      }
    }

    this.initWebSocket();
    this.initPostMessageBridge();
    if (this.config.previewMode && window.parent !== window) {
      window.parent.postMessage({ type: 'OVERLAY_READY', layout: this.config.layout }, '*');
    }
  }


  resolveBg(override, globalBg, noBgFlag) {
    // Empty override = solid fill (None)
    if (override === '' || override === 'none') return 'none';
    if (noBgFlag) return 'none';
    if (override && override !== 'global') return override;
    return globalBg || 'none';
  }

  resolveAssetUrl(rawPath) {
    if (!rawPath) return '';
    const trimmed = rawPath.trim();
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) return trimmed;
    try { return new URL(trimmed, window.location.href).href; } 
    catch (e) { return trimmed; }
  }

  getField(obj, key, aliases = []) {
    if (!obj || typeof obj !== 'object') return undefined;
    const candidates = [key, ...aliases].filter(Boolean);
    for (const c of candidates) {
      if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return obj[c];
    }
    const lowerMap = {};
    Object.keys(obj).forEach(k => { lowerMap[k.toLowerCase().replace(/[\s_-]/g, '')] = obj[k]; });
    for (const c of candidates) {
      const normalized = String(c).toLowerCase().replace(/[\s_-]/g, '');
      if (lowerMap[normalized] !== undefined && lowerMap[normalized] !== null && lowerMap[normalized] !== '') return lowerMap[normalized];
    }
    return undefined;
  }

  hexToRgba(hex, opacityPct) {
    let clean = (hex || '#303030').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const num = parseInt(clean, 16) || 0x303030;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const alpha = Math.max(0, Math.min(100, isNaN(opacityPct) ? 88 : opacityPct)) / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  resolveAccentTokens(colorVal) {
    const map = {
      pink:   { accent: 'var(--gta-pink)',   glow: 'var(--glow-pink)' },
      teal:   { accent: 'var(--gta-teal)',   glow: 'var(--glow-teal)' },
      purple: { accent: 'var(--gta-purple)', glow: 'var(--glow-purple)' },
      yellow: { accent: 'var(--gta-yellow)', glow: 'var(--glow-yellow)' }
    };
    if (map[colorVal]) return map[colorVal];
    if (typeof colorVal === 'string' && colorVal.startsWith('#')) {
      return {
        accent: colorVal,
        glow: `color-mix(in srgb, ${colorVal} 45%, transparent)`
      };
    }
    return map.teal;
  }

  applyAlertAccentColor(alertType) {
    if (!this.dom.alertBox) return;
    const chosenKey = (this.config.alertColors && this.config.alertColors[alertType]) || 'teal';
    const tokens = this.resolveAccentTokens(chosenKey);
    this.dom.alertBox.style.setProperty('--alert-accent', tokens.accent);
    this.dom.alertBox.style.setProperty('--alert-glow', tokens.glow);
  }

  applyShoutoutAccentColor() {
    if (!this.dom.shoutoutWrapper) return;
    const tokens = this.resolveAccentTokens(this.config.soColor || 'pink');
    this.dom.shoutoutWrapper.style.setProperty('--so-accent', tokens.accent);
    this.dom.shoutoutWrapper.style.setProperty('--so-glow', tokens.glow);
  }

  applyQAAccentColor() {
    if (!this.dom.qaBox) return;
    const tokens = this.resolveAccentTokens(this.config.qaColor || 'teal');
    this.dom.qaBox.style.setProperty('--qa-accent', tokens.accent);
    this.dom.qaBox.style.setProperty('--qa-glow', tokens.glow);
  }

  applyGoalsAccentColor() {
    const tokens = this.resolveAccentTokens(this.config.goalsColor || 'teal');
    document.documentElement.style.setProperty('--goals-accent', tokens.accent);
    if (this.dom.goalsInner) this.dom.goalsInner.style.setProperty('--goals-accent', tokens.accent);
  }

  applyGlobalStyles() {
    const root = document.documentElement;
    
    // Canvas Scale & Dimensions
    const isVert = this.config.layout === 'vertical';
    const baseW = isVert ? 1080 : 1920;
    const baseH = isVert ? 1920 : 1080;
    const isStandaloneOBS = (window.parent === window);
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const scaleFactor = (isStandaloneOBS && vpW > 0 && vpH > 0)
      ? Math.min(vpW / baseW, vpH / baseH)
      : (this.config.res / 1080); 

    root.style.setProperty('--canvas-w', `${baseW}px`);
    root.style.setProperty('--canvas-h', `${baseH}px`);
    root.style.setProperty('--canvas-scale', scaleFactor);

    root.style.setProperty('--font-heading', `'${this.config.fontHeading}', sans-serif`);
    root.style.setProperty('--font-body', `'${this.config.fontBody}', sans-serif`);
    root.style.setProperty('--gta-pink', this.config.colors.pink);
    root.style.setProperty('--gta-teal', this.config.colors.teal);
    root.style.setProperty('--gta-purple', this.config.colors.purple);
    root.style.setProperty('--gta-yellow', this.config.colors.yellow);
    root.style.setProperty('--gta-icon-stroke', this.config.colors.iconStroke);
    root.style.setProperty('--gta-border', this.config.colors.border);
    root.style.setProperty('--gta-bg-fill', this.config.colors.bgFill);

    const resolvedBg = this.config.bgUrl ? `url("${this.resolveAssetUrl(this.config.bgUrl)}")` : 'none';

    // Module 1: Walk-On Card Styling
    if (this.config.modules.walkon && this.dom.walkonCard) {
      const wasPinned = this.dom.walkonContainer && this.dom.walkonContainer.classList.contains('animate-in');


      const walkonResolved = this.resolveBg(this.config.walkonBg, this.config.bgUrl, this.config.noBg);
      if (walkonResolved === 'none') {
        this.dom.walkonCard.classList.add('no-bg-image');
        root.style.setProperty('--card-bg-image', 'none');
      } else {
        this.dom.walkonCard.classList.remove('no-bg-image');
        root.style.setProperty('--card-bg-image', `url("${this.resolveAssetUrl(walkonResolved)}")`);
      }
      if (this.dom.walkonContainer) {
        this.dom.walkonContainer.className = `walkon-container ${this.config.cardAnim}` + (wasPinned ? ' animate-in' : '');
      }
      if (this.dom.avatarWrap) this.dom.avatarWrap.style.display = this.config.showAvatar ? 'block' : 'none';
      if (this.dom.username) this.dom.username.style.display = this.config.showUser ? 'block' : 'none';
      if (this.dom.tier) this.dom.tier.style.display = this.config.showTier ? 'inline-block' : 'none';
      this.recalculateWalkonCoords(baseW, baseH);
    }

    // Module 2: Alerts Styling
    if (this.config.modules.alerts) {
      this.applyAlertAccentColor(this.lastAlertType || 'sub');
      this.recalculateAlertCoords(baseW, baseH);
    }

    // Module 3: Shoutout Toast Styling
    if (this.config.modules.shoutout && this.dom.shoutoutWrapper) {
      const wasSoPinned = this.dom.shoutoutContainer && this.dom.shoutoutContainer.classList.contains('animate-in');
      const soResolved = this.resolveBg(this.config.soBg, this.config.bgUrl, this.config.soNoBg);
      if (soResolved === 'none') {
        this.dom.shoutoutWrapper.classList.add('no-bg-image');
        root.style.setProperty('--so-bg-image', 'none');
      } else {
        this.dom.shoutoutWrapper.classList.remove('no-bg-image');
        root.style.setProperty('--so-bg-image', `url("${this.resolveAssetUrl(soResolved)}")`);
      }
      this.dom.shoutoutWrapper.classList.toggle('avatar-left', this.config.soLayout === 'left');
      this.applyShoutoutAccentColor();
      if (this.dom.shoutoutTitle) {
        this.dom.shoutoutTitle.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${this.config.soTitle || 'SHOUTOUT'}`;
      }
      if (this.dom.shoutoutContainer) {
        this.dom.shoutoutContainer.className = `shoutout-container ${this.config.soAnim}` + (wasSoPinned ? ' animate-in' : '');
      }
      this.recalculateShoutoutCoords(baseW, baseH);
    }

    // Module 4: Horizontal Chat Bar Styling
    if (this.config.modules.chat && this.dom.chatBar) {
      root.style.setProperty('--chat-w', `${Math.round(this.config.chatW || baseW)}px`);
      root.style.setProperty('--chat-font-size', `${this.config.chatFontSize || 20}px`);
      root.style.setProperty('--chat-color-member', this.config.chatColorMember || 'var(--gta-teal)');
      root.style.setProperty('--chat-color-mod', this.config.chatColorMod || 'var(--gta-purple)');
      root.style.setProperty('--chat-color-viewer', this.config.chatColorViewer || 'var(--gta-yellow)');
      root.style.setProperty('--chat-color-msg', this.config.chatColorMsg || '#f0f4f8');
      root.style.setProperty('--chat-bg', this.hexToRgba(this.config.chatBgColor || this.config.colors.bgFill, this.config.chatBgOpacity));
      const chatTokens = this.resolveAccentTokens(this.config.chatAccent || 'teal');
      root.style.setProperty('--chat-accent', chatTokens.accent);
      this.dom.chatBar.classList.toggle('no-bg-fill', Boolean(this.config.chatNoBg));
      this.recalculateChatCoords(baseW, baseH);
    }

    // Module 5: Q&A Highlight Toast Styling
    if (this.config.modules.qa && this.dom.qaBox) {
      const wasQAPinned = this.dom.qaContainer && this.dom.qaContainer.classList.contains('animate-in');
      const qaResolved = this.resolveBg(this.config.qaBg, this.config.bgUrl, this.config.qaNoBg);
      if (qaResolved === 'none') {
        this.dom.qaBox.classList.add('no-bg-image');
        root.style.setProperty('--qa-bg-image', 'none');
      } else {
        this.dom.qaBox.classList.remove('no-bg-image');
        root.style.setProperty('--qa-bg-image', `url("${this.resolveAssetUrl(qaResolved)}")`);
      }
      this.applyQAAccentColor();
      if (this.dom.qaBadge) {
        this.dom.qaBadge.style.display = this.config.qaShowBadge ? 'inline-flex' : 'none';
        this.dom.qaBadge.innerHTML = `<i class="fa-solid fa-comments"></i> ${this.config.qaTitle || 'Q&A HIGHLIGHT'}`;
      }
      if (this.dom.qaContainer) {
        this.dom.qaContainer.className = `qa-container ${this.config.qaAnim}` + (wasQAPinned ? ' animate-in' : '');
      }
      this.recalculateQACoords(baseW, baseH);
    }

    if (this.config.modules.first5) {
      this.recalculateFirst5Coords(baseW, baseH);
      if (this.config.previewMode && this.first5Avatars && this.first5Avatars.length > 0) this.renderFirst5();
    }
    if (this.config.modules.goals) {
      this.applyGoalsAccentColor();
      const goalsResolved = this.resolveBg(this.config.goalsBg, this.config.bgUrl, false);
      if (this.dom.goalsInner) {
        if (goalsResolved === 'none' || !goalsResolved) {
          root.style.setProperty('--goals-bg-image', 'none');
          this.dom.goalsInner.style.backgroundImage = 'none';
        } else {
          const url = `url("${this.resolveAssetUrl(goalsResolved)}")`;
          root.style.setProperty('--goals-bg-image', url);
          this.dom.goalsInner.style.backgroundImage = `linear-gradient(160deg, rgba(23, 26, 33, 0.55) 0%, color-mix(in srgb, var(--gta-bg-fill) 78%, transparent) 100%), ${url}`;
          this.dom.goalsInner.style.backgroundSize = 'cover';
          this.dom.goalsInner.style.backgroundPosition = 'center';
        }
      }
      this.recalculateGoalsCoords(baseW, baseH);
      this.syncGoalsView();
    }
    

      // Alerts header background - same treatment as Card/Shoutout/Q&A
      if (this.dom.alertBox) {
        const alertResolved = this.resolveBg(this.config.alertBg, this.config.bgUrl, false);
        const header = this.dom.alertBox.querySelector('.alert-header');
        if (alertResolved === 'none' || !alertResolved) {
          root.style.setProperty('--alert-bg-image', 'none');
          if (header) header.style.backgroundImage = 'none';
        } else {
          const url = `url("${this.resolveAssetUrl(alertResolved)}")`;
          root.style.setProperty('--alert-bg-image', url);
          if (header) {
            header.style.backgroundImage = `linear-gradient(160deg, rgba(23, 26, 33, 0.65) 0%, color-mix(in srgb, var(--gta-bg-fill) 92%, transparent) 100%), ${url}`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
          }
        }
      }


      // Chat bar background - same treatment as Card/Shoutout/Q&A
      if (this.dom.chatBar) {
        const chatResolved = this.resolveBg(this.config.chatBg, this.config.bgUrl, this.config.chatNoBg);
        if (chatResolved === 'none' || !chatResolved) {
          root.style.setProperty('--chat-bg-image', 'none');
          this.dom.chatBar.style.backgroundImage = 'none';
        } else {
          const url = `url("${this.resolveAssetUrl(chatResolved)}")`;
          root.style.setProperty('--chat-bg-image', url);
          this.dom.chatBar.style.backgroundImage = `linear-gradient(160deg, rgba(23, 26, 33, 0.65) 0%, color-mix(in srgb, var(--gta-bg-fill) 92%, transparent) 100%), ${url}`;
          this.dom.chatBar.style.backgroundSize = 'cover';
          this.dom.chatBar.style.backgroundPosition = 'center';
        }
      }

    this.updateLocalizedPreviewText();
    this.updateDomCoords();
  }

  updateLocalizedPreviewText() {
    const t = this.config.t || i18nDict.en;
    const allDefaultSubs = Object.values(i18nDict).map(d => d.newSub);
    const alertEvEl = document.getElementById('alert-event-name');
    if (alertEvEl && !this.isAlertAnimating && allDefaultSubs.includes(alertEvEl.textContent.trim())) {
      alertEvEl.textContent = t.newSub;
    }
    const allDefaultQaMsgs = Object.values(i18nDict).map(d => d.defaultQaMsg);
    if (this.dom.qaMessage && !this.isQAAnimating && allDefaultQaMsgs.includes(this.dom.qaMessage.textContent.trim())) {
      this.dom.qaMessage.textContent = t.defaultQaMsg;
    }
    const pillMap = {
      walkon:   [this.dom.walkonContainer,   t.dragWalkon],
      alert:    [this.dom.alertContainer,    t.dragAlert],
      shoutout: [this.dom.shoutoutContainer, t.dragShoutout],
      chat:     [this.dom.chatContainer,     t.dragChat],
      qa:       [this.dom.qaContainer,       t.dragQA],
      first5:   [this.dom.first5Container,   t.dragFirst5],
      goals:    [this.dom.goalsContainer,    t.dragGoals]
    };
    Object.values(pillMap).forEach(([cont, label]) => {
      if (!cont || !label) return;
      const pill = cont.querySelector('.studio-drag-pill');
      if (pill) pill.innerHTML = `<i class="fa-solid fa-up-down-left-right"></i> ${label}`;
    });
  }

  recalculateWalkonCoords(baseW, baseH) {
    if (!this.dom.walkonContainer) return;
    const scale = this.config.scale || 1;
    const w = this.dom.walkonContainer.offsetWidth || 340;
    const h = this.dom.walkonContainer.offsetHeight || 390;
    const maxX = Math.max(0, baseW - (w * scale));
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.alignH) this.config.posX = Math.round(maxX / 2);
    else this.config.posX = Math.round(Math.max(0, Math.min(maxX, this.config.posX)));
    if (this.config.alignV) this.config.posY = Math.round(maxY / 2);
    else this.config.posY = Math.round(Math.max(0, Math.min(maxY, this.config.posY)));
  }

  recalculateAlertCoords(baseW, baseH) {
    if (!this.dom.alertContainer) return;
    const scale = this.config.alertScale || 1;
    const w = this.dom.alertContainer.offsetWidth || 460;
    const h = this.dom.alertContainer.offsetHeight || 140;
    const halfW = (w * scale) / 2;
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.alertAlignH) this.config.alertX = Math.round(baseW / 2);
    else this.config.alertX = Math.round(Math.max(halfW, Math.min(baseW - halfW, this.config.alertX)));
    if (this.config.alertAlignV) this.config.alertY = Math.round(maxY / 2);
    else this.config.alertY = Math.round(Math.max(0, Math.min(maxY, this.config.alertY)));
  }

  recalculateShoutoutCoords(baseW, baseH) {
    if (!this.dom.shoutoutContainer) return;
    const scale = this.config.soScale || 1;
    const w = this.dom.shoutoutContainer.offsetWidth || 360;
    const h = this.dom.shoutoutContainer.offsetHeight || 104;
    const maxX = Math.max(0, baseW - (w * scale));
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.soAlignH) this.config.soX = Math.round(maxX / 2);
    else this.config.soX = Math.round(Math.max(0, Math.min(maxX, this.config.soX)));
    if (this.config.soAlignV) this.config.soY = Math.round(maxY / 2);
    else this.config.soY = Math.round(Math.max(0, Math.min(maxY, this.config.soY)));
  }

  recalculateChatCoords(baseW, baseH) {
    if (!this.dom.chatContainer) return;
    const scale = this.config.chatScale || 1;
    const w = this.config.chatW || baseW;
    const h = this.dom.chatContainer.offsetHeight || 56;
    const maxX = Math.max(0, baseW - (w * scale));
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.chatAlignH) this.config.chatX = Math.round(maxX / 2);
    else this.config.chatX = Math.round(Math.max(0, Math.min(maxX, this.config.chatX)));
    if (this.config.chatAlignV) this.config.chatY = Math.round(maxY / 2);
    else this.config.chatY = Math.round(Math.max(0, Math.min(maxY, this.config.chatY)));
  }

  recalculateQACoords(baseW, baseH) {
    if (!this.dom.qaContainer) return;
    const scale = this.config.qaScale || 1;
    const w = this.dom.qaContainer.offsetWidth || 600;
    const h = this.dom.qaContainer.offsetHeight || 120;
    const halfW = (w * scale) / 2;
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.qaAlignH) this.config.qaX = Math.round(baseW / 2);
    else this.config.qaX = Math.round(Math.max(halfW, Math.min(baseW - halfW, this.config.qaX)));
    if (this.config.qaAlignV) this.config.qaY = Math.round(maxY / 2);
    else this.config.qaY = Math.round(Math.max(0, Math.min(maxY, this.config.qaY)));
  }

  updateDomCoords() {
    const root = document.documentElement;
    if (this.config.modules.walkon) {
      root.style.setProperty('--card-scale', this.config.scale);
      root.style.setProperty('--card-x', `${Math.round(this.config.posX)}px`);
      root.style.setProperty('--card-y', `${Math.round(this.config.posY)}px`);
    }
    if (this.config.modules.alerts) {
      root.style.setProperty('--alert-scale', this.config.alertScale);
      root.style.setProperty('--alert-x', `${Math.round(this.config.alertX)}px`);
      root.style.setProperty('--alert-y', `${Math.round(this.config.alertY)}px`);
    }
    if (this.config.modules.shoutout) {
      root.style.setProperty('--so-scale', this.config.soScale);
      root.style.setProperty('--so-x', `${Math.round(this.config.soX)}px`);
      root.style.setProperty('--so-y', `${Math.round(this.config.soY)}px`);
    }
    if (this.config.modules.chat) {
      root.style.setProperty('--chat-scale', this.config.chatScale);
      root.style.setProperty('--chat-x', `${Math.round(this.config.chatX)}px`);
      root.style.setProperty('--chat-y', `${Math.round(this.config.chatY)}px`);
    }
    if (this.config.modules.qa) {
      root.style.setProperty('--qa-scale', this.config.qaScale);
      root.style.setProperty('--qa-x', `${Math.round(this.config.qaX)}px`);
      root.style.setProperty('--qa-y', `${Math.round(this.config.qaY)}px`);
    }
    if (this.config.modules.goals) {
      root.style.setProperty('--goals-x', `${Math.round(this.config.goalsX)}px`);
      root.style.setProperty('--goals-y', `${Math.round(this.config.goalsY)}px`);
      root.style.setProperty('--goals-scale', this.config.goalsScale);
    }
    if (this.config.modules.first5) {
      root.style.setProperty('--f5-x', `${Math.round(this.config.f5X)}px`);
      root.style.setProperty('--f5-y', `${Math.round(this.config.f5Y)}px`);
      root.style.setProperty('--f5-width', this.config.f5Width + 'px');
      root.style.setProperty('--f5-height', this.config.f5Height + 'px');
      root.style.setProperty('--f5-avatar-size', this.config.f5Size + 'px');
      const count = Math.max(1, Math.min(5, this.first5Avatars.length || (this.config.previewMode ? 5 : 1)));
      const gaps = Math.max(0, count - 1);
      if (this.config.f5GroupCenterH) {
        const groupW = (this.config.f5Size * count) + (this.config.f5Gap * gaps);
        this.config.f5GroupX = Math.round((this.config.f5Width - groupW) / 2);
      }
      if (this.config.f5GroupCenterV) {
        this.config.f5GroupY = Math.round((this.config.f5Height - this.config.f5Size) / 2);
      }
      root.style.setProperty('--f5-group-x', this.config.f5GroupX + 'px');
      root.style.setProperty('--f5-group-y', this.config.f5GroupY + 'px');
      root.style.setProperty('--f5-gap', this.config.f5Gap + 'px');
    }
  }

  setPreviewPinned(pinned) {
    this.config.previewMode = pinned;
    if (pinned) {
      document.body.classList.add('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating && this.dom.walkonContainer) this.dom.walkonContainer.classList.add('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating && this.dom.alertContainer) this.dom.alertContainer.classList.add('animate-in');
      if (this.config.modules.shoutout && !this.isShoutoutAnimating && this.dom.shoutoutContainer) this.dom.shoutoutContainer.classList.add('animate-in');
      if (this.config.modules.chat && this.dom.chatContainer) this.dom.chatContainer.classList.add('animate-in');
      if (this.config.modules.qa && !this.isQAAnimating && this.dom.qaContainer) this.dom.qaContainer.classList.add('animate-in');
      if (this.config.modules.first5 && this.dom.first5Container) this.showFirst5Placeholders();
      if (this.config.modules.goals && this.dom.goalsContainer) {
        this.dom.goalsContainer.style.display = '';
        this.seedPreviewGoals();
        this.dom.goalsContainer.classList.add('animate-in');
        this.syncGoalsView();
      }
    } else {
      document.body.classList.remove('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating && this.dom.walkonContainer) this.dom.walkonContainer.classList.remove('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating && this.dom.alertContainer) this.dom.alertContainer.classList.remove('animate-in');
      if (this.config.modules.shoutout && !this.isShoutoutAnimating && this.dom.shoutoutContainer) this.dom.shoutoutContainer.classList.remove('animate-in');
      if (this.config.modules.chat && this.dom.chatContainer) this.dom.chatContainer.classList.remove('animate-in');
      if (this.config.modules.qa && !this.isQAAnimating && this.dom.qaContainer) this.dom.qaContainer.classList.remove('animate-in');
      if (this.config.modules.first5 && this.dom.first5Container) {
        this.dom.first5Container.classList.remove('animate-in');
        this.first5Avatars = [];
        if (this.dom.first5Row) this.dom.first5Row.innerHTML = '';
      }
      if (this.config.modules.goals && this.dom.goalsContainer) {
        this.dom.goalsContainer.classList.remove('animate-in');
        this.stopGoalsTicker(true);
      }
    }
  }

  renderStatRows(data = {}) {
    const metaBox = this.dom.metaBox;
    if (!metaBox) return;
    metaBox.innerHTML = '';

    if (!this.config.stats || this.config.stats.length === 0) {
      metaBox.classList.add('empty-stats');
      return;
    }
    metaBox.classList.remove('empty-stats');

    this.config.stats.forEach((stat, index) => {
      const row = document.createElement('div');
      row.className = 'meta-row';
      row.style.setProperty('--row-delay', `${(0.35 + index * 0.12).toFixed(2)}s`);

      const matchedVal = this.getField(data, stat.varName);
      const rawVal = matchedVal !== undefined ? matchedVal : (stat.fallback || '--');
      const displayVal = `${rawVal}${stat.suffix || ''}`;

      row.innerHTML = `
        <span class="meta-label">
          <span class="hud-icon icon-${stat.iconColor || 'pink'}">
            <i class="fa-solid ${stat.icon || 'fa-star'}"></i>
          </span>
          <span>${stat.label}:</span>
        </span>
        <span class="meta-val val-${stat.valColor || 'yellow'}">${displayVal}</span>
      `;
      metaBox.appendChild(row);
    });
  }

  initStudioInteractivity() {
    const isVert = this.config.layout === 'vertical';
    const baseW = isVert ? 1080 : 1920;
    const baseH = isVert ? 1920 : 1080;

    const guideV = document.createElement('div');
    guideV.className = 'snap-guide vertical';
    guideV.style.left = (baseW / 2) + 'px';
    document.body.appendChild(guideV);
    const guideH = document.createElement('div');
    guideH.className = 'snap-guide horizontal';
    guideH.style.top = (baseH / 2) + 'px';
    document.body.appendChild(guideH);

    ['walkon', 'alert', 'shoutout', 'chat', 'qa', 'first5', 'goals'].forEach((id) => {
      const spec = this.widgetSpec(id);
      if (spec && spec.el) this.setupDraggable(spec.el, id, guideV, guideH, baseW, baseH);
    });
    this.setupFirst5GroupDrag();
  }

  widgetSpec(modType) {
    const c = this.config;
    const specs = {
      walkon: {
        el: this.dom.walkonContainer, label: 'Walk-On Card',
        x: 'posX', y: 'posY', scale: 'scale', alignH: 'alignH', alignV: 'alignV',
        yDir: -1, centerX: false,
        recalc: (w, h) => this.recalculateWalkonCoords(w, h),
        msg: 'CARD_MANIPULATED',
        payload: () => ({ x: c.posX, y: c.posY, scale: c.scale, alignH: c.alignH, alignV: c.alignV })
      },
      alert: {
        el: this.dom.alertContainer, label: 'Alert Box',
        x: 'alertX', y: 'alertY', scale: 'alertScale', alignH: 'alertAlignH', alignV: 'alertAlignV',
        yDir: 1, centerX: true,
        recalc: (w, h) => this.recalculateAlertCoords(w, h),
        msg: 'ALERT_MANIPULATED',
        payload: () => ({ ax: c.alertX, ay: c.alertY, ascale: c.alertScale, aAlignH: c.alertAlignH, aAlignV: c.alertAlignV })
      },
      shoutout: {
        el: this.dom.shoutoutContainer, label: 'Shoutout Toast',
        x: 'soX', y: 'soY', scale: 'soScale', alignH: 'soAlignH', alignV: 'soAlignV',
        yDir: 1, centerX: false,
        recalc: (w, h) => this.recalculateShoutoutCoords(w, h),
        msg: 'SHOUTOUT_MANIPULATED',
        payload: () => ({ soX: c.soX, soY: c.soY, soScale: c.soScale, soAlignH: c.soAlignH, soAlignV: c.soAlignV })
      },
      chat: {
        el: this.dom.chatContainer, label: 'Horizontal Chat Bar',
        x: 'chatX', y: 'chatY', scale: 'chatScale', alignH: 'chatAlignH', alignV: 'chatAlignV',
        yDir: -1, centerX: false,
        recalc: (w, h) => this.recalculateChatCoords(w, h),
        msg: 'CHAT_MANIPULATED',
        payload: () => ({ chatX: c.chatX, chatY: c.chatY, chatScale: c.chatScale, chatAlignH: c.chatAlignH, chatAlignV: c.chatAlignV })
      },
      qa: {
        el: this.dom.qaContainer, label: 'Q&A Highlight Toast',
        x: 'qaX', y: 'qaY', scale: 'qaScale', alignH: 'qaAlignH', alignV: 'qaAlignV',
        yDir: -1, centerX: true,
        recalc: (w, h) => this.recalculateQACoords(w, h),
        msg: 'QA_MANIPULATED',
        payload: () => ({ qaX: c.qaX, qaY: c.qaY, qaScale: c.qaScale, qaAlignH: c.qaAlignH, qaAlignV: c.qaAlignV })
      },
      first5: {
        el: this.dom.first5Container, label: (c.t && c.t.dragFirst5) || 'First 5',
        x: 'f5X', y: 'f5Y', scale: null, alignH: 'f5AlignH', alignV: 'f5AlignV',
        yDir: 1, centerX: false,
        recalc: (w, h) => this.recalculateFirst5Coords(w, h),
        msg: 'FIRST5_MANIPULATED',
        payload: () => ({
          f5X: c.f5X, f5Y: c.f5Y, f5Size: c.f5Size,
          f5GroupX: c.f5GroupX, f5GroupY: c.f5GroupY,
          f5AlignH: c.f5AlignH, f5AlignV: c.f5AlignV,
          f5GroupCenterH: c.f5GroupCenterH, f5GroupCenterV: c.f5GroupCenterV
        })
      },
      goals: {
        el: this.dom.goalsContainer, label: (c.t && c.t.dragGoals) || 'Goal Bars',
        x: 'goalsX', y: 'goalsY', scale: 'goalsScale', alignH: 'goalsAlignH', alignV: 'goalsAlignV',
        yDir: 1, centerX: false,
        recalc: (w, h) => this.recalculateGoalsCoords(w, h),
        msg: 'GOALS_MANIPULATED',
        payload: () => ({ goalsX: c.goalsX, goalsY: c.goalsY, goalsScale: c.goalsScale, goalsAlignH: c.goalsAlignH, goalsAlignV: c.goalsAlignV })
      }
    };
    return specs[modType] || null;
  }

  setupDraggable(container, modType, guideV, guideH, baseW, baseH) {
    if (!container) return;
    const spec = this.widgetSpec(modType);
    if (!spec) return;

    const dragPill = document.createElement('div');
    dragPill.className = 'studio-drag-pill';
    dragPill.innerHTML = `<i class="fa-solid fa-up-down-left-right"></i> ${spec.label}`;
    container.appendChild(dragPill);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'studio-resize-handle';
    container.appendChild(resizeHandle);

    let isDragging = false, isResizing = false;
    let startX = 0, startY = 0, startObjX = 0, startObjY = 0, startScale = 1, startSize = 80;
    let startBoxW = 0, startBoxH = 0;
    const SNAP = 14;
    const canvasScaleOf = () => parseFloat(document.documentElement.style.getPropertyValue('--canvas-scale') || '1') || 1;

    container.addEventListener('mousedown', (e) => {
      if (e.target === resizeHandle || !this.config.previewMode) return;
      if (e.target.closest && e.target.closest('.first5-row')) return;
      if ((modType === 'walkon' && this.isWalkonAnimating) ||
          (modType === 'alert' && this.isAlertAnimating) ||
          (modType === 'shoutout' && this.isShoutoutAnimating) ||
          (modType === 'qa' && this.isQAAnimating)) return;
      e.preventDefault();
      isDragging = true;
      const canvasScale = canvasScaleOf();
      startX = e.clientX / canvasScale;
      startY = e.clientY / canvasScale;
      startObjX = this.config[spec.x];
      startObjY = this.config[spec.y];
      startBoxW = container.offsetWidth;
      startBoxH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    resizeHandle.addEventListener('mousedown', (e) => {
      if (!this.config.previewMode) return;
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      const canvasScale = canvasScaleOf();
      startX = e.clientX / canvasScale;
      startY = e.clientY / canvasScale;
      startScale = spec.scale ? (this.config[spec.scale] || 1) : 1;
      startSize = this.config.f5Size || 80;
      startBoxW = container.offsetWidth;
      startBoxH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging && !isResizing) return;
      const canvasScale = canvasScaleOf();
      const dx = (e.clientX / canvasScale) - startX;
      const dy = (e.clientY / canvasScale) - startY;

      if (isDragging) {
        const scale = spec.scale ? (this.config[spec.scale] || 1) : 1;
        const boxW = startBoxW * scale;
        const boxH = startBoxH * scale;
        let nextX = startObjX + dx;
        let nextY = startObjY + (dy * spec.yDir);
        if (spec.centerX) {
          nextX = Math.max(boxW / 2, Math.min(baseW - boxW / 2, nextX));
        } else {
          nextX = Math.max(0, Math.min(baseW - boxW, nextX));
        }
        nextY = Math.max(0, Math.min(baseH - boxH, nextY));
        nextX = Math.round(nextX);
        nextY = Math.round(nextY);
        if (!e.altKey) {
          const cx = spec.centerX ? baseW / 2 : Math.round((baseW - boxW) / 2);
          const cy = Math.round((baseH - boxH) / 2);
          guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
          guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
          if (guideV.style.display === 'block') nextX = cx;
          if (guideH.style.display === 'block') nextY = cy;
        }
        this.config[spec.alignH] = false;
        this.config[spec.alignV] = false;
        this.config[spec.x] = nextX;
        this.config[spec.y] = nextY;
        this.updateDomCoords();
        this.broadcastManipulate(modType);
      } else if (isResizing) {
        const vDelta = spec.yDir < 0 ? -dy : dy;
        const hDelta = spec.centerX ? (dx * 2) : dx;
        const delta = Math.abs(hDelta) >= Math.abs(vDelta) ? hDelta : vDelta;
        if (modType === 'first5') {
          const base = Math.max(40, startSize);
          const factor = (base + delta) / base;
          this.config.f5Size = Math.round(Math.max(40, Math.min(200, startSize * factor)));
        } else if (spec.scale) {
          const startScaledW = Math.max(80, startBoxW * startScale);
          const rawScale = startScale * ((startScaledW + delta) / startScaledW);
          this.config[spec.scale] = Math.round(Math.max(0.5, Math.min(2.0, rawScale)) * 20) / 20;
          if (spec.recalc) spec.recalc(baseW, baseH);
        }
        this.updateDomCoords();
        if (modType === 'first5' && this.config.previewMode) this.renderFirst5();
        this.broadcastManipulate(modType);
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging && !isResizing) return;
      isDragging = false;
      isResizing = false;
      guideV.style.display = 'none';
      guideH.style.display = 'none';
      container.classList.remove('is-manipulating');
    });
  }

  broadcastManipulate(modType) {
    if (window.parent === window) return;
    const spec = this.widgetSpec(modType);
    if (!spec) return;
    window.parent.postMessage(Object.assign({ type: spec.msg, layout: this.config.layout }, spec.payload()), '*');
  }

  initWebSocket() {
    if (this.config.previewMode && window.parent !== window) return; 
    if (typeof StreamerbotClient === 'undefined') return;

    const opts = { 
      host: this.config.host, 
      port: this.config.port, 
      endpoint: this.config.endpoint, 
      subscribe: {
        General: ['Custom'],
        Misc: ['GlobalVariableUpdated'],
        YouTube: ['Message', 'MessageDeleted', 'UserBanned'],
        Twitch: ['ChatMessage', 'ChatMessageDeleted', 'UserTimedOut', 'UserBanned']
      },
      onConnect: async () => {
      try {
        await this.refreshGoalGlobals();
        if (this._globalCache && this._globalCache.memberEmojiMap) this.applyMemberEmojiMap(this._globalCache.memberEmojiMap);
      } catch(e) {}
        console.log(`[GTA-Overlay] Connected to Streamer.bot (${this.config.host}:${this.config.port})`);
      },
      onDisconnect: () => {
        console.warn('[GTA-Overlay] Disconnected from Streamer.bot.');
      }
    };
    
    if (this.config.password) opts.password = this.config.password;

    this.client = new StreamerbotClient(opts);
    
    // 1. Custom Broadcast Listener (Walk-On, Alerts, Shoutout, Chat, Q&A)
    this.client.on('General.Custom', (payload) => {
      let data = payload?.data ?? payload;
      if (typeof data === 'string') try { data = JSON.parse(data); } catch(e){}
      if (data?.data && typeof data.data === 'object' && !data.event) data = data.data;
      else if (data?.data && typeof data.data === 'string') try { data = JSON.parse(data.data); } catch(e){}

      if (!data) return;
      const ev = data.event || data.type;
      if (ev === this.config.walkonEvent) {
        if (this.config.modules.walkon) this.enqueueWalkOn(data);
      } else if (ev === this.config.alertEvent) {
        if (this.config.modules.alerts) this.enqueueAlert(data);
      } else if (ev === this.config.soEvent) {
        if (this.config.modules.shoutout) this.enqueueShoutout(data);
      } else if (ev === this.config.chatEvent) {
        if (this.config.modules.chat) this.handleIncomingChatMessage(data);
      } else if (ev === this.config.qaEvent) {
        if (this.config.modules.qa) this.enqueueQA(data);
      } else if (ev === this.config.f5Event) {
        if (this.config.modules.first5) this.enqueueFirst5(data);
      }
    });

    // 2. Global Variable Updated Listener (viShoutOuts & viChatHighlight)
    this.client.on('Misc.GlobalVariableUpdated', (payload) => {
      const gVarName = payload?.data?.name;
      const gNewValue = payload?.data?.newValue;
      if (gVarName) this.rememberGlobals({ [gVarName]: gNewValue });
      if (gVarName === 'memberEmojiMap') this.applyMemberEmojiMap(gNewValue);
      if (gVarName && this.isGoalVar(gVarName)) {
        this.goalsData[gVarName] = this.unwrapGlobal(gNewValue);
        this._goalsPreviewSeeded = false;
        this.syncGoalsView();
      }
      const varName = payload?.data?.name;
      const newValue = payload?.data?.newValue;
      if (!varName || !newValue) return;

      if (this.config.modules.shoutout && varName === this.config.soGlobalVar) {
        try {
          const soData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
          this.enqueueShoutout(soData);
        } catch (err) {
          console.error('[GTA-Overlay] Failed to parse shoutout global JSON:', err);
        }
      } else if (this.config.modules.qa && varName === this.config.qaGlobalVar) {
        try {
          const qaData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
          this.enqueueQA(qaData);
        } catch (err) {
          console.error('[GTA-Overlay] Failed to parse Q&A global JSON:', err);
        }
      }
    });

    // 3. Live YouTube & Twitch Chat Listeners for Horizontal Chat Module
    if (this.config.modules.chat) {
      this.client.on('YouTube.Message', (payload) => {
        const d = payload?.data || payload;
        this.handleYouTubeChatEvent(d);
      });
      this.client.on('YouTube.MessageDeleted', (payload) => {
        const msgId = payload?.data?.eventId || payload?.data?.messageId;
        if (msgId) this.removeChatMessageById(msgId);
      });
      this.client.on('YouTube.UserBanned', (payload) => {
        const uId = payload?.data?.bannedUser?.id || payload?.data?.user?.id;
        if (uId) this.removeChatMessagesByUser(uId);
      });

      this.client.on('Twitch.ChatMessage', (payload) => {
        const d = payload?.data?.message || payload?.data || payload;
        this.handleTwitchChatEvent(d);
      });
      this.client.on('Twitch.ChatMessageDeleted', (payload) => {
        const msgId = payload?.data?.targetMessageId || payload?.data?.messageId;
        if (msgId) this.removeChatMessageById(msgId);
      });
      this.client.on('Twitch.UserTimedOut', (payload) => {
        const uId = payload?.data?.user_id || payload?.data?.userId;
        if (uId) this.removeChatMessagesByUser(uId);
      });
      this.client.on('Twitch.UserBanned', (payload) => {
        const uId = payload?.data?.user_id || payload?.data?.userId;
        if (uId) this.removeChatMessagesByUser(uId);
      });
    }
  }

  initPostMessageBridge() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      // Ignore state updates meant for the OTHER layout frame to prevent snapping back
      if (msg.type === 'LIVE_CONFIG_UPDATE' && msg.targetLayout && msg.targetLayout !== this.config.layout) return;

      if (msg.type === 'TRIGGER_WALKON_TEST') {
        if (this.config.modules.walkon) this.enqueueWalkOn(msg.payload || {});
      } else if (msg.type === 'TRIGGER_ALERT_TEST') {
        if (this.config.modules.alerts) this.enqueueAlert(msg.payload || {});
      } else if (msg.type === 'TRIGGER_SHOUTOUT_TEST') {
        if (this.config.modules.shoutout) this.enqueueShoutout(msg.payload || {});
      } else if (msg.type === 'TRIGGER_CHAT_TEST') {
        if (this.config.modules.chat) this.handleIncomingChatMessage(msg.payload || {});
      } else if (msg.type === 'TRIGGER_GOALS_TEST') {
        if (this.config.modules.goals) {
          this.goalsData[this.config.goalsLikesCount] = 2400;
          this.goalsData[this.config.goalsLikesGoal] = 5000;
          this.goalsData[this.config.goalsMembersCount] = 64;
          this.goalsData[this.config.goalsMembersGoal] = 100;
          this.goalsData[this.config.goalsJewelsCount] = 1500;
          this.goalsData[this.config.goalsJewelsGoal] = 2000;
          this.goalsData[this.config.goalsSubsCount] = 420;
          this.goalsData[this.config.goalsSubsGoal] = 1000;
          this.goalsData[this.config.goalsGiftsCount] = 18;
          this.goalsData[this.config.goalsGiftsGoal] = 50;
          this.goalsData[this.config.goalsSupersCount] = 12;
          this.goalsData[this.config.goalsSupersGoal] = 40;
          (this.config.goalsCustom || []).forEach((g, i) => {
            if (g.count) this.goalsData[g.count] = (i + 1) * 15;
            if (g.goal) this.goalsData[g.goal] = 100;
          });
          this._goalsPreviewSeeded = false;
          if (this.dom.goalsContainer) this.dom.goalsContainer.classList.add('animate-in');
          this.syncGoalsView();
        }
      } else if (msg.type === 'TRIGGER_FIRST5_TEST') {
        this.clearFirst5();
        [{avatar:DEFAULT_AVATAR_SVG,name:'ViceKing'},{avatar:DEFAULT_AVATAR_SVG,name:'NeonRider'},{avatar:DEFAULT_AVATAR_SVG,name:'PinkPanther'},{avatar:DEFAULT_AVATAR_SVG,name:'TealWolf'},{avatar:DEFAULT_AVATAR_SVG,name:'PurpleHaze'}].forEach((m,i)=>setTimeout(()=>this.enqueueFirst5(m),i*1000));
      } else if (msg.type === 'TRIGGER_QA_TEST') {
        if (this.config.modules.qa) this.enqueueQA(msg.payload || {});
      } else if (msg.type === 'MEMBER_EMOJI_MAP') {
        this.applyMemberEmojiMap(msg.map || {});
      } else if (msg.type === 'SET_PREVIEW_PINNED') {
        this.setPreviewPinned(Boolean(msg.pinned));
      } else if (msg.type === 'LIVE_CONFIG_UPDATE') {
        const s = msg.state;
        const isVert = this.config.layout === 'vertical';

        // Update language & translations dynamically
        this.config.lang = s.lang || 'en';
        this.config.t = i18nDict[this.config.lang] || i18nDict['en'];

        // Update resolution scale in real-time
        this.config.res = parseInt(s.res || '1080', 10);

        // Walk-on
        this.config.posX = parseFloat(isVert ? s.v_x : s.x); 
        this.config.posY = parseFloat(isVert ? s.v_y : s.y); 
        this.config.scale = parseFloat(isVert ? s.v_scale : s.scale);
        this.config.alignH = (isVert ? (s.v_alignH ?? s.alignH) : s.alignH) === '1'; 
        this.config.alignV = (isVert ? (s.v_alignV ?? s.alignV) : s.alignV) === '1';
        
        this.config.noBg = s.noBg === '1'; 
        this.config.duration = parseInt(s.duration, 10) * 1000;
        this.config.cardAnim = s.cardAnim; this.config.avatarAnim = s.avatarAnim;
        this.config.showAvatar = s.showAvatar !== '0';
        this.config.showUser = s.showUser !== '0';
        this.config.showTier = s.showTier !== '0';
        
        // Alerts
        this.config.alertX = parseFloat(isVert ? s.v_ax : s.ax); 
        this.config.alertY = parseFloat(isVert ? s.v_ay : s.ay); 
        this.config.alertScale = parseFloat(isVert ? s.v_ascale : s.ascale);
        this.config.alertAlignH = (isVert ? (s.v_aAlignH ?? s.aAlignH) : s.aAlignH) === '1'; 
        this.config.alertAlignV = (isVert ? (s.v_aAlignV ?? s.aAlignV) : s.aAlignV) === '1';
        this.config.alertDuration = parseInt(s.aDur, 10) * 1000;
        this.config.alertDurations = {
          sub:          readAlertSeconds(s.ad_sub),
          member:       readAlertSeconds(s.ad_mem),
          milestone:    readAlertSeconds(s.ad_ms),
          gift:         readAlertSeconds(s.ad_gft),
          giftRec:      readAlertSeconds(s.ad_grc),
          superchat:    readAlertSeconds(s.ad_sc),
          supersticker: readAlertSeconds(s.ad_stk),
          jewels:       readAlertSeconds(s.ad_jwl)
        };
        this.config.alertsConfig = {
          sub:          s.al_sub !== '0',
          member:       s.al_mem !== '0',
          milestone:    s.al_ms  !== '0',
          gift:         s.al_gft !== '0',
          giftRec:      s.al_grc !== '0',
          superchat:    s.al_sc  !== '0',
          supersticker: s.al_stk !== '0',
          jewels:       s.al_jwl !== '0'
        };
        this.config.alertColors = {
          sub:          s.ac_sub || 'teal',
          member:       s.ac_mem || 'purple',
          milestone:    s.ac_ms  || 'purple',
          gift:         s.ac_gft || 'pink',
          giftRec:      s.ac_grc || 'teal',
          superchat:    s.ac_sc  || 'yellow',
          supersticker: s.ac_stk || 'yellow',
          jewels:       s.ac_jwl || 'yellow'
        };

        // Shoutout
        this.config.soTitle = s.soTitle || this.config.t.shoutout;
        this.config.soX = parseFloat(isVert ? s.v_soX : s.soX);
        this.config.soY = parseFloat(isVert ? s.v_soY : s.soY);
        this.config.soScale = parseFloat(isVert ? s.v_soScale : s.soScale);
        this.config.soAlignH = (isVert ? (s.v_soAlignH ?? s.soAlignH) : s.soAlignH) === '1';
        this.config.soAlignV = (isVert ? (s.v_soAlignV ?? s.soAlignV) : s.soAlignV) === '1';
        this.config.soDuration = parseInt(s.soDur || '5', 10) * 1000;
        this.config.soAnim = s.soAnim || 'so-roll';
        this.config.soLayout = s.soLayout || 'right';
        this.config.soColor = s.soColor || 'pink';
        this.config.soNoBg = s.soNoBg === '1';

        // Horizontal Chat
        this.config.chatX            = parseFloat(isVert ? s.v_chatX : s.chatX);
        this.config.chatY            = parseFloat(isVert ? s.v_chatY : s.chatY);
        this.config.chatW            = parseFloat(isVert ? s.v_chatW : s.chatW);
        this.config.chatScale        = parseFloat(isVert ? s.v_chatScale : s.chatScale);
        this.config.chatAlignH       = (isVert ? (s.v_chatAlignH ?? s.chatAlignH) : s.chatAlignH) === '1';
        this.config.chatAlignV       = (isVert ? (s.v_chatAlignV ?? s.chatAlignV) : s.chatAlignV) === '1';
        
        this.config.chatFontSize     = parseInt(s.chatFS || '20', 10);
        this.config.chatMaxMsgs      = parseInt(s.chatMax || '15', 10);
        this.config.chatHideAfter    = parseInt(s.chatHide || '0', 10);
        this.config.chatColorMember  = s.cMem || '#53d8bf';
        this.config.chatColorMod     = s.cMod || '#a688ff';
        this.config.chatColorViewer  = s.cView || '#fede9a';
        this.config.chatColorMsg     = s.cMsg || '#f0f4f8';
        this.config.chatBgColor      = s.cChatBg || s.cBg || '#303030';
        this.config.chatBgOpacity    = parseInt(s.chatBgOp || '88', 10);
        this.config.chatNoBg         = s.chatNoBg === '1';
        this.config.chatAccent       = s.chatAccent || 'teal';
        this.config.chatShowAvatars  = s.chatAv === '1';
        this.config.chatShowBadges   = s.chatBadges !== '0';
        this.config.chatUppercase    = s.chatUpper === '1';
        this.config.chatIgnoreCmds   = s.chatNoCmd !== '0';
        this.config.chatCmdPrefixes  = s.chatPrefixes || '!, #, /, $';
        this.config.chatIgnoreUsers  = s.chatIgUsers || '';

        // Q&A Highlight Toast
        this.config.qaTitle     = s.qaTitle || this.config.t.qa;
        this.config.qaX         = parseFloat(isVert ? s.v_qaX : s.qaX);
        this.config.qaY         = parseFloat(isVert ? s.v_qaY : s.qaY);
        this.config.qaScale     = parseFloat(isVert ? s.v_qaScale : s.qaScale);
        this.config.qaAlignH    = (isVert ? (s.v_qaAlignH ?? s.qaAlignH) : s.qaAlignH) === '1';
        this.config.qaAlignV    = (isVert ? (s.v_qaAlignV ?? s.qaAlignV) : s.qaAlignV) === '1';
        
        this.config.qaDuration  = parseInt(s.qaDur || '15', 10) * 1000;
        this.config.qaAnim      = s.qaAnim || 'qa-slide-up';
        this.config.qaColor     = s.qaColor || 'teal';
        this.config.qaShowBadge = s.qaShowBadge !== '0';
        this.config.qaNoBg      = s.qaNoBg === '1';
        this.config.goalsX = parseFloat(isVert ? s.v_goalsX : s.goalsX);
        if (!Number.isFinite(this.config.goalsX)) this.config.goalsX = isVert ? 60 : 1466;
        this.config.goalsY = parseFloat(isVert ? s.v_goalsY : s.goalsY);
        if (!Number.isFinite(this.config.goalsY)) this.config.goalsY = isVert ? 60 : 243;
        this.config.goalsScale = parseFloat(isVert ? s.v_goalsScale : s.goalsScale) || 1;
        this.config.goalsAlignH = (isVert ? (s.v_goalsAlignH ?? s.goalsAlignH) : s.goalsAlignH) === '1';
        this.config.goalsAlignV = (isVert ? (s.v_goalsAlignV ?? s.goalsAlignV) : s.goalsAlignV) === '1';
        this.config.goalsMode = s.goalsMode || 'ticker';
        this.config.goalsShowDur = parseInt(s.goalsShowDur || '10', 10) * 1000;
        this.config.goalsGapDur = parseInt(s.goalsGapDur || '1', 10) * 1000;
        this.config.goalsRepeatDelay = parseInt(s.goalsRepeatDelay || '30', 10) * 1000;
        this.config.goalsAnimIn = s.goalsAnimIn || 'zoom';
        this.config.goalsAnimOut = s.goalsAnimOut || 'slide-down';
        this.config.goalsColor = s.goalsColor || 'teal';
        this.config.goalsLikes = s.goalsLikes !== '0';
        this.config.goalsMembers = s.goalsMembers !== '0';
        this.config.goalsJewels = s.goalsJewels !== '0';
        this.config.goalsSubs = s.goalsSubs !== '0';
        this.config.goalsGifts = s.goalsGifts !== '0';
        this.config.goalsSupers = s.goalsSupers !== '0';
        this.config.goalsBg = s['goals-bg'] !== undefined ? s['goals-bg'] : (s.goalsBg !== undefined ? s.goalsBg : this.config.goalsBg);
        this.config.goalsLikesTitle = s.goalsLikesTitle || 'Likes';
        this.config.goalsLikesCount = s.goalsLikesCount || 'likesCount';
        this.config.goalsLikesGoal = s.goalsLikesGoal || 'LikesGoal';
        this.config.goalsMembersTitle = s.goalsMembersTitle || 'Memberships';
        this.config.goalsMembersCount = s.goalsMembersCount || 'memberCount';
        this.config.goalsMembersGoal = s.goalsMembersGoal || 'memberGoal';
        this.config.goalsJewelsTitle = s.goalsJewelsTitle || 'Jewels';
        this.config.goalsJewelsCount = s.goalsJewelsCount || 'jewelsCount';
        this.config.goalsJewelsGoal = s.goalsJewelsGoal || 'JewelsGoal';
        this.config.goalsSubsTitle = s.goalsSubsTitle || 'Subscribers';
        this.config.goalsSubsCount = s.goalsSubsCount || 'liveSubCount';
        this.config.goalsSubsGoal = s.goalsSubsGoal || 'liveSubGoal';
        this.config.goalsGiftsTitle = s.goalsGiftsTitle || 'Membership Gifts';
        this.config.goalsGiftsCount = s.goalsGiftsCount || 'membershipGiftsCount';
        this.config.goalsGiftsGoal = s.goalsGiftsGoal || 'membershipGiftsGoal';
        this.config.goalsSupersTitle = s.goalsSupersTitle || 'Super Chats/Stickers';
        this.config.goalsSupersCount = s.goalsSupersCount || 'superCount';
        this.config.goalsSupersGoal = s.goalsSupersGoal || 'superGoal';
        if (s.goalsCustom !== undefined) this.config.goalsCustom = parseGoalsCustom(s.goalsCustom);

        this.config.f5X = this.num(isVert ? s.v_f5X : s.f5X, 0);
        this.config.f5Y = this.num(isVert ? s.v_f5Y : s.f5Y, 0);
        this.config.f5AlignH = (isVert ? (s.v_f5AlignH ?? s.f5AlignH ?? '0') : (s.f5AlignH ?? '1')) === '1';
        this.config.f5AlignV = (isVert ? (s.v_f5AlignV ?? s.f5AlignV) : s.f5AlignV) === '1';
        this.config.f5InDir = s.f5InDir || 'right';
        this.config.f5InStyle = s.f5InStyle || 'roll';
        this.config.f5OutDir = s.f5OutDir || 'left';
        this.config.f5OutStyle = s.f5OutStyle || 'fade';
        this.config.f5Shape = s.f5Shape || 'rounded';
        this.config.f5Height = this.num(isVert ? s.v_f5Height : s.f5Height, isVert ? 200 : 1080);
        this.config.f5Size = this.num(isVert ? s.v_f5Size : s.f5Size, 80);
        this.config.f5GroupX = this.num(isVert ? s.v_f5GroupX : s.f5GroupX, 0);
        this.config.f5GroupY = this.num(isVert ? s.v_f5GroupY : s.f5GroupY, isVert ? 0 : 20);
        this.config.f5GroupCenterH = (isVert ? (s.v_f5GroupCenterH ?? s.f5GroupCenterH) : s.f5GroupCenterH) === '1';
        this.config.f5GroupCenterV = (isVert ? (s.v_f5GroupCenterV ?? s.f5GroupCenterV) : s.f5GroupCenterV) === '1';
        this.config.f5Gap = this.num(isVert ? s.v_f5Gap : s.f5Gap, isVert ? 12 : 30);
        this.config.f5Width = this.num(isVert ? s.v_f5Width : s.f5Width, isVert ? 1080 : 1920);
        this.config.f5Align = s.f5Align || 'center';
        this.config.f5EndDelay = parseInt(s.f5EndDelay || '60000', 10);
        this.config.f5Exit = s.f5Exit || 'left';
        this.config.f5Sfx = s.f5Sfx !== '0';
        this.config.f5SfxVol = parseInt(s.f5SfxVol || '57', 10);
        this.config.f5Color1 = s.f5Color1 || 'teal';
        this.config.f5Color2 = s.f5Color2 || 'pink';
        this.config.f5Color3 = s.f5Color3 || 'purple';
        this.config.f5Color4 = s.f5Color4 || 'yellow';
        this.config.f5Color5 = s.f5Color5 || 'yellow';
        if (this.config.previewMode && this.config.modules.first5) {
          if (!this.first5Avatars || this.first5Avatars.length === 0) this.showFirst5Placeholders();
          else this.renderFirst5();
        }
        
        this.config.fontHeading = s.fontHeading; this.config.fontBody = s.fontBody; this.config.bgUrl = s.bg || '';
        this.config.walkonBg = s['walkon-bg'] || s.walkonBg || 'global';
        this.config.soBg     = s['so-bg'] !== undefined ? s['so-bg'] : (s.soBg !== undefined ? s.soBg : 'assets/backgrounds/Palms-Vertical.webp');
        this.config.qaBg     = s['qa-bg']     || s.qaBg     || 'global';
        this.config.alertBg  = s['alert-bg']  || s.alertBg  || 'global';
        this.config.chatBg   = s['chat-bg'] !== undefined ? s['chat-bg'] : (s.chatBg !== undefined ? s.chatBg : 'assets/backgrounds/Ultimate.webp');
        this.config.bgOpacity = parseInt(s.bgOpacity || '65', 10);
        this.config.walkonBgOpacity = parseInt(s['walkon-bgOpacity'] || s.walkonBgOpacity || '65', 10);
        this.config.soBgOpacity = parseInt(s['so-bgOpacity'] || s.soBgOpacity || '65', 10);
        this.config.qaBgOpacity = parseInt(s['qa-bgOpacity'] || s.qaBgOpacity || '65', 10);
        this.config.alertBgOpacity = parseInt(s['alert-bgOpacity'] || s.alertBgOpacity || '65', 10);
        this.config.colors = { pink: s.cPink, teal: s.cTeal, purple: s.cPurple, yellow: s.cYellow, iconStroke: s.cStroke, border: s.cBorder, bgFill: s.cBg };
        
        try { this.config.stats = JSON.parse(s.stats); } catch (e) {}
        this.renderStatRows(this.lastWalkonData);
        this.applyGlobalStyles();
        const missingGoals = this.applyGoalGlobalsFromCache();
        if (missingGoals.length) this.refreshGoalGlobals();
      }
    });
  }

  num(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }

  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  // =====================================
  // MODULE 1: WALKON CARD PLAYBACK
  // =====================================
  enqueueWalkOn(data) {
    this.walkonQueue.push(data);
    if (!this.isWalkonAnimating) this.processWalkonQueue();
  }

  async processWalkonQueue() {
    if (this.walkonQueue.length === 0) {
      this.isWalkonAnimating = false;
      if (this.config.previewMode && this.dom.walkonContainer) { await this.wait(250); this.dom.walkonContainer.classList.add('animate-in'); }
      return;
    }
    this.isWalkonAnimating = true;
    const current = this.walkonQueue.shift();
    await this.playWalkOn(current);
    this.processWalkonQueue();
  }

  async playWalkOn(raw) {
    this.lastWalkonData = raw;
    if (this.dom.walkonContainer && this.dom.walkonContainer.classList.contains('animate-in')) {
      this.dom.walkonContainer.classList.remove('animate-in');
      await this.wait(450);
    }

    if (!this.dom.walkonContainer) return;

    const userName = this.getField(raw, 'userName', ['user', 'targetUser', 'displayName']) || 'ViceCityLegend';
    const avatarUrl = this.getField(raw, this.config.varAvatar, ['avatarUrl', 'userProfileUrl', 'avatar']) || DEFAULT_AVATAR_SVG;
    const levelName = this.getField(raw, this.config.varTier, ['levelName', 'tier', 'role']) || 'VIP Member';

    if (this.dom.avatar) this.dom.avatar.src = avatarUrl;
    if (this.dom.username) this.dom.username.textContent = userName;
    if (this.dom.tier) this.dom.tier.textContent = String(levelName).toUpperCase();
    
    this.renderStatRows(raw);
    
    if (this.dom.avatarWrap) {
      this.dom.avatarWrap.className = 'avatar-wrapper ' + this.config.avatarAnim;
    }

    void this.dom.walkonContainer.offsetWidth;
    this.dom.walkonContainer.classList.add('animate-in');
    await this.wait(this.config.duration);
    this.dom.walkonContainer.classList.remove('animate-in');
    await this.wait(650);
  }

  // =====================================
  // MODULE 2: ALERTS PLAYBACK
  // =====================================
  alertHoldMs(type) {
    const secs = this.config.alertDurations && this.config.alertDurations[type];
    if (Number.isFinite(secs) && secs > 0) return secs * 1000;
    return this.config.alertDuration;
  }

  enqueueAlert(data) {
    const t = data.alertType || 'generic';
    if (t !== 'generic' && this.config.alertsConfig[t] === false) return;
    
    this.alertQueue.push(data);
    if (!this.isAlertAnimating) this.processAlertQueue();
  }

  async processAlertQueue() {
    if (this.alertQueue.length === 0) {
      this.isAlertAnimating = false;
      if (this.config.previewMode && this.dom.alertContainer) { 
        await this.wait(250); 
        this.dom.alertContainer.classList.add('animate-in'); 
      }
      return;
    }
    this.isAlertAnimating = true;
    const current = this.alertQueue.shift();
    await this.playAlert(current);
    this.processAlertQueue();
  }

  async playAlert(raw) {
    if (this.dom.alertContainer && this.dom.alertContainer.classList.contains('animate-in')) {
      this.dom.alertContainer.classList.remove('animate-in');
      await this.wait(450);
    }
    
    if (!this.dom.alertContainer) return;

    const type = raw.alertType || 'sub';
    this.lastAlertType = type;
    this.dom.alertBox.className = `alert-box alert-${type}`;
    this.applyAlertAccentColor(type);

    const triggerName = this.getField(raw, 'triggerName') || 'New Event';
    const userName = this.getField(raw, 'userName', ['user']) || 'Username';
    const avatarUrl = this.getField(raw, 'userProfileUrl', ['avatarUrl']) || DEFAULT_AVATAR_SVG;
    
    const message = this.getField(raw, 'message');
    const amount = this.getField(raw, 'amount');
    const levelName = this.getField(raw, 'levelName');
    const count = this.getField(raw, 'count');
    const months = this.getField(raw, 'months');
    const gifterUser = this.getField(raw, 'gifterUser');
    const stickerUrl = this.getField(raw, 'stickerImageUrl');
    const jewelsAmount = this.getField(raw, 'jewelsAmount');
    const jewelsName = this.getField(raw, 'jewelsName');
    const jewelsUrl = this.getField(raw, 'jewelsUrl');

    document.getElementById('alert-event-name').textContent = triggerName;
    document.getElementById('alert-user-name').textContent = userName;
    
    const alertAv = document.getElementById('alert-avatar');
    if (alertAv) alertAv.src = avatarUrl;

    const bodyEl = document.getElementById('alert-body');
    bodyEl.innerHTML = '';

    const t = this.config.t || i18nDict.en;
    if (type === 'member' && levelName) {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.tier}</span><span class="alert-highlight">${levelName}</span></div>`;
    } else if (type === 'milestone') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.tenure}</span><span class="alert-highlight">${months} ${t.months}</span></div>`;
      if (levelName) bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.tier}</span><span class="alert-highlight">${levelName}</span></div>`;
    } else if (type === 'gift') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.gifted}</span><span class="alert-highlight">${count} ${t.memberships}</span></div>`;
    } else if (type === 'giftRec') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.from}</span><span class="alert-highlight">${gifterUser || t.anonymous}</span></div>`;
    } else if (type === 'superchat') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.amount}</span><span class="alert-highlight amount">${amount}</span></div>`;
    } else if (type === 'supersticker') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.amount}</span><span class="alert-highlight amount">${amount}</span></div>`;
      if (stickerUrl) bodyEl.innerHTML += `<div class="alert-media"><img src="${stickerUrl}" /></div>`;
    } else if (type === 'jewels') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.sent}</span><span class="alert-highlight amount">${jewelsAmount} ${t.jewels}</span></div>`;
      if (jewelsName) bodyEl.innerHTML += `<div class="alert-detail-row"><span>${t.gift}</span><span class="alert-highlight">${jewelsName}</span></div>`;
      if (jewelsUrl) bodyEl.innerHTML += `<div class="alert-media"><img src="${jewelsUrl}" /></div>`;
    }

    if (message) {
      const formatted = this.sanitizeAndFormatChatMessage(
        message,
        raw.emotes || raw.emoji,
        raw.parts || raw.messageParts,
        { uppercase: false }
      );
      bodyEl.innerHTML += `<div class="alert-message">${formatted}</div>`;
    }

    bodyEl.style.display = bodyEl.innerHTML === '' ? 'none' : 'flex';

    void this.dom.alertContainer.offsetWidth; 
    this.dom.alertContainer.classList.add('animate-in');
    
    await this.wait(this.alertHoldMs(type));
    this.dom.alertContainer.classList.remove('animate-in');
    await this.wait(600);
  }

  // =====================================
  // MODULE 3: SHOUTOUT TOAST PLAYBACK
  // =====================================
  enqueueShoutout(data) {
    if (data && data.timestamp && data.timestamp === this.lastShoutoutTs) return;
    if (data && data.timestamp) this.lastShoutoutTs = data.timestamp;

    this.shoutoutQueue.push(data);
    if (!this.isShoutoutAnimating) this.processShoutoutQueue();
  }

  async processShoutoutQueue() {
    if (this.shoutoutQueue.length === 0) {
      this.isShoutoutAnimating = false;
      if (this.config.previewMode && this.dom.shoutoutContainer) {
        await this.wait(250);
        this.dom.shoutoutContainer.classList.remove('animate-out');
        this.dom.shoutoutContainer.classList.add('animate-in');
      }
      return;
    }
    this.isShoutoutAnimating = true;
    const current = this.shoutoutQueue.shift();
    await this.playShoutout(current);
    this.processShoutoutQueue();
  }

  async playShoutout(raw) {
    if (!this.dom.shoutoutContainer) return;

    if (this.dom.shoutoutContainer.classList.contains('animate-in')) {
      this.dom.shoutoutContainer.classList.remove('animate-in');
      this.dom.shoutoutContainer.classList.add('animate-out');
      await this.wait(450);
    }

    const userName = this.getField(raw, 'user', ['userName', 'targetUser', 'displayName']) || 'LEONIDA_CREATOR';
    const avatarUrl = this.getField(raw, 'avatar', ['avatarUrl', 'userProfileUrl']) || DEFAULT_AVATAR_SVG;

    this.applyShoutoutAccentColor();
    if (this.dom.shoutoutTitle) {
      this.dom.shoutoutTitle.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${this.config.soTitle || this.config.t.shoutout}`;
    }
    if (this.dom.shoutoutName) {
      this.dom.shoutoutName.textContent = String(userName).toUpperCase();
    }
    if (this.dom.shoutoutAvatar) {
      this.dom.shoutoutAvatar.src = avatarUrl;
    }

    this.dom.shoutoutContainer.classList.remove('animate-out', 'animate-in');
    void this.dom.shoutoutContainer.offsetWidth;
    this.dom.shoutoutContainer.classList.add('animate-in');

    await this.wait(this.config.soDuration);

    this.dom.shoutoutContainer.classList.remove('animate-in');
    this.dom.shoutoutContainer.classList.add('animate-out');

    await this.wait(650);
  }

  // =====================================
  // MODULE 4: HORIZONTAL CHAT ENGINE
  // =====================================
  seedPreviewChatMessages() {
    const samples = [
      { userName: 'Lucia_Caminos', message: 'Vice City nights hit different!', role: 'member', avatar: 'https://i.pravatar.cc/120?img=47' },
      { userName: 'Jason_Leonida', message: 'Welcome everyone to the stream!', role: 'mod', avatar: 'https://i.pravatar.cc/120?img=12' },
      { userName: 'TommyV_86', message: 'Let\'s gooo!! Hype in the chat!', role: 'viewer', avatar: 'https://i.pravatar.cc/120?img=68' }
    ];
    samples.forEach(s => this.appendChatDomItem(s));
  }

  handleYouTubeChatEvent(d) {
    if (!d) return;
    const u = d.user || {};
    const userName = u.name || d.userName || d.user || 'YouTube User';
    const userId = u.id || d.userId || '';
    const message = d.message || d.rawInput || '';
    const isMod = Boolean(u.isModerator || u.isOwner || d.isModerator || d.isOwner);
    const isMember = Boolean(u.isSponsor || u.isMember || d.isSponsor || d.isMember);
    const emotes = d.emotes || [];
    const parts = d.parts || [];
    const avatar = u.profileImageUrl || d.userProfileUrl || '';
    const msgId = d.eventId || d.messageId || `yt-${Date.now()}`;

    this.handleIncomingChatMessage({
      userName,
      userId,
      message,
      role: isMod ? 'mod' : (isMember ? 'member' : 'viewer'),
      emotes,
      parts,
      avatar,
      msgId
    });
  }

  handleTwitchChatEvent(d) {
    if (!d) return;
    const userName = d.displayName || d.username || d.user || 'Twitch User';
    const userId = d.userId || d.user_id || '';
    const message = d.message || d.rawInput || '';
    const roleNum = parseInt(d.role || '1', 10);
    const isMod = Boolean(d.isModerator || roleNum >= 3);
    const isMember = Boolean(d.isSubscriber || d.isVip || roleNum === 2);
    const emotes = d.emotes || [];
    const avatar = d.avatarUrl || d.userProfileUrl || '';
    const msgId = d.msgId || `tw-${Date.now()}`;

    this.handleIncomingChatMessage({
      userName,
      userId,
      message,
      role: isMod ? 'mod' : (isMember ? 'member' : 'viewer'),
      emotes,
      avatar,
      msgId
    });
  }

  shouldFilterOutChatMessage(item) {
    const rawMsg = String(item.message || '').trim();
    if (!rawMsg) return true;

    // 1. Check Command Prefixes (!, #, /, etc.)
    if (this.config.chatIgnoreCmds) {
      const prefixes = (this.config.chatCmdPrefixes || '!, #, /')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      for (const prefix of prefixes) {
        if (rawMsg.startsWith(prefix)) return true;
      }
    }

    // 2. Check Ignored Users (by Name or Channel ID)
    const ignoredUsers = (this.config.chatIgnoreUsers || '')
      .split(',')
      .map(u => u.trim().toLowerCase())
      .filter(Boolean);
    if (ignoredUsers.length > 0) {
      const uNameLower = String(item.userName || '').trim().toLowerCase();
      const uIdLower = String(item.userId || '').trim().toLowerCase();
      if ((uNameLower && ignoredUsers.includes(uNameLower)) ||
          (uIdLower && ignoredUsers.includes(uIdLower))) {
        return true;
      }
    }

    return false;
  }

  escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;'
    }[ch]));
  }

  emoteImageUrl(em) {
    if (!em || typeof em !== 'object') return '';
    return em.imageUrl || em.url || em.image || (em.images && (em.images[0]?.url || em.images.url)) || '';
  }

  wrapEmojiChars(escaped) {
    const source = String(escaped ?? '');
    if (!source) return '';
    if (!this._emojiSeg && typeof Intl !== 'undefined' && Intl.Segmenter) {
      this._emojiSeg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    }
    const isEmoji = (g) => /\p{Extended_Pictographic}/u.test(g);
    let out = '';
    let prevEmoji = false;
    if (this._emojiSeg) {
      for (const part of this._emojiSeg.segment(source)) {
        const g = part.segment;
        if (isEmoji(g)) {
          if (prevEmoji) out += '\u200B';
          out += `<span class="emoji-char">${g}</span>`;
          prevEmoji = true;
        } else {
          out += g;
          prevEmoji = false;
        }
      }
      return out;
    }
    return source.replace(/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\u200D\p{Extended_Pictographic})*/gu, (g) => `<span class="emoji-char">${g}</span>`)
      .replace(/<\/span><span class="emoji-char">/g, '</span>\u200B<span class="emoji-char">');
  }

  applyMemberEmojiMap(raw) {
    let value = raw;
    if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value && ('lastWrite' in value || 'name' in value)) {
      value = value.value;
    }
    for (let i = 0; i < 2 && typeof value === 'string'; i++) {
      const trimmed = value.trim();
      if (!trimmed) { value = {}; break; }
      try { value = JSON.parse(trimmed); } catch (e) { value = {}; break; }
    }
    const map = {};
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(k => {
        const url = value[k];
        if (!k || typeof url !== 'string') return;
        const clean = url.trim();
        if (/^https?:\/\//i.test(clean)) map[k] = clean;
      });
    }
    this.memberEmojiMap = map;
    this._memberEmojiKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  }

  splitMemberEmoji(raw) {
    const text = String(raw ?? '');
    const keys = this._memberEmojiKeys || [];
    if (!keys.length || !text) return [{ type: 'text', text }];
    const out = [];
    let buf = '';
    let i = 0;
    while (i < text.length) {
      let hit = '';
      if (text.charCodeAt(i) === 58) {
        for (let k = 0; k < keys.length; k++) {
          if (text.startsWith(keys[k], i)) { hit = keys[k]; break; }
        }
      }
      if (hit) {
        if (buf) { out.push({ type: 'text', text: buf }); buf = ''; }
        out.push({ type: 'emote', url: this.memberEmojiMap[hit] });
        i += hit.length;
      } else {
        buf += text.charAt(i);
        i += 1;
      }
    }
    if (buf) out.push({ type: 'text', text: buf });
    return out;
  }

  formatTextSegment(text, opts) {
    const forceUpper = opts && Object.prototype.hasOwnProperty.call(opts, 'uppercase')
      ? Boolean(opts.uppercase)
      : Boolean(this.config.chatUppercase);
    const chunks = this.splitMemberEmoji(text);
    return chunks.map(chunk => {
      if (chunk.type === 'emote') {
        return `<img class="emote" alt="" src="${this.escapeHtml(chunk.url)}" />`;
      }
      let s = chunk.text;
      if (forceUpper) s = s.toUpperCase();
      const re = /https?:\/\/(?:yt3\.ggpht\.com|yt3\.googleusercontent\.com|static-cdn\.jtvnw\.net|cdn\.betterttv\.net|cdn\.frankerfacez\.com|cdn\.7tv\.app|7tv\.io)\/(?:(?!https?:\/\/)[^\s<])+/g;
      let html = '';
      let last = 0;
      let match;
      while ((match = re.exec(s))) {
        html += this.wrapEmojiChars(this.escapeHtml(s.slice(last, match.index)));
        html += `<img class="emote" alt="" src="${this.escapeHtml(match[0])}" />`;
        last = match.index + match[0].length;
      }
      html += this.wrapEmojiChars(this.escapeHtml(s.slice(last)));
      return html;
    }).join('');
  }

  sanitizeAndFormatChatMessage(text, emotes, parts, opts) {
    let partList = parts;
    if (typeof partList === 'string') {
      try { partList = JSON.parse(partList); } catch (e) { partList = null; }
    }
    if (Array.isArray(partList) && partList.some(p => p && (p.image || p.imageUrl || p.emoji || p.type === 'emote' || p.type === 'emoji'))) {
      return partList.map(p => {
        if (!p || typeof p !== 'object') return '';
        const url = this.emoteImageUrl(p);
        const isEmote = Boolean(url) && (p.emoji || p.image || p.imageUrl || p.type === 'emote' || p.type === 'emoji');
        if (isEmote) return `<img class="emote" alt="" src="${this.escapeHtml(url)}" />`;
        return this.formatTextSegment(p.text || '', opts);
      }).join('');
    }

    let list = emotes;
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch (e) { list = []; }
    }
    if (!Array.isArray(list)) list = [];
    const raw = String(text || '');
    const usable = list.map(em => {
      const url = this.emoteImageUrl(em);
      const start = Number(em && em.startIndex);
      if (!url || !Number.isFinite(start)) return null;
      return { url, start, end: Number(em.endIndex), name: String((em && (em.name || em.text)) || '') };
    }).filter(Boolean).sort((a, b) => a.start - b.start);

    if (!usable.length) return this.formatTextSegment(raw, opts);

    let html = '';
    let cursor = 0;
    for (const em of usable) {
      let start = em.start < cursor ? cursor : em.start;
      let endExclusive = Number.isFinite(em.end) ? em.end + 1 : start;
      if (em.name && start >= 0 && start <= raw.length) {
        const incl = raw.substring(start, Number.isFinite(em.end) ? em.end + 1 : start);
        const excl = raw.substring(start, Number.isFinite(em.end) ? em.end : start);
        if (incl !== em.name && excl === em.name) endExclusive = em.end;
        else if (incl !== em.name && em.name && raw.substring(start, start + em.name.length) === em.name) endExclusive = start + em.name.length;
      }
      if (endExclusive < start) endExclusive = start;
      if (start > raw.length) break;
      if (start > cursor) html += this.formatTextSegment(raw.substring(cursor, start), opts);
      html += `<img class="emote" alt="" src="${this.escapeHtml(em.url)}" />`;
      cursor = Math.min(raw.length, Math.max(cursor, endExclusive));
    }
    if (cursor < raw.length) html += this.formatTextSegment(raw.substring(cursor), opts);
    return html;
  }

  handleIncomingChatMessage(raw) {
    const normalized = {
      userName: raw.userName || raw.user || raw.displayName || 'Viewer',
      userId:   raw.userId || raw.id || '',
      message:  raw.message !== undefined ? raw.message : (raw.rawInput || ''),
      role:     raw.role || (raw.isModerator ? 'mod' : (raw.isSponsor || raw.isMember ? 'member' : 'viewer')),
      emotes:   raw.emotes || [],
      parts:    raw.parts || [],
      avatar:   raw.avatar || raw.userProfileUrl || raw.avatarUrl || '',
      msgId:    raw.msgId || raw.messageId || `msg-${Date.now()}-${++this.chatMsgCounter}`
    };

    if (this.shouldFilterOutChatMessage(normalized)) return;
    this.appendChatDomItem(normalized);
  }

  appendChatDomItem(item) {
    if (!this.dom.chatTrack) return;

    const el = document.createElement('div');
    el.className = 'chat-item';
    if (item.msgId) el.dataset.msgid = item.msgId;
    if (item.userId) el.dataset.sender = item.userId;

    let uName = String(item.userName || 'Viewer').trim();
    let msgText = String(item.message || '').trim();
    if (this.config.chatUppercase) uName = uName.toUpperCase();

    const roleClass = item.role === 'mod' ? 'role-mod' : (item.role === 'member' ? 'role-member' : 'role-viewer');

    let avatarHtml = '';
    if (this.config.chatShowAvatars && item.avatar) {
      avatarHtml = `<img class="chat-avatar" src="${item.avatar}" alt="" onerror="this.style.display='none'" />`;
    }

    let badgeHtml = '';
    if (this.config.chatShowBadges) {
      if (item.role === 'mod') {
        badgeHtml = `<i class="fa-solid fa-wrench chat-badge-icon" style="color:var(--chat-color-mod)"></i>`;
      } else if (item.role === 'member') {
        badgeHtml = `<i class="fa-solid fa-crown chat-badge-icon" style="color:var(--chat-color-member)"></i>`;
      }
    }

    const formattedMsg = this.sanitizeAndFormatChatMessage(msgText, item.emotes, item.parts);

    el.innerHTML = `
      ${avatarHtml}
      ${badgeHtml}
      <span class="chat-user ${roleClass}">${uName}:</span>
      <span class="chat-msg">${formattedMsg}</span>
      <span class="chat-sep">•</span>
    `;

    this.dom.chatTrack.appendChild(el);

    // Slide out oldest messages on the left when exceeding chatMaxMsgs
    const maxMsgs = Math.max(3, this.config.chatMaxMsgs || 15);
    while (this.dom.chatTrack.children.length > maxMsgs) {
      const oldest = this.dom.chatTrack.firstElementChild;
      if (oldest) oldest.remove();
    }

    // Optional auto-hide timer per message
    if (this.config.chatHideAfter > 0 && !this.config.previewMode) {
      setTimeout(() => {
        if (el.parentNode) {
          el.classList.add('removing');
          setTimeout(() => el.remove(), 350);
        }
      }, this.config.chatHideAfter * 1000);
    }
  }

  removeChatMessageById(msgId) {
    if (!this.dom.chatTrack) return;
    const target = this.dom.chatTrack.querySelector(`[data-msgid="${msgId}"]`);
    if (target) target.remove();
  }

  removeChatMessagesByUser(userId) {
    if (!this.dom.chatTrack) return;
    this.dom.chatTrack.querySelectorAll(`[data-sender="${userId}"]`).forEach(el => el.remove());
  }

  // =====================================
  // MODULE 5: Q&A / CHAT HIGHLIGHT PLAYBACK
  // =====================================
  enqueueQA(data) {
    if (data && data.timestamp && data.timestamp === this.lastQATs) return;
    if (data && data.timestamp) this.lastQATs = data.timestamp;

    this.qaQueue.push(data);
    if (!this.isQAAnimating) this.processQAQueue();
  }

  async processQAQueue() {
    if (this.qaQueue.length === 0) {
      this.isQAAnimating = false;
      if (this.config.previewMode && this.dom.qaContainer) {
        await this.wait(250);
        this.dom.qaContainer.classList.remove('animate-out');
        this.dom.qaContainer.classList.add('animate-in');
      }
      return;
    }
    this.isQAAnimating = true;
    const current = this.qaQueue.shift();
    await this.playQA(current);
    this.processQAQueue();
  }

  async playQA(raw) {
    if (!this.dom.qaContainer) return;

    if (this.dom.qaContainer.classList.contains('animate-in')) {
      this.dom.qaContainer.classList.remove('animate-in');
      this.dom.qaContainer.classList.add('animate-out');
      await this.wait(450);
    }

    const userName = this.getField(raw, 'user', ['userName', 'targetUser', 'displayName']) || 'LEONIDA_VIEWER';
    const message  = this.getField(raw, 'msg', ['message', 'rawInput', 'text']) || '';
    const avatarUrl = this.getField(raw, 'avatar', ['avatarUrl', 'userProfileUrl', 'profileImageUrl']) || DEFAULT_AVATAR_SVG;

    this.applyQAAccentColor();

    if (this.dom.qaUsername) {
      this.dom.qaUsername.textContent = String(userName).toUpperCase();
    }
    if (this.dom.qaMessage) {
      const emotes = raw.emotes || raw.emoji || [];
      const parts = raw.parts || raw.messageParts || [];
      this.dom.qaMessage.innerHTML = this.sanitizeAndFormatChatMessage(message, emotes, parts, { uppercase: false });
    }
    if (this.dom.qaAvatar) {
      this.dom.qaAvatar.src = avatarUrl;
    }
    if (this.dom.qaBadge) {
      this.dom.qaBadge.style.display = this.config.qaShowBadge ? 'inline-flex' : 'none';
      this.dom.qaBadge.innerHTML = `<i class="fa-solid fa-comments"></i> ${this.config.qaTitle || this.config.t.qa}`;
    }

    this.dom.qaContainer.classList.remove('animate-out', 'animate-in');
    void this.dom.qaContainer.offsetWidth;
    this.dom.qaContainer.classList.add('animate-in');

    await this.wait(this.config.qaDuration);

    this.dom.qaContainer.classList.remove('animate-in');
    this.dom.qaContainer.classList.add('animate-out');

    await this.wait(650);
  }

  recalculateGoalsCoords(baseW, baseH) {
    if (!this.dom.goalsContainer) return;
    const scale = this.config.goalsScale || 1;
    const w = this.dom.goalsContainer.offsetWidth || 380;
    const h = this.dom.goalsContainer.offsetHeight || 180;
    const maxX = Math.max(0, baseW - (w * scale));
    const maxY = Math.max(0, baseH - (h * scale));
    if (this.config.goalsAlignH) this.config.goalsX = Math.round(maxX / 2);
    else this.config.goalsX = Math.round(Math.max(0, Math.min(maxX, this.config.goalsX)));
    if (this.config.goalsAlignV) this.config.goalsY = Math.round(maxY / 2);
    else this.config.goalsY = Math.round(Math.max(0, Math.min(maxY, this.config.goalsY)));
  }

  recalculateFirst5Coords(baseW, baseH) {
    if (!this.dom.first5Container) return;
    const w = this.config.f5Width || this.dom.first5Container.offsetWidth || 200;
    const h = this.config.f5Height || this.dom.first5Container.offsetHeight || 100;
    const maxX = Math.max(0, baseW - w);
    const maxY = Math.max(0, baseH - h);
    if (this.config.f5AlignH) this.config.f5X = Math.round(maxX / 2);
    else this.config.f5X = Math.round(Math.max(0, Math.min(maxX, this.config.f5X)));
    if (this.config.f5AlignV) this.config.f5Y = Math.round(maxY / 2);
    else this.config.f5Y = Math.round(Math.max(0, Math.min(maxY, this.config.f5Y)));
  }

  enqueueFirst5(data) {
    if (!this.dom.first5Row) return;
    if (!this.first5Avatars) this.first5Avatars = [];
    const avatar = data.avatar || data.avatarUrl || data.userProfileUrl || DEFAULT_AVATAR_SVG;
    const name = data.user || data.userName || data.displayName || '';
    if (this.first5Avatars.length >= 5) return;
    this.first5Avatars.push({ avatar, name });
    this.renderFirst5();
    if (this.config.f5Sfx) {
      const audio = new Audio('assets/sfx/platinum.mp3');
      audio.volume = Math.max(0, Math.min(100, this.config.f5SfxVol || 80)) / 100;
      audio.play().catch(() => {});
    }
  }

  renderFirst5() {
    if (!this.dom.first5Row) return;
    if (!this.first5Avatars) this.first5Avatars = [];
    const colors = [this.config.f5Color1, this.config.f5Color2, this.config.f5Color3, this.config.f5Color4, this.config.f5Color5];
    const row = this.dom.first5Row;
    while (row.children.length > this.first5Avatars.length) row.removeChild(row.lastChild);
    for (let i = 0; i < this.first5Avatars.length; i++) {
      const item = this.first5Avatars[i];
      let img = row.children[i];
      const isNew = !img;
      if (!img) {
        img = document.createElement('img');
        row.appendChild(img);
      }
      const tokens = this.resolveAccentTokens(colors[i] || 'pink');
      img.style.setProperty('--f5-accent', tokens.accent);
      img.style.setProperty('--f5-glow', tokens.glow);
      if (img.getAttribute('src') !== item.avatar) img.src = item.avatar;
      img.alt = item.name || '';
      img.onerror = () => { if (img.src !== DEFAULT_AVATAR_SVG) img.src = DEFAULT_AVATAR_SVG; };
      img.classList.remove('shape-circle', 'shape-rounded');
      img.classList.add('first5-avatar', 'shape-' + (this.config.f5Shape || 'rounded'));
      if (isNew) {
        const dir = this.config.f5InDir === 'random' ? ['left','right','top','bottom'][Math.floor(Math.random()*4)] : this.config.f5InDir;
        const style = this.config.f5InStyle || 'slide';
        const animClass = (style === 'zoom' || style === 'fade') ? `in-${style}` : `in-${dir}-${style}`;
        img.classList.add(animClass);
      }
    }
    row.className = `first5-row align-${this.config.f5Align || 'center'}`;
    if (this.first5Avatars.length > 0 && this.dom.first5Container) {
      this.dom.first5Container.classList.add('animate-in');
      this.dom.first5Container.classList.remove('animate-out');
    }
    if (!this.config.previewMode && this.first5Avatars.length >= 5 && this.config.f5EndDelay > 0) {
      clearTimeout(this._f5ExitTimer);
      this._f5ExitTimer = setTimeout(() => this.exitFirst5(), this.config.f5EndDelay);
    }
    // Recenter the row for the avatars that are actually on screen.
    // OBS used to center a single slot, then grow the rest to the right.
    this.updateDomCoords();
  }

  exitFirst5() {
    if (!this.dom.first5Container || !this.dom.first5Row) return;
    const dir = this.config.f5OutDir === 'random' ? ['left','right','top','bottom'][Math.floor(Math.random()*4)] : this.config.f5OutDir;
    const style = this.config.f5OutStyle || 'fade';
    const animClass = (style === 'zoom' || style === 'fade') ? `out-${style}` : `out-${dir}-${style}`;
    Array.from(this.dom.first5Row.children).forEach(img => {
      img.className = img.className.replace(/\bin-\S+/g, '').replace(/\bout-\S+/g, '');
      img.classList.add(animClass);
    });
    setTimeout(() => {
      this.first5Avatars = [];
      if (this.dom.first5Row) this.dom.first5Row.innerHTML = '';
      this.dom.first5Container.classList.remove('animate-in');
    }, 500);
  }

  clearFirst5() {
    this.first5Avatars = [];
    clearTimeout(this._f5ExitTimer);
    if (this.dom.first5Container) this.dom.first5Container.classList.remove('animate-in');
    if (this.dom.first5Row) this.dom.first5Row.innerHTML = '';
  }

  stopGoalsTicker(showAll) {
    if (this._goalsTickerTimer) clearTimeout(this._goalsTickerTimer);
    this._goalsTickerTimer = null;
    this._goalsTickerGen = (this._goalsTickerGen || 0) + 1;
    this.clearGoalsWidgetMotion();
    if (showAll && this.dom.goalsInner) {
      this.dom.goalsInner.querySelectorAll('.goal-bar').forEach(b => { b.style.display = ''; });
    }
  }

  goalsMotionClasses() {
    return ['widget-in-slide-up','widget-in-fade','widget-in-zoom','widget-out-slide-down','widget-out-fade','widget-out-zoom','widget-hidden'];
  }

  clearGoalsWidgetMotion() {
    if (!this.dom.goalsInner) return;
    this.dom.goalsInner.classList.remove(...this.goalsMotionClasses());
  }

  playGoalsWidgetAnim(phase) {
    const el = this.dom.goalsInner;
    if (!el) return;
    const raw = phase === 'in' ? (this.config.goalsAnimIn || 'zoom') : (this.config.goalsAnimOut || 'slide-down');
    const cls = (phase === 'in' ? 'widget-in-' : 'widget-out-') + raw;
    el.classList.remove(...this.goalsMotionClasses());
    void el.offsetWidth;
    el.classList.add(cls);
  }

  startGoalsTicker() {
    this.stopGoalsTicker(false);
    if (!this.dom.goalsInner) return;
    const bars = Array.from(this.dom.goalsInner.querySelectorAll('.goal-bar'));
    if (bars.length === 0) return;
    const gen = this._goalsTickerGen;
    let idx = 0;
    const alive = () => gen === this._goalsTickerGen;
    const animMs = 480;
    const showCurrent = () => {
      if (!alive()) return;
      bars.forEach((b, i) => { b.style.display = i === idx ? '' : 'none'; });
      this.playGoalsWidgetAnim('in');
      const hold = animMs + (this.config.goalsShowDur || 10000);
      this._goalsTickerTimer = setTimeout(() => {
        if (!alive()) return;
        this.playGoalsWidgetAnim('out');
        this._goalsTickerTimer = setTimeout(() => {
          if (!alive()) return;
          if (this.dom.goalsInner) {
            this.dom.goalsInner.classList.remove(...this.goalsMotionClasses());
            this.dom.goalsInner.classList.add('widget-hidden');
          }
          const isLast = idx === bars.length - 1;
          const gap = isLast ? (this.config.goalsRepeatDelay || 0) : (this.config.goalsGapDur || 0);
          idx = (idx + 1) % bars.length;
          this._goalsTickerTimer = setTimeout(showCurrent, gap);
        }, animMs);
      }, hold);
    };
    showCurrent();
  }

  goalVarNames() {
    const vars = [
      this.config.goalsLikesCount, this.config.goalsLikesGoal,
      this.config.goalsMembersCount, this.config.goalsMembersGoal,
      this.config.goalsJewelsCount, this.config.goalsJewelsGoal,
      this.config.goalsSubsCount, this.config.goalsSubsGoal,
      this.config.goalsGiftsCount, this.config.goalsGiftsGoal,
      this.config.goalsSupersCount, this.config.goalsSupersGoal
    ];
    (this.config.goalsCustom || []).forEach(g => {
      if (g.count) vars.push(g.count);
      if (g.goal) vars.push(g.goal);
    });
    return vars.filter(Boolean);
  }

  isGoalVar(name) {
    return this.goalVarNames().includes(name);
  }

  rememberGlobals(vars) {
    const map = this.normalizeGlobals(vars);
    if (!this._globalCache) this._globalCache = {};
    Object.keys(map).forEach(k => {
      const value = this.unwrapGlobal(map[k]);
      if (value === undefined || value === null || value === '') return;
      this._globalCache[k] = value;
    });
  }

  normalizeGlobals(raw) {
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const out = {};
      raw.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const name = item.name || item.variable || item.key;
        if (!name) return;
        out[name] = Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : item;
      });
      return out;
    }
    return raw;
  }

  applyGoalGlobalsFromCache() {
    if (!this.goalsData) this.goalsData = {};
    const missing = [];
    let hit = false;
    this.goalVarNames().forEach(name => {
      if (!this._globalCache || !Object.prototype.hasOwnProperty.call(this._globalCache, name)) {
        missing.push(name);
        return;
      }
      this.goalsData[name] = this._globalCache[name];
      hit = true;
    });
    if (hit) {
      this._goalsPreviewSeeded = false;
      this.syncGoalsView();
    }
    return missing;
  }

  async refreshGoalGlobals() {
    if (this.client && typeof this.client.getGlobals === 'function') {
      const [persisted, temporary] = await Promise.all([
        this.client.getGlobals(true).catch(() => null),
        this.client.getGlobals(false).catch(() => null)
      ]);
      this.rememberGlobals(persisted && persisted.variables);
      this.rememberGlobals(temporary && temporary.variables);
    }
    this.applyGoalGlobalsFromCache();
  }

  unwrapGlobal(entry) {
    if (entry && typeof entry === 'object' && 'value' in entry) return entry.value;
    return entry;
  }

  updateGoalsFromGlobals(vars) {
    if (!vars || !this.goalsData) this.goalsData = this.goalsData || {};
    let hit = false;
    Object.keys(vars || {}).forEach(k => {
      if (!this.isGoalVar(k)) return;
      this.goalsData[k] = this.unwrapGlobal(vars[k]);
      hit = true;
    });
    if (hit) this._goalsPreviewSeeded = false;
    this.syncGoalsView();
  }

  seedPreviewGoals() {
    if (!this.config.previewMode || this._goalsPreviewSeeded === false) return;
    const samples = [
      [this.config.goalsLikesCount, 1280, this.config.goalsLikesGoal, 5000],
      [this.config.goalsMembersCount, 42, this.config.goalsMembersGoal, 100],
      [this.config.goalsJewelsCount, 860, this.config.goalsJewelsGoal, 2000],
      [this.config.goalsSubsCount, 310, this.config.goalsSubsGoal, 1000],
      [this.config.goalsGiftsCount, 18, this.config.goalsGiftsGoal, 50],
      [this.config.goalsSupersCount, 12, this.config.goalsSupersGoal, 40]
    ];
    (this.config.goalsCustom || []).forEach((g, i) => {
      if (g.count && g.goal) samples.push([g.count, (i + 1) * 15, g.goal, 100]);
    });
    const hasLive = samples.some(([c]) => this.goalsData[c] !== undefined && this.goalsData[c] !== '');
    if (hasLive) return;
    samples.forEach(([c, cv, g, gv]) => {
      this.goalsData[c] = cv;
      this.goalsData[g] = gv;
    });
    this._goalsPreviewSeeded = true;
  }

  syncGoalsView() {
    const rebuilt = this.renderGoals();
    if (this.config.goalsMode !== 'ticker') {
      this._goalsTickerKey = '';
      this.stopGoalsTicker(true);
      return;
    }
    const key = [this.config.goalsShowDur, this.config.goalsGapDur, this.config.goalsRepeatDelay, this.config.goalsAnimIn, this.config.goalsAnimOut].join('|');
    if (rebuilt || !this._goalsTickerTimer || this._goalsTickerKey !== key) {
      this._goalsTickerKey = key;
      this.startGoalsTicker();
    }
  }

  parseGoalNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value == null) return NaN;
    let s = String(value).trim();
    if (!s) return NaN;
    let neg = false;
    if (s.charAt(0) === '-') { neg = true; s = s.slice(1).trim(); }
    s = s.replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (lastComma >= 0) {
      const bits = s.split(',');
      if (bits.length === 2 && bits[1].length === 2) s = bits[0].replace(/\./g, '') + '.' + bits[1];
      else s = s.replace(/,/g, '');
    } else if ((s.match(/\./g) || []).length > 1) {
      s = s.replace(/\./g, '');
    }
    const n = Number(s);
    if (!Number.isFinite(n)) return NaN;
    return neg ? -n : n;
  }

  formatGoalAmount(raw, num) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed && /[^\d\s.,-]/.test(trimmed)) return trimmed;
    }
    const n = Number.isFinite(num) ? num : 0;
    return n.toLocaleString();
  }

  renderGoals() {
    if (!this.dom.goalsInner) return false;
    if (!this.goalsData) this.goalsData = {};
    const bars = [];
    const add = (enabled, title, countVar, goalVar) => {
      if (!enabled || !countVar || !goalVar) return;
      const rawCurrent = this.goalsData[countVar];
      const current = this.parseGoalNumber(rawCurrent);
      const currentNum = Number.isFinite(current) ? current : 0;
      const rawTarget = this.goalsData[goalVar];
      const missingTarget = rawTarget === undefined || rawTarget === '';
      const parsedTarget = this.parseGoalNumber(rawTarget);
      const target = missingTarget ? 100 : (Number.isFinite(parsedTarget) ? parsedTarget : 0);
      const pct = target > 0 ? Math.min((currentNum / target) * 100, 100) : 0;
      const label = `${this.formatGoalAmount(rawCurrent, currentNum)} / ${this.formatGoalAmount(missingTarget ? 100 : rawTarget, target)}`;
      bars.push({ title, current: currentNum, target, pct, countVar, label });
    };
    add(this.config.goalsLikes, this.config.goalsLikesTitle, this.config.goalsLikesCount, this.config.goalsLikesGoal);
    add(this.config.goalsMembers, this.config.goalsMembersTitle, this.config.goalsMembersCount, this.config.goalsMembersGoal);
    add(this.config.goalsJewels, this.config.goalsJewelsTitle, this.config.goalsJewelsCount, this.config.goalsJewelsGoal);
    add(this.config.goalsSubs, this.config.goalsSubsTitle, this.config.goalsSubsCount, this.config.goalsSubsGoal);
    add(this.config.goalsGifts, this.config.goalsGiftsTitle, this.config.goalsGiftsCount, this.config.goalsGiftsGoal);
    add(this.config.goalsSupers, this.config.goalsSupersTitle, this.config.goalsSupersCount, this.config.goalsSupersGoal);
    (this.config.goalsCustom || []).forEach(g => add(g.on, g.title, g.count, g.goal));
    const signature = bars.map(b => b.title + '\u0002' + b.countVar).join('\u0001');
    const inner = this.dom.goalsInner;
    const existing = inner.querySelectorAll('.goal-bar');
    if (this.dom.goalsContainer) this.dom.goalsContainer.classList.toggle('ticker', this.config.goalsMode === 'ticker');
    if (inner.dataset.signature === signature && existing.length === bars.length) {
      bars.forEach((b, i) => {
        const el = existing[i];
        const spans = el.querySelectorAll('.goal-bar-label span');
        if (spans[0]) spans[0].textContent = b.title;
        if (spans[1]) spans[1].textContent = b.label;
        const fill = el.querySelector('.goal-bar-fill');
        if (fill) fill.style.width = b.pct + '%';
      });
      return false;
    }
    inner.dataset.signature = signature;
    inner.innerHTML = bars.map(b => `
      <div class="goal-bar">
        <div class="goal-bar-label"><span>${this.escapeHtml(b.title)}</span><span>${this.escapeHtml(b.label)}</span></div>
        <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${b.pct}%"></div></div>
      </div>
    `).join('');
    return true;
  }

  showFirst5Placeholders() {
    this.first5Avatars = [
      {avatar:DEFAULT_AVATAR_SVG,name:'User 1'},
      {avatar:DEFAULT_AVATAR_SVG,name:'User 2'},
      {avatar:DEFAULT_AVATAR_SVG,name:'User 3'},
      {avatar:DEFAULT_AVATAR_SVG,name:'User 4'},
      {avatar:DEFAULT_AVATAR_SVG,name:'User 5'}
    ];
    if (this.dom.first5Row) this.dom.first5Row.innerHTML = '';
    this.renderFirst5();
  }

  setupFirst5GroupDrag() {
    if (!this.dom.first5Row) return;
    let dragging = false, startX, startY, startGroupX, startGroupY;
    this.dom.first5Row.style.cursor = 'grab';
    const begin = (e) => {
      if (!this.config.previewMode) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startGroupX = this.config.f5GroupX; startGroupY = this.config.f5GroupY;
      this.dom.first5Row.style.cursor = 'grabbing';
      this.dom.first5Row.style.transition = 'none';
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    };
    this.dom.first5Row.addEventListener('pointerdown', begin);
    this.dom.first5Row.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const canvasScale = parseFloat(document.documentElement.style.getPropertyValue('--canvas-scale') || '1') || 1;
      const dx = (e.clientX - startX) / canvasScale;
      const dy = (e.clientY - startY) / canvasScale;
      const count = Math.max(1, this.first5Avatars.length || 1);
      const groupW = (this.config.f5Size * count) + (this.config.f5Gap * Math.max(0, count - 1));
      const maxX = Math.max(0, this.config.f5Width - groupW);
      const maxY = Math.max(0, this.config.f5Height - this.config.f5Size);
      this.config.f5GroupX = Math.round(Math.max(0, Math.min(maxX, startGroupX + dx)));
      this.config.f5GroupY = Math.round(Math.max(0, Math.min(maxY, startGroupY + dy)));
      this.config.f5GroupCenterH = false;
      this.config.f5GroupCenterV = false;
      document.documentElement.style.setProperty('--f5-group-x', this.config.f5GroupX + 'px');
      document.documentElement.style.setProperty('--f5-group-y', this.config.f5GroupY + 'px');
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      this.dom.first5Row.style.cursor = 'grab';
      this.dom.first5Row.style.transition = '';
      this.broadcastManipulate('first5');
    });
  }

}


document.addEventListener('DOMContentLoaded', () => {
  window.gtaOverlay = new GTAOverlayEngine(GTAOverlayConfig);
});
