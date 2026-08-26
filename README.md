# VolleyballGameMemo

Slime Volley — telefon tarayıcısında oynanan iki kişilik slime voleybolu.
Proje planı ve kurallar için: [PROJE_REHBERI.md](PROJE_REHBERI.md)

Tamamen statik (vanilla JS + Canvas 2D, build yok); repo kökü doğrudan
GitHub Pages ile servis edilebilir.

## Nasıl test ederim (Adım 1)

1. Repo kökünde bir statik sunucu aç: `python3 -m http.server 8000`
2. Tarayıcıda `http://localhost:8000` adresine git
   (telefonda test için aynı ağdan `http://<bilgisayar-ip>:8000`).
3. Masaüstü: ok tuşları ile hareket, boşluk (veya yukarı ok) ile zıpla.
4. Telefon: yatay tut; sol yarıya bas ve başparmağını hafifçe sola/sağa
   kaydırarak hareket et (bastığın nokta merkez olur), sağ yarı = zıpla.
   Dikey tutunca "telefonu çevir" uyarısı çıkmalı.
5. Kontrol listesi: top slime'dan sekmeli, hareket halindeyken vuruş
   yönlenmeli, fileden aşan top sağ duvardan geri dönmeli, yerde duran
   top kısa süre sonra slime'ın üstünde yeniden doğmalı.
