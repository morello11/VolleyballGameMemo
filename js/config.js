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
  ballBounceWall: 0.85, // duvar, zemin ve file için ortak sekme katsayısı
  maxBallSpeed: 1100,
  ballGroundFriction: 0.7, // zemine her temasta yatay hız bununla çarpılır
  ballRestSpeed: 40, // yerde bu hızın altına düşen top yeniden doğar

  // Başlangıç konumları
  slimeStartX: 200, // sol yarının ortası
  ballSpawnHeight: 300, // top slime'ın üstünde bu yükseklikte doğar

  // Fizik adımı
  physicsHz: 60,

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
  hintLeftXFrac: 0.1, // "sola git" ikonu (ekran genişliğine göre)
  hintRightXFrac: 0.33, // "sağa git" ikonu
  hintJumpXFrac: 0.9, // "zıpla" ikonu
  eyeOffsetFrac: 0.45, // gözün merkezden uzaklığı (slimeRadius'a göre)
  eyeRadiusFrac: 0.18, // göz yarıçapı (slimeRadius'a göre)
  pupilShiftFrac: 0.35, // göz bebeğinin topa doğru kayması (göz yarıçapına göre)
};
