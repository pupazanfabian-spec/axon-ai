# Axon — Ghid de Instalare Complet (Pas cu Pas)

---

## ═══ FAZA 1: Creezi contul gratuit Expo ═══

**Ce faci: creezi un cont pe site-ul Expo (ca și cum te-ai înregistra pe orice site)**

### 1.1 — Deschide browserul pe calculator
Du-te pe: **https://expo.dev/signup**

### 1.2 — Completează formularul
- **Username:** alege orice nume (ex: `axon_user`)
- **Email:** adresa ta de email
- **Password:** o parolă sigură
- Apasă butonul **"Create Account"**

### 1.3 — Verifică emailul
Vei primi un email de confirmare. Apasă linkul din email.

✅ **Gata cu Faza 1!** Ai acum contul Expo.

---

## ═══ FAZA 2: Construiești APK-ul (faci asta în Replit) ═══

**Ce faci: îmi dai comanda, eu rulez procesul de build pentru tine**

### 2.1 — Spune-mi username-ul și parola contului Expo
Scrie-mi în chat:
> „Username: [username-ul tău] / Parola: [parola ta]"

Eu voi loga în contul tău din Replit și voi porni construcția APK-ului.

### 2.2 — Aștepți 15-20 minute
Procesul de build rulează pe serverele Expo (nu pe calculatorul tău).
Poți face orice altceva. Vei primi un **email** când e gata.

### 2.3 — Ce vei primi
Un email de la Expo cu un **link de descărcare** pentru fișierul `.apk`.
Acel link funcționează și de pe telefon.

---

## ═══ FAZA 3: Instalezi Axon pe telefon ═══

**Ce faci: instalezi aplicația din fișierul descărcat**

### 3.1 — Deschide emailul de la Expo PE TELEFON
(Deschide-l în Gmail sau altă aplicație de email de pe telefon)

Apasă butonul **„Download"** sau **„Install"** din email.
Sau copiază linkul și deschide-l în browserul telefonului.

### 3.2 — Permite instalarea din surse externe

Când apasă descărcarea, telefonul îți va arăta un mesaj de avertizare.
Urmează pașii de mai jos în funcție de telefon:

**Samsung:**
- Apasă **Setări** (Settings)
- → **Biometrie și securitate** (Biometrics and Security)
- → **Instalare aplicații necunoscute** (Install unknown apps)
- → Găsește **Chrome** sau **browserul tău**
- → Activează **„Permite din această sursă"** (Allow from this source)

**Huawei:**
- Apasă **Setări**
- → **Securitate**
- → **Instalare aplicații necunoscute**
- → Activează

**Xiaomi / Redmi:**
- Apasă **Setări**
- → **Aplicații suplimentare** (Additional settings)
- → **Securitate** (Privacy)
- → **Surse necunoscute** (Unknown sources)
- → Activează

**Alte telefoane:**
Dacă apare mesajul **„Surse necunoscute"** sau **„Unknown sources"** — apasă **„Setări"** în acel mesaj și activează opțiunea.

### 3.3 — Instalează aplicația
- Deschide **Descărcări** (sau **Files/Fișiere**) pe telefon
- Găsește fișierul `Axon-AI.apk`
- Apasă pe el
- Apasă **„Instalează"** (Install)
- Apasă **„Deschide"** (Open)

✅ **Gata cu Faza 3!** Axon e instalat pe telefon.

---

## ═══ FAZA 4: Descarci creierul AI ═══

**Ce faci: descarci modelul Phi-3 Mini direct prin aplicație (pe WiFi)**

### 4.1 — Deschide Axon pe telefon
Vei vedea un ecran albastru-închis cu un cerc și un icon de CPU.

### 4.2 — Apasă butonul violet
Butonul se numește: **„Descarcă creierul neural"**

### 4.3 — Conectează-te la WiFi
Asigură-te că ești pe WiFi (nu date mobile — fișierul are 2.2 GB).

### 4.4 — Aștepți descărcarea
Vei vedea o bară de progres și „X MB / 2200 MB".
- Pe WiFi de casă (100 Mbps): ~20 minute
- Pe WiFi mai lent: ~40 minute

**Nu închide aplicația în timp ce descarcă!**

### 4.5 — Modelul se încarcă automat
După descărcare, va apărea mesajul: **„Se încarcă Axon în memorie..."**
Aceasta durează ~30 secunde, o singură dată.

### 4.6 — Verificare că totul funcționează
În header-ul aplicației (sus, lângă „Axon") trebuie să scrie:
```
🧠 Neural • Offline
```

Dacă scrie asta — totul e perfect! Axon rulează cu Phi-3 Mini pe telefonul tău.

---

## ═══ FAZA 5: Folosești Axon ═══

**Scrie orice în câmpul de jos și trimite. Axon gândește local, fără internet.**

### Ce se întâmplă în spate:
- Mesajul tău → Creierul clasic verifică (instant)
- Dacă nu știe → Phi-3 Mini răspunde (2-5 secunde)
- Răspunsurile cu `🧠` înseamnă că Phi-3 Mini a răspuns

---

## Probleme și soluții

| Ce vezi | Ce faci |
|---------|---------|
| „App not installed" | Dezinstalează orice versiune veche a lui Axon și încearcă din nou |
| Bara de progres s-a oprit | Verifică conexiunea WiFi, apasă din nou butonul de descărcare |
| Nu apare 🧠 Neural | Închide complet aplicația și redeschide-o |
| Telefonul devine lent | Normal — modelul AI e mare. Dă-i 1 minut să se încarce |
| „Insufficient storage" | Eliberează cel puțin 3 GB spațiu pe telefon |

---

## Ce telefon îți trebuie

- Android 8.0 sau mai nou ✅
- Minim 4 GB RAM ✅
- Minim 3 GB spațiu liber ✅
