# Slime Volley — proje rehberi

## Oyun nedir
İki kişilik slime voleybolu. Telefon tarayıcısında, yatay modda oynanır.
Her oyuncu bir yarım daire "slime"dır; kontroller sadece sol, sağ ve zıpla.
Top yere rakibin tarafında düşerse sayı. Kimse bir şey kurmaz, link ile oynanır.

Uzun vadede online 2 kişilik olacak, ama ŞİMDİ DEĞİL. Aşağıdaki adım planına
kesinlikle sadık kal.

## Şu anki hedef: Adım 1 (sadece bunu yap)
Tek telefonda oynanış hissini oturtmak. İçeriği:

- Sahne: saha, ortada file, solda bir slime, bir top. Sağ taraf şimdilik
  sadece duvar (top oradan geri seker).
- Dokunmatik kontrol: ekranın sol yarısında sola/sağa hareket (yarımın solu =
  sol, sağı = sağ), sağ yarısına dokunmak = zıpla. Bölgeleri belli eden çok
  hafif görsel ipucu koy (ör. %10 opaklıkta ikonlar).
- Klavye desteği de ekle (ok tuşları + boşluk) — masaüstünde hızlı test için.
- Fizik: yerçekimi, top sekmesi, slime-top çarpışması (topun hızına slime'ın
  hareket hızı da etki etsin ki vuruş yönlendirilebilsin).
- Bitti kriteri: telefonda 30 saniye boyunca topu keyifle sektirebilmek,
  fileden aşırtıp duvardan dönen topu karşılayabilmek.

Adım 1 kapsamı DIŞINDA kalanlar (şimdi kod yazma, iskelet de hazırlama):
bot, ikinci oyuncu, ağ/netcode, skor sistemi, ses, sürpriz olaylar, menü.

Teslimat: Adım 1'i tek PR olarak ver. Kapsam dışı bir ihtiyaç fark edersen
kodunu yazma; PR açıklamasına tek cümlelik not düş, kararı birlikte veririz.

## Yol haritası (bilgi amaçlı — sırası gelince istenecek)
2. Online'a yerel temel: ikinci slime + sayı/servis akışı (sağ oyuncu
   masaüstünde W/A/D ile yalnızca test amaçlı sürülür).
   Karar: aynı telefonda 2 kişi İPTAL (oynanışı zayıf); basit bot da
   şimdilik atlandı — online sonrası istenirse ucuza eklenir.
3. Oda kodu ile online 2 kişi (Node + WebSocket, sunucu-yetkili fizik,
   mini lobi: "Oda kur" / "Koda katıl")
4. Maç akışı (set/maç bitişi), ufak efektler
5. Sürpriz olaylar (yıldırım, rüzgar, top modları) — config üzerinden

## Teknik kurallar
- Vanilla JS + Canvas 2D. Build adımı yok, bağımlılık yok, framework yok.
- Dosya yapısı (bunu aşma):
  - `index.html`
  - `js/config.js` — TÜM ayar sayıları burada
  - `js/physics.js` — saf oyun mantığı
  - `js/input.js` — dokunma/klavye okuma
  - `js/render.js` — canvas çizimi
  - `js/main.js` — döngü ve bağlama
  - `js/net.js` — sunucu bağlantısı (online adımıyla eklendi)
  - `js/lobby.js` — lobi ekranı (online adımıyla eklendi)
  - `server/server.js` — oda tabanlı oyun sunucusu (aynı physics.js'i koşar)
  - `render.yaml` — Render tek tık dağıtım tarifi
- En önemli mimari kural: `physics.js` saf olacak —
  `update(state, inputs, dt)` şeklinde, DOM/canvas'a asla dokunmayan
  fonksiyonlar. Render ve input ayrı. (İleride aynı fizik kodu sunucuda
  çalışacak; bu kurala uyulursa netcode eklerken hiçbir şey yeniden yazılmaz.)
- Sabit zaman adımı (60 Hz accumulator) + requestAnimationFrame.
- Basitlik ve okunabilirlik > zekice kod. Kısa dosyalar, açık isimler.
  Anlaşılması zor yapı kurma; iki yol varsa basit olanı seç.

## config.js başlangıç değerleri
Saha mantıksal genişliği 800 birim (ekrana ölçeklenir), zemin y=0 kabul.

- `slimeRadius: 50` (çap = yarı sahanın %25'i — sayı atma zorluğunun ana ayarı)
- `ballRadius: 20`
- `netHeight: 140`, `netWidth: 8`
- `gravity: 1500`, `jumpSpeed: 750`, `moveSpeed: 400`
- `ballBounceSlime: 1.0`, `ballBounceWall: 0.85`, `maxBallSpeed: 1100`

Bunlar tahmindir; oyun hissine göre birlikte ayarlanacak. Sihirli sayı
sadece bu dosyada yaşar, kodun içine gömülmez.

## Görsel stil
- Düz renkler, gradyan/gölge/parçacık yok.
- Palet: gökyüzü `#bfe0f5`, zemin `#e3c078`, sol slime `#e2574c`,
  sağ slime `#3e8fb0`, top `#f6f0e4`, file direği `#6b4f2a`.
- Slime = yarım daire + topa bakan tek göz. Top = daire + tek dikiş çizgisi.

## Test ve dağıtım
- Tamamen statik; repo kökünden GitHub Pages ile servis edilecek şekilde bırak.
- Mobil: `touchstart` ile gecikmesiz input, sayfa kaydırma/zoom/çift-tık zoom
  kapalı, yatay mod uyarısı (dikey tutulursa "telefonu çevir" yazısı).
- Her adımın sonunda kısa "nasıl test ederim" notu yaz.
