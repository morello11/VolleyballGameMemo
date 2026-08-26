# VolleyballGameMemo

Slime Volley — telefon tarayıcısında oynanan iki kişilik slime voleybolu.
Proje planı ve kurallar için: [PROJE_REHBERI.md](PROJE_REHBERI.md)

Oyun sayfası tamamen statik (vanilla JS + Canvas 2D, build yok); repo kökü
doğrudan GitHub Pages ile servis edilir. Online oyun için `server/` altında
küçük bir Node + WebSocket sunucusu vardır (aynı saf `js/physics.js`'i
çalıştırır); `render.yaml` ile Render'a tek tık dağıtılır.

## Nasıl test ederim

1. Canlı: https://morello11.github.io/VolleyballGameMemo/ — veya repo
   kökünde `python3 -m http.server 8000` açıp `http://localhost:8000`
   (telefonda aynı ağdan `http://<bilgisayar-ip>:8000`).
2. Masaüstü: sol oyuncu ok tuşları + boşluk; sağ oyuncu W/A/D
   (sağ oyuncu tuşları yalnızca test içindir — online adımında yerini
   ağdaki rakip alacak).
3. Telefon: yatay tut; sol yarıya bas ve başparmağını hafifçe sola/sağa
   kaydırarak hareket et (bastığın nokta merkez olur), sağ yarı = zıpla.
   Dikey tutunca "telefonu çevir" uyarısı çıkmalı.
4. Kontrol listesi: top slime'dan sekmeli, hareket halindeyken vuruş
   yönlenmeli, top yere düşünce karşı taraf sayı almalı, kısa bir
   duraksamadan sonra servis sayıyı alanda olmalı, skor üstte iki yanda
   görünmeli.

## Online nasıl test ederim

- İki telefon: biri **"Oda kur"** deyip 4 harfli kodu söyler, diğeri
  **"Koda katıl"** ile kodu girer; oyun ikisinde birden başlar.
- Maç 7 sayıya oynanır (`matchTarget`); biten maçta iki taraf da ekrana
  dokununca aynı odada rövanş başlar. Sunucuda `MATCH_TARGET` ortam
  değişkeni maç uzunluğunu config'i değiştirmeden ayarlar.
- Yerelde (sunucu geliştirme): `cd server && npm install && npm start`
  (port 8787), ayrı bir uçta `python3 -m http.server 8000`; iki tarayıcı
  penceresinde `http://localhost:8000` açıp birinden oda kur, diğerinden
  katıl. `js/config.js` içindeki `serverUrl` boşken istemci sayfanın
  sunulduğu makinede yerel sunucu arar.

## Sunucuyu Render'a kurma (tek sefer)

1. https://render.com — GitHub hesabınla üye ol.
2. **New +** → **Blueprint** → bu repoyu seç → **Deploy** (ayarlar
   `render.yaml` içinde hazır; ücretsiz plan).
3. Çıkan servis adresini (`https://....onrender.com`) al; `js/config.js`
   içindeki `serverUrl` değerine `wss://....onrender.com` olarak yaz.
4. Not: ücretsiz plan 15 dk hareketsizlikte uyur; ilk bağlanan ~1 dk bekler.
