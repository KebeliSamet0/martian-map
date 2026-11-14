# Çalışma kuralları

1. **main'e doğrudan push yok.** Herkes kendi dalında çalışır: `isim/konu` (ör. `emre/rover-terrain`).
2. Sık commit, sık push. En az saatte bir push; laptop bozulursa iş kaybolmasın.
3. İş bitince **Pull Request** aç, açıklamaya ilgili issue'yu yaz (`Closes #12`). Birleştirmeyi Samet yapar.
4. Ekipler birbirine yalnız `contracts/` içindeki formatlarla bağlanır. Format değişecekse önce issue'da haber ver.
5. **Veri ve model ağırlıkları git'e girmez** (`data/raw/`, `*.tif`, `*.pt`…). Model ağırlıkları eğitildiği makinede kalır; repoya yalnız küçük çıktılar (`layers/*.npy`, `*.json`) girer. 50 MB üstü dosyayı commit'leme.
6. Kaynak kullandıysan (kod, veri, görsel) `docs/REFERENCES.md`'ye ekle. Teslimde References alanı buradan dolacak.
7. Takıldığın şeyi 20 dakikadan fazla tek başına çözmeye çalışma; grupta yaz.
