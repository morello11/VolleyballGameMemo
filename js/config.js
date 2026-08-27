// TÜM ayar sayıları burada yaşar; oyun hissine göre buradan ayarlanır.
// Saha mantıksal genişliği 800 birim (ekrana ölçeklenir), zemin y=0 kabul.

export const CONFIG = {
  // Saha
  fieldWidth: 800,

  // Boyutlar
  slimeRadius: 50, // çap = yarı sahanın %25'i — sayı atma zorluğunun ana ayarı
  ballRadius: 20,
  netHeight: 140,
  netWidth: 8,

  // Fizik
  gravity: 1500,
  jumpSpeed: 750,
  moveSpeed: 400,
  ballBounceSlime: 0.92, // 1.0 çok hızlıydı; his geri bildirimiyle söndürüldü
  ballBounceWall: 0.85, // duvar ve file için ortak sekme katsayısı
  maxBallSpeed: 1000,

  // Sayı, servis ve maç
  servePause: 0.9, // sayı sonrası topun servis noktasında asılı beklediği saniye
  matchTarget: 7, // bu sayıya ulaşan maçı kazanır

  // Başlangıç konumları
  slimeStartX: 200, // sol yarının ortası (sağ slime aynaya göre yerleşir)
  ballSpawnHeight: 300, // servis topu slime'ın üstünde bu yükseklikte doğar

  // Dokunmatik kontrol
  moveDragDeadZone: 12, // hareket için başparmağın merkezden kayması gereken piksel
  moveDragPullback: 25, // yön basılıyken bu kadar geri çekilmek durdurur ve merkezi sıfırlar

  // Online gecikme telafisi: kendi slime'ın yerelde anında oynar,
  // sunucu konumu yumuşakça düzeltir
  predictCorrection: 0.2, // her sunucu karesinde hatanın kapatılan payı
  predictSnapDist: 80, // bu kadar birimden büyük sapmada anında hizalan (ör. servis sıfırlaması)

  // Fizik adımı
  physicsHz: 60,

  // Ağ
  serverUrl: 'wss://slime-volley-server.onrender.com', // Render'daki oyun sunucusu;
  // boş bırakılırsa istemci, sayfanın sunulduğu makinede yerel sunucu arar (test için)
  serverPort: 8787, // yerel sunucunun portu (Render'da PORT ortam değişkeni kullanılır)
  roomCodeLength: 4,
  roomCodeAlphabet: 'ACDEFGHJKLMNPRSTUVYZ2345679', // karıştırılması kolay karakterler yok
  connectRetries: 15, // uyuyan ücretsiz sunucu uyanana kadar yeniden deneme sayısı
  connectRetryDelay: 5, // denemeler arası saniye (15 × 5 ≈ 75 sn)

  // Renkler
  colors: {
    sky: '#bfe0f5',
    ground: '#e3c078',
    leftSlime: '#e2574c',
    rightSlime: '#3e8fb0',
    ball: '#f6f0e4',
    net: '#6b4f2a',
    ballSeam: '#c9b89b',
    eye: '#ffffff',
    pupil: '#222222',
    hint: '#000000',
    sun: '#f4d06f',
    cloud: '#eef6fb',
    overlayText: '#333333',
  },

  // Dekor (ekran oranlarıyla: x/y genişlik-yükseklik payı, r/s boyut payı)
  decor: {
    sun: { x: 0.62, y: 0.16, r: 0.07 },
    clouds: [
      { x: 0.18, y: 0.24, s: 0.045 },
      { x: 0.87, y: 0.34, s: 0.035 },
    ],
  },

  // Ses (WebAudio ile sentezlenir, dosya yok)
  soundVolume: 0.15,

  // Kaos olayları (lobide tik'le seçilir; odayı kuran belirler)
  chaos: {
    minDelay: 8, // iki olay arası en az saniye
    maxDelay: 16, // iki olay arası en çok saniye
    windStrength: 260, // rüzgarın topa yatay ivmesi
    windDuration: 5,
    ballScaleBig: 1.8, // dev top çarpanı
    ballScaleSmall: 0.55, // minik top çarpanı
    ballModeDuration: 8,
    invertDuration: 4, // ters kontrol süresi (iki oyuncu için birden)
  },

  // Sabit tatlar
  smashSpeedFrac: 0.85, // vuruş sonrası hız bunun üstündeyse smaç sayılır (sarsıntı + ses)
  rallyShowFrom: 4, // ralli sayacı bu karşılıklı vuruştan itibaren görünür

  // Görsel oranlar ve ölçüler
  groundScreenFrac: 0.12, // zeminin ekran yüksekliğindeki payı
  hintOpacity: 0.1, // dokunma bölgesi ikonlarının opaklığı
  hintSizeFrac: 0.05, // ikon boyutu (ekran yüksekliğine göre)
  hintYFrac: 0.82, // ikonların dikey konumu — başparmakların doğal durduğu alt hiza
  hintLeftXFrac: 0.1, // "sola kaydır" ikonu (ekran genişliğine göre)
  hintRightXFrac: 0.17, // "sağa kaydır" ikonu — soldakiyle ikili, joystick'i ima eder
  hintJumpXFrac: 0.9, // "zıpla" ikonu
  scoreSizeFrac: 0.07, // skor yazısının boyutu (ekran yüksekliğine göre)
  scoreYFrac: 0.12, // skorun dikey konumu
  scoreXFrac: 0.08, // skorun kendi tarafının kenarından uzaklığı
  slimeStretchFrac: 0.2, // havadayken dikey uzama payı (hıza göre)
  blinkPeriodMs: 3800, // göz kırpma aralığı
  blinkDurationMs: 130, // göz kapalı kalma süresi
  overlay: {
    titleSizeFrac: 0.14, // "X KAZANDI!" yazısı (ekran yüksekliğine göre)
    titleYFrac: 0.4,
    subSizeFrac: 0.05, // alt satır ("yeniden oynamak için dokun")
    subYFrac: 0.56,
    bannerSizeFrac: 0.08, // kaos pankartı ("RÜZGAR!" vb.)
    bannerYFrac: 0.28,
    rallySizeFrac: 0.045, // ralli sayacı yazısı
    rallyYFrac: 0.07,
  },
  shakeDuration: 0.25, // smaç sarsıntısının süresi (saniye)
  shakeAmount: 7, // sarsıntının piksel genliği
  eyeOffsetFrac: 0.45, // gözün merkezden uzaklığı (slimeRadius'a göre)
  eyeRadiusFrac: 0.18, // göz yarıçapı (slimeRadius'a göre)
  pupilShiftFrac: 0.35, // göz bebeğinin topa doğru kayması (göz yarıçapına göre)
};
