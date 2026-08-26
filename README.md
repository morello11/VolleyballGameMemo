# VolleyballGameMemo

Slime Volley — telefon tarayıcısında oynanan iki kişilik slime voleybolu.
Proje planı ve kurallar için: [PROJE_REHBERI.md](PROJE_REHBERI.md)

Tamamen statik (vanilla JS + Canvas 2D, build yok); repo kökü doğrudan
GitHub Pages ile servis edilebilir.

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
