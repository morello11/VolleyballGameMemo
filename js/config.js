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
  ballBounceSlime: 1.0,
  ballBounceWall: 0.85, // duvar ve file için ortak sekme katsayısı
  maxBallSpeed: 1100,

  // Sayı ve servis
  servePause: 0.9, // sayı sonrası topun servis noktasında asılı beklediği saniye

  // Başlangıç konumları
  slimeStartX: 200, // sol yarının ortası (sağ slime aynaya göre yerleşir)
  ballSpawnHeight: 300, // servis topu slime'ın üstünde bu yükseklikte doğar

  // Dokunmatik kontrol
  moveDragDeadZone: 15, // hareket için başparmağın merkezden kayması gereken piksel
  moveDragPullback: 25, // yön basılıyken bu kadar geri çekilmek durdurur ve merkezi sıfırlar

  // Fizik adımı
  physicsHz: 60,

  // Ağ
  serverUrl: 'wss://slime-volley-server.onrender.com', // Render'daki oyun sunucusu;
  // boş bırakılırsa istemci, sayfanın sunulduğu makinede yerel sunucu arar (test için)
  serverPort: 8787, // yerel sunucunun portu (Render'da PORT ortam değişkeni kullanılır)
  roomCodeLength: 4,
  roomCodeAlphabet: 'ACDEFGHJKLMNPRSTUVYZ2345679', // karıştırılması kolay karakterler yok

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
  },

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
  eyeOffsetFrac: 0.45, // gözün merkezden uzaklığı (slimeRadius'a göre)
  eyeRadiusFrac: 0.18, // göz yarıçapı (slimeRadius'a göre)
  pupilShiftFrac: 0.35, // göz bebeğinin topa doğru kayması (göz yarıçapına göre)
};
