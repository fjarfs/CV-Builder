# CV Studio - Dynamic ATS Resume Builder

A modern web application to dynamically craft, customize, and manage your Curriculum Vitae (CV) with an elegant, clean, and balanced **Executive ATS-Friendly Serif** design tailored to modern recruitment and executive standards.

The rendered CV layout follows a refined 2-column executive structure:
- **Header:** Full Name, Title/Role, Location, Phone, & Email.
- **Horizontal Dividers:** Distinct separator lines dividing major sections.
- **Left Column:** Uppercase section titles (`LINKS`, `PROFESSIONAL SUMMARY`, `AREAS OF EXPERTISE`, `EMPLOYMENT HISTORY`, `EDUCATION`, `CERTIFICATES`, `PROJECTS`, `LANGUAGES`, etc.) and date ranges.
- **Right Column:** Section details, external links, summary narrative, dual-column skill lists, job titles, company names, achievement bullet points, tech stack tags, project descriptions, certifications, and language proficiencies.

---

## ✨ Key Features

### 1. Interactive Form Editor
- **Personal & Contact Information:** Full name, title/profession, location, phone/WhatsApp, and email.
- **Custom Section Ordering:** Reorder entire sections (e.g. move *Professional Summary* before *Employment*, or *Projects* above *Education*) via intuitive drag-and-drop handles or **▲ / ▼** move buttons. The configured order is saved and reflected identically across the Web Preview, Word export (.docx), and PDF.
- **Item Reordering:** Reorder individual cards inside *Education*, *Certifications*, *Projects*, and *Languages* with dedicated **▲** (Move Up) and **▼** (Move Down) buttons.
- **Employment History:** Group multiple roles under a single company (e.g., promotions or organizational transitions), specify employment type (*Full-time*, *Freelance*, *Contract*, etc.), customize achievement bullet points, individual role date ranges, and tech stacks.
- **Projects Section:** Clean portfolio section with Project Name, Role, Date Range, optional clickable **Project URL (Link)** with external link arrow (`↗`), and **Short Description (Deskripsi Singkat)**.
- **Certificates Section:** Executive visual hierarchy with bold title on top, issuer underneath, issued year, and direct **Credential URL / ID** verification link (`↗`).
- **Areas of Expertise:** 2-column balanced skills layout with interactive skill tags (add and remove badges instantly).
- **Languages:** Language items with proficiency ratings (*Native*, *Professional Working*, etc.) and optional additional info.
- **Typography & Layout Settings:** Select from curated serif and sans-serif fonts (*EB Garamond*, *Georgia*, *Times New Roman*, *Merriweather*, *Inter*), font sizes, line heights, paper margins, and left column width.

### 2. Live Dynamic Multi-Page A4 Preview
- **Individual A4 Page Sheets:** Renders distinct physical A4 paper sheets (`210 × 297 mm`) stacked vertically with realistic paper shadows against a dark workspace.
- **Natural Dynamic Content Flow:** If space remains at the bottom of a page, bullet points and sections continue filling the page naturally without awkward empty holes, then cleanly transition onto the next page without duplicate headers or `(Continued)` markers to maintain strict ATS friendliness.
- **Clean Page Badges & Footers:** Each page has a floating badge (`PAGE 1 (A4)`, `PAGE 2 (A4)`) and footer (`Page 1 of X`). No harsh cut lines across text.
- **Scroll & Zoom Controls:** Scroll smoothly down through pages with Zoom in, Zoom out, *Fit Screen*, and 100% reset controls.

### 3. Real-Time Auto-Save & Zero Data Loss
- **Instant Local Autosave (100ms):** Every keystroke and form interaction immediately updates browser memory, live preview, and `localStorage`.
- **Background File Persistence (350ms):** Automatically sends debounced updates to the local Python server (`POST /api/save`) to persist changes directly to `data/cv_data.json` on disk.
- **Visual Status Indicator:** Real-time indicator in the editor header displays `Menyimpan...` (amber) while typing and `✓ Tersimpan otomatis (HH:MM:SS)` (green) once persisted.
- **Unload Protection:** Uses `navigator.sendBeacon` on `beforeunload` to flush any pending edits to `data/cv_data.json` if the user refreshes (`Cmd+R`) or closes the tab.
- **Manual Save & Open:** Keyboard shortcut **`Cmd+S` / `Ctrl+S`** or the **Simpan** button saves to file; **Buka File** loads any saved JSON resume.

### 4. Multi-Format Export (100% ATS-Friendly)
- **Export to PDF (Native Vector Text):**
  - Uses browser native print rendering (`@media print`) so every single letter is output as real searchable vector text with embedded fonts—**never bitmap/JPEG images**.
  - 100% compliant with automated Applicant Tracking Systems (Workday, Taleo, Greenhouse, Lever).
  - Includes **Cek Teks ATS** button in header to verify and copy sequential plain text.
- **Export to Word (.docx):**
  - Generates clean, native Microsoft Word (`.docx`) documents with standardized ATS headings (`WORK EXPERIENCE`, `SKILLS`) and sequential layout.
  - Fully compatible with Microsoft Word, Google Docs, Apple Pages, and LibreOffice.
  - All UI-only page break guides and badges are automatically hidden in exports.

---

## 🚀 Getting Started

### Running Locally (Recommended)
Open your terminal in the project directory and start the local Python server:
```bash
python3 server.py
```
Then visit in your browser:
```
http://localhost:3000
```

> **Why use `server.py`?**  
> Running with `server.py` enables direct, automatic real-time saving to `data/cv_data.json` on disk and seamless data synchronization across refreshes. All exports (Word & PDF) are downloaded directly to your local computer via the browser.

---

## 📁 Project Structure

```
cv/
├── index.html                  # Main application interface (Editor form + Live A4 preview)
├── server.py                   # Local Python HTTP daemon & API (/api/save, /api/load)
├── assets/
│   ├── css/
│   │   └── style.css           # UI design system, A4 page guides & print stylesheets
│   └── libs/
│       ├── docx.umd.js         # Client-side DOCX builder library
│       └── html2pdf.bundle.min.js # Client-side PDF builder library
├── data/
│   └── cv_data.json            # Local JSON data storage file (Auto-synced with editor)
├── js/
│   ├── app.js                  # Application controller, reactivity, autosave & A4 page break engine
│   ├── data.js                 # Initial default CV dataset & schema structure
│   ├── docx-export.js          # Microsoft Word (.docx) document generator
│   └── pdf-export.js           # PDF exporter & print dialog handler
├── scripts/
│   └── generate_sample.js      # CLI script to test Word export from terminal
└── README.md                   # Comprehensive project documentation
```

---

## 🛠️ CLI Word Document Generator

You can also generate the sample Word (.docx) file directly from the terminal without opening a browser:

```bash
node scripts/generate_sample.js
```
The output file will be generated at:
```
./Fajar_Sujito_CV.docx
```
