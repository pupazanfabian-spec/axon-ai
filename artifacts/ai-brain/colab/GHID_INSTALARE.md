# Axon — Ghid Complet de Instalare pe Telefon

## Pasul 1: Creează contul EAS (o singură dată)

1. Du-te pe **https://expo.dev** și creează un cont gratuit
2. Pe calculator, deschide terminalul și rulează:
```
npm install -g eas-cli
eas login
```
3. Introdu email și parola contului tău Expo

---

## Pasul 2: Configurează proiectul

În folderul proiectului Axon, rulează:
```
eas init
```
Când îți cere, alege „Create a new project" și dă-i numele **Axon AI**.

---

## Pasul 3: Construiește APK-ul

```
eas build --platform android --profile preview
```

- Procesul durează **10-20 minute** pe serverele Expo (gratuit)
- Nu trebuie să stai cu calculatorul pornit — poți închide terminalul
- Vei primi un email când e gata
- La final vei vedea un link de download pentru fișierul `.apk`

---

## Pasul 4: Instalează APK-ul pe telefon

**Varianta A — prin browser (recomandat):**
1. Deschide link-ul de download de la Expo pe **telefonul tău** (din emailul primit)
2. Descarcă fișierul `.apk`
3. Deschide **Setări → Securitate → Surse necunoscute** → activează
4. Deschide fișierul `.apk` din Descărcări și instalează

**Varianta B — prin cablu USB:**
1. Conectează telefonul la calculator cu cablul USB
2. Pe telefon: Setări → Opțiuni dezvoltator → Depanare USB → activează
3. Copiază fișierul `.apk` pe telefon
4. Instalează-l din managerul de fișiere

---

## Pasul 5: Descarcă modelul AI (Phi-3 Mini)

Aceasta este **cea mai importantă** parte. Modelul are ~2.2 GB.

**Metoda 1 — Direct pe telefon (WiFi):**
1. Deschide Axon pe telefon
2. Va apărea automat ecranul de instalare model
3. Apasă **„Descarcă creierul neural"**
4. Așteaptă descărcarea completă (~15-30 minute pe WiFi)

**Metoda 2 — Manual (dacă ai descărcat deja modelul):**
1. Descarcă modelul de pe PC:  
   `https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf`
2. Transferă fișierul pe telefon prin USB sau Google Drive
3. Mută fișierul în: **Fișiere interne → Android → data → com.axon.ai → files → models**
4. Asigură-te că se numește exact: `phi-3-mini-4k-instruct-q4.gguf`
5. Repornește Axon — va detecta automat modelul

---

## Pasul 6: Verificare

Când totul e OK, în header-ul aplicației vei vedea:
```
🧠 Neural • Offline
```

În loc de:
```
v1 • Offline
```

---

## Fine-Tuning cu Google Colab (opțional, avansat)

Dacă vrei să antrenezi Axon cu conversațiile tale:

1. **Exportă datele** din Axon → Setări → „Exportă date antrenament"  
   (salvează un fișier `.jsonl` în telefon)

2. **Urcă în Google Drive** fișierul exportat

3. **Deschide Colab:**  
   https://colab.research.google.com → File → Upload notebook  
   → Alege `axon_finetune.py` din proiect

4. **Alege GPU gratuit:**  
   Runtime → Change runtime type → T4 GPU

5. **Rulează toate celulele** în ordine (30-60 minute)

6. **Descarcă modelul** rezultat și instalează-l în locul celui original  
   (același folder: `files/models/phi-3-mini-4k-instruct-q4.gguf`)

---

## Probleme frecvente

| Problemă | Soluție |
|----------|---------|
| „App not installed" | Dezinstalează versiunea veche, reinstalează |
| Modelul nu e detectat | Verifică numele exact al fișierului |
| Axon nu răspunde cu 🧠 | Modelul poate dura 30 sec la prima pornire |
| Descărcare întreruptă | Reapasă butonul de descărcare, reia de unde a rămas |
| „Insufficient storage" | Trebuie cel puțin 3 GB liberi pe telefon |

---

## Cerințe minime telefon

- Android 8.0 sau mai nou
- RAM: minim 4 GB (recomandat 6 GB+)
- Spațiu: 3 GB liber
- iOS 15+ (iPhone) — build separat necesar prin EAS
