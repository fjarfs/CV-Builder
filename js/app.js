/**
 * CV Studio - Application Controller
 * Handles reactivity, state management, form-to-preview binding,
 * localStorage persistence, dynamic arrays, and exports.
 */

(function () {
  'use strict';

  // Application State
  const STORAGE_KEY = 'cv_studio_user_data_v1';
  let cvData = loadInitialData();
  let currentZoom = 1.0;

  // DOM Elements
  const cvDocument = document.getElementById('cv-document');
  const cvPaperWrapper = document.getElementById('cv-paper-wrapper');
  const previewViewport = document.getElementById('preview-viewport');
  const zoomIndicator = document.getElementById('zoom-indicator');
  const pageHeightStatus = document.getElementById('page-height-status');
  const autosaveStatus = document.getElementById('autosave-status');

  // Initialize Application
  function init() {
    setupAccordion();
    bindHeaderActions();
    bindZoomControls();
    bindMobileToggle();
    populateForm();
    renderCV();
    setupAutosaveDebounce();
    checkPageOverflow();

    window.addEventListener('resize', handleWindowResize);

    // Global keyboard shortcut: Cmd+S / Ctrl+S to save file
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCVToFile();
      }
    });

    // Delegated auto-save listener on entire sidebar
    const sidebar = document.getElementById('editor-sidebar');
    if (sidebar) {
      sidebar.addEventListener('input', () => triggerSave());
      sidebar.addEventListener('change', () => triggerSave());
    }

    // Auto-save on page unload (Cmd+R, close tab, etc.)
    window.addEventListener('beforeunload', () => {
      if (window.location.protocol.startsWith('http') && cvData) {
        cvData._updatedAt = Date.now();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData));
          const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
          navigator.sendBeacon('/api/save', blob);
        } catch (e) {}
      }
    });

    // Check if local server has existing cv_data.json
    if (window.location.protocol.startsWith('http')) {
      fetch('/api/load')
        .then(res => res.ok ? res.json() : null)
        .then(serverData => {
          if (serverData && serverData.personal && serverData.personal.fullName) {
            let useServer = true;
            try {
              const localSaved = localStorage.getItem(STORAGE_KEY);
              if (localSaved) {
                const localData = JSON.parse(localSaved);
                if (localData && localData._updatedAt && serverData._updatedAt) {
                  if (localData._updatedAt > serverData._updatedAt) {
                    useServer = false;
                  }
                }
              }
            } catch (e) {}

            if (useServer) {
              cvData = Object.assign({}, cloneCVData(DEFAULT_CV_DATA), serverData);
              normalizeCVData(cvData);
              populateForm();
              renderCV();
              checkPageOverflow();
              if (autosaveStatus) {
                autosaveStatus.textContent = '✓ Data sinkron';
                autosaveStatus.className = 'form-hint saved';
                autosaveStatus.style.color = '#34d399';
              }
            } else {
              saveToServer();
            }
          }
        })
        .catch(() => {});
    }
  }

  // Normalize employment to support multiple roles & bullets per company
  function normalizeEmployment(empList) {
    if (!Array.isArray(empList)) return [];
    return empList.map((job, idx) => {
      const empType = job.employmentType || '';
      if (Array.isArray(job.roles) && job.roles.length > 0) {
        return {
          id: job.id || `emp-${Date.now()}-${idx}`,
          company: job.company || '',
          employmentType: empType,
          companyDateRange: job.companyDateRange || '',
          roles: job.roles.map((r, rIdx) => ({
            id: r.id || `role-${Date.now()}-${rIdx}`,
            jobTitle: r.jobTitle || '',
            dateRange: r.dateRange || '',
            bullets: Array.isArray(r.bullets) ? [...r.bullets] : (r.bullets ? [String(r.bullets)] : ['']),
            techStack: r.techStack || ''
          }))
        };
      }

      // Backward compatibility for legacy flat job structure
      return {
        id: job.id || `emp-${Date.now()}-${idx}`,
        company: job.company || '',
        employmentType: empType,
        companyDateRange: job.companyDateRange || '',
        roles: [
          {
            id: `role-${Date.now()}-${idx}`,
            jobTitle: job.jobTitle || '',
            dateRange: job.dateRange || '',
            bullets: Array.isArray(job.bullets) ? [...job.bullets] : (job.bullets ? [String(job.bullets)] : ['']),
            techStack: job.techStack || ''
          }
        ]
      };
    });
  }

  function normalizeCVData(data) {
    if (!data) return;
    if (data.employment) {
      data.employment = normalizeEmployment(data.employment);
    }
    if (!Array.isArray(data.certifications)) {
      data.certifications = data.certifications ? [data.certifications] : [];
    }
    if (!Array.isArray(data.languages)) {
      data.languages = data.languages ? [data.languages] : [];
    }
    if (Array.isArray(data.projects)) {
      data.projects.forEach(p => {
        if (!p) return;
        if (p.description === undefined) {
          p.description = p.shortDesc || '';
        }
        delete p.bullets;
        delete p.techStack;
      });
    }
    if (!data.settings) data.settings = {};
    if (data.settings.showCertifications === undefined) data.settings.showCertifications = true;
    if (data.settings.showLanguages === undefined) data.settings.showLanguages = true;

    const defaultOrder = (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? DEFAULT_SECTION_ORDER : [
      "links", "summary", "skills", "employment", "education", "certifications", "projects", "languages"
    ]);
    if (!Array.isArray(data.settings.sectionOrder) || data.settings.sectionOrder.length === 0) {
      data.settings.sectionOrder = [...defaultOrder];
    } else {
      const existing = data.settings.sectionOrder.filter(k => defaultOrder.includes(k));
      defaultOrder.forEach(k => {
        if (!existing.includes(k)) existing.push(k);
      });
      data.settings.sectionOrder = existing;
    }
  }

  // Load Initial Data (from localStorage or DEFAULT_CV_DATA)
  function loadInitialData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.personal && parsed.personal.fullName && parsed.personal.fullName.trim() !== '') {
          const d = Object.assign({}, cloneCVData(DEFAULT_CV_DATA), parsed);
          normalizeCVData(d);
          return d;
        }
      }
    } catch (e) {
      console.warn("Could not load saved CV data:", e);
    }
    const d = cloneCVData(DEFAULT_CV_DATA);
    normalizeCVData(d);
    return d;
  }

  // Save Data to LocalStorage & Backend Server
  function saveData() {
    try {
      cvData._updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }

  let saveTimeout = null;
  let serverSaveTimeout = null;

  async function saveToServer() {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!window.location.protocol.startsWith('http')) {
      if (autosaveStatus) {
        autosaveStatus.textContent = `✓ Tersimpan (${nowTime})`;
        autosaveStatus.className = "form-hint saved";
        autosaveStatus.style.color = "#34d399";
      }
      return;
    }

    try {
      cvData._updatedAt = Date.now();
      const jsonStr = JSON.stringify(cvData, null, 2);
      const resp = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr
      });
      if (resp.ok) {
        const res = await resp.json();
        if (res.success && autosaveStatus) {
          autosaveStatus.textContent = `✓ Tersimpan otomatis (${nowTime})`;
          autosaveStatus.className = "form-hint saved";
          autosaveStatus.style.color = "#34d399";
        }
      } else {
        throw new Error('HTTP ' + resp.status);
      }
    } catch (e) {
      // Fallback: localStorage is already up to date
      if (autosaveStatus) {
        autosaveStatus.textContent = `✓ Tersimpan di browser (${nowTime})`;
        autosaveStatus.className = "form-hint saved";
        autosaveStatus.style.color = "#34d399";
      }
    }
  }

  function triggerSave() {
    if (autosaveStatus) {
      autosaveStatus.textContent = "Menyimpan...";
      autosaveStatus.className = "form-hint saving";
      autosaveStatus.style.color = "var(--accent-amber)";
    }
    clearTimeout(saveTimeout);
    clearTimeout(serverSaveTimeout);

    // 1. Instant local state update, preview render & overflow check (100ms)
    saveTimeout = setTimeout(() => {
      saveData();
      renderCV();
      checkPageOverflow();
    }, 100);

    // 2. Debounced auto-save to server cv_data.json (350ms)
    serverSaveTimeout = setTimeout(() => {
      saveToServer();
    }, 350);
  }

  function setupAutosaveDebounce() {
    // Handled by triggerSave()
  }

  // ==========================================================================
  // Accordion Logic
  // ==========================================================================
  function setupAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.accordion-group');
        group.classList.toggle('active');
      });
    });
  }

  // ==========================================================================
  // Form Population
  // ==========================================================================
  function populateForm() {
    // 1. Personal
    const p = cvData.personal || {};
    document.getElementById('input-fullname').value = p.fullName || '';
    document.getElementById('input-jobtitle').value = p.jobTitle || '';
    document.getElementById('input-location').value = p.location || '';
    document.getElementById('input-phone').value = p.phone || '';
    document.getElementById('input-email').value = p.email || '';

    ['input-fullname', 'input-jobtitle', 'input-location', 'input-phone', 'input-email'].forEach(id => {
      document.getElementById(id).addEventListener('input', e => {
        const key = id.replace('input-', '');
        if (key === 'fullname') cvData.personal.fullName = e.target.value;
        else if (key === 'jobtitle') cvData.personal.jobTitle = e.target.value;
        else cvData.personal[key] = e.target.value;
        triggerSave();
      });
    });

    // 2. Links
    renderLinksForm();
    document.getElementById('btn-add-link').onclick = () => {
      cvData.links.push({ label: 'Baru', url: 'https://' });
      renderLinksForm();
      triggerSave();
    };

    // 3. Summary
    const summaryInput = document.getElementById('input-summary');
    summaryInput.value = cvData.summary || '';
    updateSummaryWordCount();
    summaryInput.addEventListener('input', e => {
      cvData.summary = e.target.value;
      updateSummaryWordCount();
      triggerSave();
    });

    // 4. Skills
    renderSkillsForm();
    setupSkillsAddInput();

    // 5. Employment
    renderEmploymentForm();
    document.getElementById('btn-add-employment').onclick = () => {
      cvData.employment.push({
        id: 'emp-' + Date.now(),
        company: 'Perusahaan Baru',
        employmentType: 'Full-time',
        companyDateRange: '',
        roles: [
          {
            id: 'role-' + Date.now(),
            jobTitle: 'Software Engineer',
            dateRange: 'Jan 2026 — Present',
            bullets: ['Bertanggung jawab atas pengembangan fitur utama.'],
            techStack: 'TypeScript, React, Node.js'
          }
        ]
      });
      renderEmploymentForm();
      triggerSave();
    };

    // 6. Education
    const toggleEdu = document.getElementById('toggle-show-education');
    toggleEdu.checked = cvData.settings.showEducation !== false;
    toggleEdu.onchange = e => {
      cvData.settings.showEducation = e.target.checked;
      triggerSave();
    };
    renderEducationForm();
    document.getElementById('btn-add-education').onclick = () => {
      if (!cvData.education) cvData.education = [];
      cvData.education.push({
        id: 'edu-' + Date.now(),
        dateRange: '2020 — 2024',
        degree: 'Sarjana Komputer',
        institution: 'Universitas',
        details: 'IPK 3.80 / 4.00'
      });
      renderEducationForm();
      triggerSave();
    };

    // 7. Certifications
    const toggleCert = document.getElementById('toggle-show-certifications');
    if (toggleCert) {
      toggleCert.checked = cvData.settings.showCertifications !== false;
      toggleCert.onchange = e => {
        cvData.settings.showCertifications = e.target.checked;
        triggerSave();
      };
    }
    renderCertificationsForm();
    const btnAddCert = document.getElementById('btn-add-certification');
    if (btnAddCert) {
      btnAddCert.onclick = () => {
        if (!cvData.certifications) cvData.certifications = [];
        cvData.certifications.push({
          id: 'cert-' + Date.now(),
          dateRange: '2024',
          name: 'Nama Sertifikat Baru',
          issuer: 'Penerbit / Organisasi',
          credentialId: '',
          credentialUrl: '',
          details: ''
        });
        renderCertificationsForm();
        triggerSave();
      };
    }

    // 8. Projects
    const toggleProj = document.getElementById('toggle-show-projects');
    if (toggleProj) {
      toggleProj.checked = !!cvData.settings.showProjects;
      toggleProj.onchange = e => {
        cvData.settings.showProjects = e.target.checked;
        triggerSave();
      };
    }
    renderProjectsForm();
    const btnAddProj = document.getElementById('btn-add-project');
    if (btnAddProj) {
      btnAddProj.onclick = () => {
        if (!cvData.projects) cvData.projects = [];
        cvData.projects.push({
          id: 'proj-' + Date.now(),
          dateRange: '2025',
          projectName: 'Nama Proyek Baru',
          projectUrl: '',
          role: 'Full Stack Developer',
          description: ''
        });
        renderProjectsForm();
        triggerSave();
      };
    }

    // 9. Languages
    const toggleLang = document.getElementById('toggle-show-languages');
    if (toggleLang) {
      toggleLang.checked = cvData.settings.showLanguages !== false;
      toggleLang.onchange = e => {
        cvData.settings.showLanguages = e.target.checked;
        triggerSave();
      };
    }
    renderLanguagesForm();
    const btnAddLang = document.getElementById('btn-add-language');
    if (btnAddLang) {
      btnAddLang.onclick = () => {
        if (!cvData.languages) cvData.languages = [];
        cvData.languages.push({
          id: 'lang-' + Date.now(),
          name: 'Bahasa Baru',
          proficiency: 'Professional Working Proficiency',
          info: ''
        });
        renderLanguagesForm();
        triggerSave();
      };
    }

    // 10. Section Order
    renderSectionOrderForm();
    const btnResetSectionOrder = document.getElementById('btn-reset-section-order');
    if (btnResetSectionOrder) {
      btnResetSectionOrder.onclick = () => {
        const defaultOrder = (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? DEFAULT_SECTION_ORDER : [
          "links", "summary", "skills", "employment", "education", "certifications", "projects", "languages"
        ]);
        cvData.settings.sectionOrder = [...defaultOrder];
        renderSectionOrderForm();
        triggerSave();
        showToast("Urutan bagian CV direset ke default", "success");
      };
    }

    // 11. Settings
    const s = cvData.settings || {};
    const fontSelect = document.getElementById('setting-font-family');
    const sizeSelect = document.getElementById('setting-font-size');
    const lineSelect = document.getElementById('setting-line-height');
    const marginSelect = document.getElementById('setting-margin');
    const colSelect = document.getElementById('setting-left-col');

    if (s.fontFamily) fontSelect.value = s.fontFamily;
    if (s.fontSize) sizeSelect.value = s.fontSize;
    if (s.lineHeight) lineSelect.value = s.lineHeight;
    if (s.paperMargin) marginSelect.value = s.paperMargin;
    if (s.leftColWidth) colSelect.value = s.leftColWidth;

    fontSelect.onchange = e => { cvData.settings.fontFamily = e.target.value; triggerSave(); };
    sizeSelect.onchange = e => { cvData.settings.fontSize = e.target.value; triggerSave(); };
    lineSelect.onchange = e => { cvData.settings.lineHeight = e.target.value; triggerSave(); };
    marginSelect.onchange = e => { cvData.settings.paperMargin = e.target.value; triggerSave(); };
    colSelect.onchange = e => { cvData.settings.leftColWidth = e.target.value; triggerSave(); };
  }

  // Update Summary Word Count
  function updateSummaryWordCount() {
    const text = document.getElementById('input-summary').value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    const el = document.getElementById('summary-word-count');
    if (el) el.textContent = `${count} kata (${text.length} karakter)`;
  }

  // ==========================================================================
  // Links Form Renderer
  // ==========================================================================
  function renderLinksForm() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';

    (cvData.links || []).forEach((link, idx) => {
      const row = document.createElement('div');
      row.className = 'form-row';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <input type="text" class="form-input link-label-input" placeholder="Label (cth: Portfolio)" value="${escapeHtml(link.label)}" style="width: 35%;">
        <input type="text" class="form-input link-url-input" placeholder="URL (https://...)" value="${escapeHtml(link.url)}" style="width: 55%;">
        <button type="button" class="btn-danger-ghost btn-remove-link" title="Hapus Tautan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      row.querySelector('.link-label-input').oninput = e => {
        link.label = e.target.value;
        triggerSave();
      };
      row.querySelector('.link-url-input').oninput = e => {
        link.url = e.target.value;
        triggerSave();
      };
      row.querySelector('.btn-remove-link').onclick = () => {
        cvData.links.splice(idx, 1);
        renderLinksForm();
        triggerSave();
      };

      container.appendChild(row);
    });
  }

  // ==========================================================================
  // Skills Form Renderer
  // ==========================================================================
  function renderSkillsForm() {
    const col1List = document.getElementById('skills-col1-list');
    const col2List = document.getElementById('skills-col2-list');

    col1List.innerHTML = '';
    col2List.innerHTML = '';

    (cvData.skills.column1 || []).forEach((skill, idx) => {
      col1List.appendChild(createSkillTag(skill, () => {
        cvData.skills.column1.splice(idx, 1);
        renderSkillsForm();
        triggerSave();
      }));
    });

    (cvData.skills.column2 || []).forEach((skill, idx) => {
      col2List.appendChild(createSkillTag(skill, () => {
        cvData.skills.column2.splice(idx, 1);
        renderSkillsForm();
        triggerSave();
      }));
    });
  }

  function createSkillTag(text, onRemove) {
    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      <span>${escapeHtml(text)}</span>
      <button type="button" aria-label="Hapus skill">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    tag.querySelector('button').onclick = onRemove;
    return tag;
  }

  function setupSkillsAddInput() {
    const input1 = document.getElementById('input-skill-col1');
    const btn1 = document.getElementById('btn-add-skill-col1');
    const input2 = document.getElementById('input-skill-col2');
    const btn2 = document.getElementById('btn-add-skill-col2');

    const addCol1 = () => {
      const val = input1.value.trim();
      if (val) {
        if (!cvData.skills.column1) cvData.skills.column1 = [];
        cvData.skills.column1.push(val);
        input1.value = '';
        renderSkillsForm();
        triggerSave();
      }
    };

    const addCol2 = () => {
      const val = input2.value.trim();
      if (val) {
        if (!cvData.skills.column2) cvData.skills.column2 = [];
        cvData.skills.column2.push(val);
        input2.value = '';
        renderSkillsForm();
        triggerSave();
      }
    };

    btn1.onclick = addCol1;
    input1.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCol1(); } });

    btn2.onclick = addCol2;
    input2.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCol2(); } });
  }

  // ==========================================================================
  // Employment History Form Renderer
  // ==========================================================================
  function renderEmploymentForm() {
    const container = document.getElementById('employment-list');
    container.innerHTML = '';

    (cvData.employment || []).forEach((job, idx) => {
      if (!Array.isArray(job.roles) || job.roles.length === 0) {
        job.roles = [{
          id: 'role-' + Date.now(),
          jobTitle: job.jobTitle || '',
          dateRange: job.dateRange || '',
          bullets: Array.isArray(job.bullets) ? [...job.bullets] : [''],
          techStack: job.techStack || ''
        }];
      }

      const card = document.createElement('div');
      card.className = 'item-card';

      const roleCountText = `${job.roles.length} Role${job.roles.length > 1 ? 's' : ''}`;

      card.innerHTML = `
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
            <span class="item-card-title">#${idx + 1} ${escapeHtml(job.company || 'Perusahaan Baru')}</span>
            <span class="badge-role-count">${roleCountText}</span>
          </div>
          <div class="item-card-actions">
            ${idx > 0 ? `<button type="button" class="btn-ghost btn-move-up" title="Geser ke Atas">▲</button>` : ''}
            ${idx < cvData.employment.length - 1 ? `<button type="button" class="btn-ghost btn-move-down" title="Geser ke Bawah">▼</button>` : ''}
            <button type="button" class="btn-danger-ghost btn-delete-job" title="Hapus Perusahaan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 1.5;">
            <label class="form-label">Nama Perusahaan / Organisasi</label>
            <input type="text" class="form-input job-company-input" value="${escapeHtml(job.company || '')}" placeholder="Cth: Looq Creative">
          </div>
          <div class="form-group" style="flex: 1.1;">
            <label class="form-label">Tipe Pekerjaan</label>
            <input type="text" list="employment-type-list" class="form-input job-type-input" value="${escapeHtml(job.employmentType || '')}" placeholder="Cth: Full-time">
          </div>
          <div class="form-group" style="flex: 1.1;">
            <label class="form-label">Periode Total (Opsional)</label>
            <input type="text" class="form-input job-company-date-input" value="${escapeHtml(job.companyDateRange || '')}" placeholder="Cth: Jan 2022 — Jan 2026">
          </div>
        </div>

        <div class="company-roles-list"></div>

        <button type="button" class="btn btn-ghost btn-sm btn-add-role-to-company" style="align-self: flex-start; margin-top: 4px; border: 1px dashed rgba(255, 255, 255, 0.18);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Role di ${escapeHtml(job.company || 'Perusahaan Ini')}
        </button>
      `;

      // Company info bindings
      const companyInput = card.querySelector('.job-company-input');
      companyInput.oninput = e => {
        job.company = e.target.value;
        const titleSpan = card.querySelector('.item-card-title');
        if (titleSpan) titleSpan.textContent = `#${idx + 1} ${e.target.value.trim() || 'Perusahaan'}`;
        triggerSave();
      };

      const companyTypeInput = card.querySelector('.job-type-input');
      companyTypeInput.oninput = e => {
        job.employmentType = e.target.value;
        triggerSave();
      };

      const companyDateInput = card.querySelector('.job-company-date-input');
      companyDateInput.oninput = e => {
        job.companyDateRange = e.target.value;
        triggerSave();
      };

      if (card.querySelector('.btn-move-up')) {
        card.querySelector('.btn-move-up').onclick = () => {
          const temp = cvData.employment[idx - 1];
          cvData.employment[idx - 1] = cvData.employment[idx];
          cvData.employment[idx] = temp;
          renderEmploymentForm();
          triggerSave();
        };
      }

      if (card.querySelector('.btn-move-down')) {
        card.querySelector('.btn-move-down').onclick = () => {
          const temp = cvData.employment[idx + 1];
          cvData.employment[idx + 1] = cvData.employment[idx];
          cvData.employment[idx] = temp;
          renderEmploymentForm();
          triggerSave();
        };
      }

      card.querySelector('.btn-delete-job').onclick = () => {
        if (confirm(`Hapus riwayat perusahaan "${job.company || 'ini'}" beserta semua rolenya?`)) {
          cvData.employment.splice(idx, 1);
          renderEmploymentForm();
          triggerSave();
        }
      };

      // Render Roles Subcards
      const rolesContainer = card.querySelector('.company-roles-list');
      const renderRoleSubcards = () => {
        rolesContainer.innerHTML = '';
        job.roles.forEach((role, rIdx) => {
          const subcard = document.createElement('div');
          subcard.className = 'role-subcard';

          subcard.innerHTML = `
            <div class="role-subcard-header">
              <span class="role-subcard-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Role #${rIdx + 1}: <strong style="color: #e2e8f0; margin-left: 2px;">${escapeHtml(role.jobTitle || 'Jabatan Baru')}</strong>
              </span>
              <div class="role-subcard-actions">
                ${rIdx > 0 ? `<button type="button" class="btn-ghost btn-role-up" title="Geser Role ke Atas" style="padding: 2px 5px; font-size: 0.7rem;">▲</button>` : ''}
                ${rIdx < job.roles.length - 1 ? `<button type="button" class="btn-ghost btn-role-down" title="Geser Role ke Bawah" style="padding: 2px 5px; font-size: 0.7rem;">▼</button>` : ''}
                ${job.roles.length > 1 ? `
                  <button type="button" class="btn-danger-ghost btn-delete-role" title="Hapus Role Ini" style="padding: 2px 4px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1.8;">
                <label class="form-label">Jabatan (Role / Title)</label>
                <input type="text" class="form-input role-title-input" value="${escapeHtml(role.jobTitle || '')}" placeholder="Cth: Lead Full Stack Developer">
              </div>
              <div class="form-group" style="flex: 1.2;">
                <label class="form-label">Periode Waktu Role</label>
                <input type="text" class="form-input role-date-input" value="${escapeHtml(role.dateRange || '')}" placeholder="Cth: Jan 2024 — Jan 2026">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Poin Pencapaian & Tanggung Jawab (Bullet Points)</label>
              <div class="bullet-list-container role-bullets-container"></div>
              <button type="button" class="btn btn-secondary btn-xs btn-add-bullet" style="align-self: flex-start; margin-top: 4px;">
                + Tambah Poin
              </button>
            </div>

            <div class="form-group">
              <label class="form-label">Tech Stack Role Ini (Opsional)</label>
              <input type="text" class="form-input role-techstack-input" value="${escapeHtml(role.techStack || '')}" placeholder="Cth: React, TypeScript, Next.js, Node.js">
            </div>
          `;

          // Bindings
          const roleTitleInput = subcard.querySelector('.role-title-input');
          roleTitleInput.oninput = e => {
            role.jobTitle = e.target.value;
            const strongTitle = subcard.querySelector('.role-subcard-title strong');
            if (strongTitle) strongTitle.textContent = e.target.value.trim() || 'Jabatan Baru';
            triggerSave();
          };

          const roleDateInput = subcard.querySelector('.role-date-input');
          roleDateInput.oninput = e => {
            role.dateRange = e.target.value;
            triggerSave();
          };

          const roleTechInput = subcard.querySelector('.role-techstack-input');
          roleTechInput.oninput = e => {
            role.techStack = e.target.value;
            triggerSave();
          };

          if (subcard.querySelector('.btn-role-up')) {
            subcard.querySelector('.btn-role-up').onclick = () => {
              const temp = job.roles[rIdx - 1];
              job.roles[rIdx - 1] = job.roles[rIdx];
              job.roles[rIdx] = temp;
              renderEmploymentForm();
              triggerSave();
            };
          }

          if (subcard.querySelector('.btn-role-down')) {
            subcard.querySelector('.btn-role-down').onclick = () => {
              const temp = job.roles[rIdx + 1];
              job.roles[rIdx + 1] = job.roles[rIdx];
              job.roles[rIdx] = temp;
              renderEmploymentForm();
              triggerSave();
            };
          }

          if (subcard.querySelector('.btn-delete-role')) {
            subcard.querySelector('.btn-delete-role').onclick = () => {
              if (confirm(`Hapus role "${role.jobTitle || 'ini'}"?`)) {
                job.roles.splice(rIdx, 1);
                renderEmploymentForm();
                triggerSave();
              }
            };
          }

          // Role Bullets
          const bulletsContainer = subcard.querySelector('.role-bullets-container');
          const renderRoleBullets = () => {
            bulletsContainer.innerHTML = '';
            (role.bullets || []).forEach((bullet, bIdx) => {
              const bRow = document.createElement('div');
              bRow.className = 'bullet-item-row';
              bRow.innerHTML = `
                <textarea class="form-textarea bullet-textarea" rows="2" placeholder="Tuliskan pencapaian spesifik...">${escapeHtml(bullet)}</textarea>
                <button type="button" class="btn-danger-ghost btn-remove-bullet" title="Hapus poin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              `;
              bRow.querySelector('.bullet-textarea').oninput = e => {
                role.bullets[bIdx] = e.target.value;
                triggerSave();
              };
              bRow.querySelector('.btn-remove-bullet').onclick = () => {
                role.bullets.splice(bIdx, 1);
                renderRoleBullets();
                triggerSave();
              };
              bulletsContainer.appendChild(bRow);
            });
          };

          subcard.querySelector('.btn-add-bullet').onclick = () => {
            if (!role.bullets) role.bullets = [];
            role.bullets.push('');
            renderRoleBullets();
            triggerSave();
          };

          renderRoleBullets();
          rolesContainer.appendChild(subcard);
        });
      };

      card.querySelector('.btn-add-role-to-company').onclick = () => {
        job.roles.push({
          id: 'role-' + Date.now(),
          jobTitle: '',
          dateRange: '',
          bullets: [''],
          techStack: ''
        });
        renderEmploymentForm();
        triggerSave();
      };

      renderRoleSubcards();
      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Education Form Renderer
  // ==========================================================================
  function renderEducationForm() {
    const container = document.getElementById('education-list');
    container.innerHTML = '';

    const list = cvData.education || [];

    list.forEach((edu, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
            <span class="item-card-title">#${idx + 1} ${escapeHtml(edu.degree || 'Pendidikan Baru')}</span>
          </div>
          <div class="item-card-actions">
            ${idx > 0 ? `<button type="button" class="btn-ghost btn-move-edu-up" title="Geser ke Atas">▲</button>` : ''}
            ${idx < list.length - 1 ? `<button type="button" class="btn-ghost btn-move-edu-down" title="Geser ke Bawah">▼</button>` : ''}
            <button type="button" class="btn-danger-ghost btn-delete-edu" title="Hapus Pendidikan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Gelar / Jurusan</label>
            <input type="text" class="form-input edu-degree-input" value="${escapeHtml(edu.degree || '')}" placeholder="Cth: Bachelor of Computer Science">
          </div>
          <div class="form-group">
            <label class="form-label">Institusi / Universitas</label>
            <input type="text" class="form-input edu-inst-input" value="${escapeHtml(edu.institution || '')}" placeholder="Cth: Universitas Mercu Buana">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Periode Waktu (Tahun)</label>
          <input type="text" class="form-input edu-date-input" value="${escapeHtml(edu.dateRange || '')}" placeholder="Cth: 2016 — 2020">
        </div>

        <div class="form-group">
          <label class="form-label">Keterangan / IPK / Prestasi</label>
          <input type="text" class="form-input edu-details-input" value="${escapeHtml(edu.details || '')}" placeholder="Cth: Fokus Rekayasa Perangkat Lunak. IPK 3.75">
        </div>
      `;

      card.querySelector('.edu-degree-input').oninput = e => {
        edu.degree = e.target.value;
        const titleEl = card.querySelector('.item-card-title');
        if (titleEl) titleEl.textContent = `#${idx + 1} ${e.target.value || 'Pendidikan Baru'}`;
        triggerSave();
      };
      card.querySelector('.edu-inst-input').oninput = e => { edu.institution = e.target.value; triggerSave(); };
      card.querySelector('.edu-date-input').oninput = e => { edu.dateRange = e.target.value; triggerSave(); };
      card.querySelector('.edu-details-input').oninput = e => { edu.details = e.target.value; triggerSave(); };

      const moveUpBtn = card.querySelector('.btn-move-edu-up');
      if (moveUpBtn) {
        moveUpBtn.onclick = () => {
          if (idx > 0) {
            const temp = cvData.education[idx - 1];
            cvData.education[idx - 1] = cvData.education[idx];
            cvData.education[idx] = temp;
            renderEducationForm();
            triggerSave();
          }
        };
      }

      const moveDownBtn = card.querySelector('.btn-move-edu-down');
      if (moveDownBtn) {
        moveDownBtn.onclick = () => {
          if (idx < list.length - 1) {
            const temp = cvData.education[idx + 1];
            cvData.education[idx + 1] = cvData.education[idx];
            cvData.education[idx] = temp;
            renderEducationForm();
            triggerSave();
          }
        };
      }

      card.querySelector('.btn-delete-edu').onclick = () => {
        cvData.education.splice(idx, 1);
        renderEducationForm();
        triggerSave();
      };

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Projects Form Renderer
  // ==========================================================================
  function renderProjectsForm() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';

    const list = cvData.projects || [];

    list.forEach((proj, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
            <span class="item-card-title">#${idx + 1} ${escapeHtml(proj.projectName || 'Proyek Baru')}</span>
          </div>
          <div class="item-card-actions">
            ${idx > 0 ? `<button type="button" class="btn-ghost btn-move-proj-up" title="Geser ke Atas">▲</button>` : ''}
            ${idx < list.length - 1 ? `<button type="button" class="btn-ghost btn-move-proj-down" title="Geser ke Bawah">▼</button>` : ''}
            <button type="button" class="btn-danger-ghost btn-delete-proj" title="Hapus Proyek">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama Proyek</label>
            <input type="text" class="form-input proj-name-input" value="${escapeHtml(proj.projectName || '')}" placeholder="Cth: Analytics SaaS">
          </div>
          <div class="form-group">
            <label class="form-label">Peran (Role)</label>
            <input type="text" class="form-input proj-role-input" value="${escapeHtml(proj.role || '')}" placeholder="Cth: Lead Developer">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tahun / Periode</label>
            <input type="text" class="form-input proj-date-input" value="${escapeHtml(proj.dateRange || '')}" placeholder="Cth: 2024">
          </div>
          <div class="form-group">
            <label class="form-label">Link / Tautan Proyek (Opsional)</label>
            <input type="url" class="form-input proj-url-input" value="${escapeHtml(proj.projectUrl || proj.link || '')}" placeholder="Cth: https://ambmegatrend.com atau https://github.com/...">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi Singkat (Short Description)</label>
          <textarea class="form-textarea proj-desc-input" style="min-height: 60px;" placeholder="Tuliskan deskripsi singkat mengenai proyek ini...">${escapeHtml(proj.description || proj.shortDesc || '')}</textarea>
        </div>
      `;

      card.querySelector('.proj-name-input').oninput = e => {
        proj.projectName = e.target.value;
        const titleEl = card.querySelector('.item-card-title');
        if (titleEl) titleEl.textContent = `#${idx + 1} ${e.target.value || 'Proyek Baru'}`;
        triggerSave();
      };
      card.querySelector('.proj-role-input').oninput = e => { proj.role = e.target.value; triggerSave(); };
      card.querySelector('.proj-date-input').oninput = e => { proj.dateRange = e.target.value; triggerSave(); };
      card.querySelector('.proj-url-input').oninput = e => { proj.projectUrl = e.target.value; triggerSave(); };
      card.querySelector('.proj-desc-input').oninput = e => {
        proj.description = e.target.value;
        triggerSave();
      };

      const moveUpBtn = card.querySelector('.btn-move-proj-up');
      if (moveUpBtn) {
        moveUpBtn.onclick = () => {
          if (idx > 0) {
            const temp = cvData.projects[idx - 1];
            cvData.projects[idx - 1] = cvData.projects[idx];
            cvData.projects[idx] = temp;
            renderProjectsForm();
            triggerSave();
          }
        };
      }

      const moveDownBtn = card.querySelector('.btn-move-proj-down');
      if (moveDownBtn) {
        moveDownBtn.onclick = () => {
          if (idx < list.length - 1) {
            const temp = cvData.projects[idx + 1];
            cvData.projects[idx + 1] = cvData.projects[idx];
            cvData.projects[idx] = temp;
            renderProjectsForm();
            triggerSave();
          }
        };
      }

      card.querySelector('.btn-delete-proj').onclick = () => {
        cvData.projects.splice(idx, 1);
        renderProjectsForm();
        triggerSave();
      };

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Certifications Form Renderer
  // ==========================================================================
  function renderCertificationsForm() {
    const container = document.getElementById('certifications-list');
    if (!container) return;
    container.innerHTML = '';

    const list = cvData.certifications || [];

    list.forEach((cert, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
            <span class="item-card-title">#${idx + 1} ${escapeHtml(cert.name || 'Sertifikat Baru')}</span>
          </div>
          <div class="item-card-actions">
            ${idx > 0 ? `<button type="button" class="btn-ghost btn-move-cert-up" title="Geser ke Atas">▲</button>` : ''}
            ${idx < list.length - 1 ? `<button type="button" class="btn-ghost btn-move-cert-down" title="Geser ke Bawah">▼</button>` : ''}
            <button type="button" class="btn-danger-ghost btn-delete-cert" title="Hapus Sertifikat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama Sertifikasi / Lisensi</label>
            <input type="text" class="form-input cert-name-input" value="${escapeHtml(cert.name || '')}" placeholder="Cth: AWS Certified Solutions Architect">
          </div>
          <div class="form-group">
            <label class="form-label">Penerbit / Organisasi</label>
            <input type="text" class="form-input cert-issuer-input" value="${escapeHtml(cert.issuer || '')}" placeholder="Cth: Amazon Web Services (AWS)">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tahun / Periode Perolehan</label>
            <input type="text" class="form-input cert-date-input" value="${escapeHtml(cert.dateRange || '')}" placeholder="Cth: 2023 atau May 2023">
          </div>
          <div class="form-group">
            <label class="form-label">ID Kredensial / No. Sertifikat</label>
            <input type="text" class="form-input cert-id-input" value="${escapeHtml(cert.credentialId || '')}" placeholder="Cth: AWS-892147">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Link / Tautan Kredensial (Opsional)</label>
          <input type="url" class="form-input cert-url-input" value="${escapeHtml(cert.credentialUrl || '')}" placeholder="Cth: https://www.credly.com/badges/... atau https://aws.amazon.com/...">
        </div>

        <div class="form-group">
          <label class="form-label">Keterangan Tambahan / Deskripsi (Opsional)</label>
          <input type="text" class="form-input cert-details-input" value="${escapeHtml(cert.details || '')}" placeholder="Cth: Validasi arsitektur cloud, microservices, dan security">
        </div>
      `;

      card.querySelector('.cert-name-input').oninput = e => {
        cert.name = e.target.value;
        const titleEl = card.querySelector('.item-card-title');
        if (titleEl) titleEl.textContent = `#${idx + 1} ${e.target.value || 'Sertifikat Baru'}`;
        triggerSave();
      };
      card.querySelector('.cert-issuer-input').oninput = e => { cert.issuer = e.target.value; triggerSave(); };
      card.querySelector('.cert-date-input').oninput = e => { cert.dateRange = e.target.value; triggerSave(); };
      card.querySelector('.cert-id-input').oninput = e => { cert.credentialId = e.target.value; triggerSave(); };
      card.querySelector('.cert-url-input').oninput = e => { cert.credentialUrl = e.target.value; triggerSave(); };
      card.querySelector('.cert-details-input').oninput = e => { cert.details = e.target.value; triggerSave(); };

      const moveUpBtn = card.querySelector('.btn-move-cert-up');
      if (moveUpBtn) {
        moveUpBtn.onclick = () => {
          if (idx > 0) {
            const temp = cvData.certifications[idx - 1];
            cvData.certifications[idx - 1] = cvData.certifications[idx];
            cvData.certifications[idx] = temp;
            renderCertificationsForm();
            triggerSave();
          }
        };
      }

      const moveDownBtn = card.querySelector('.btn-move-cert-down');
      if (moveDownBtn) {
        moveDownBtn.onclick = () => {
          if (idx < list.length - 1) {
            const temp = cvData.certifications[idx + 1];
            cvData.certifications[idx + 1] = cvData.certifications[idx];
            cvData.certifications[idx] = temp;
            renderCertificationsForm();
            triggerSave();
          }
        };
      }

      card.querySelector('.btn-delete-cert').onclick = () => {
        cvData.certifications.splice(idx, 1);
        renderCertificationsForm();
        triggerSave();
      };

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Languages Form Renderer
  // ==========================================================================
  function renderLanguagesForm() {
    const container = document.getElementById('languages-list');
    if (!container) return;
    container.innerHTML = '';

    const list = cvData.languages || [];

    list.forEach((lang, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
            <span class="item-card-title">#${idx + 1} ${escapeHtml(lang.name || 'Bahasa Baru')}</span>
          </div>
          <div class="item-card-actions">
            ${idx > 0 ? `<button type="button" class="btn-ghost btn-move-lang-up" title="Geser ke Atas">▲</button>` : ''}
            ${idx < list.length - 1 ? `<button type="button" class="btn-ghost btn-move-lang-down" title="Geser ke Bawah">▼</button>` : ''}
            <button type="button" class="btn-danger-ghost btn-delete-lang" title="Hapus Bahasa">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Bahasa</label>
            <input type="text" class="form-input lang-name-input" value="${escapeHtml(lang.name || '')}" placeholder="Cth: English, Indonesian">
          </div>
          <div class="form-group">
            <label class="form-label">Tingkat Kemahiran (Proficiency)</label>
            <input type="text" class="form-input lang-proficiency-input" value="${escapeHtml(lang.proficiency || '')}" placeholder="Cth: Native or Bilingual, Professional Working Proficiency">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan Tambahan / Skor Tes (Opsional)</label>
          <input type="text" class="form-input lang-info-input" value="${escapeHtml(lang.info || '')}" placeholder="Cth: TOEFL iBT 105, IELTS 7.5">
        </div>
      `;

      card.querySelector('.lang-name-input').oninput = e => {
        lang.name = e.target.value;
        const titleEl = card.querySelector('.item-card-title');
        if (titleEl) titleEl.textContent = `#${idx + 1} ${e.target.value || 'Bahasa Baru'}`;
        triggerSave();
      };
      card.querySelector('.lang-proficiency-input').oninput = e => { lang.proficiency = e.target.value; triggerSave(); };
      card.querySelector('.lang-info-input').oninput = e => { lang.info = e.target.value; triggerSave(); };

      const moveUpBtn = card.querySelector('.btn-move-lang-up');
      if (moveUpBtn) {
        moveUpBtn.onclick = () => {
          if (idx > 0) {
            const temp = cvData.languages[idx - 1];
            cvData.languages[idx - 1] = cvData.languages[idx];
            cvData.languages[idx] = temp;
            renderLanguagesForm();
            triggerSave();
          }
        };
      }

      const moveDownBtn = card.querySelector('.btn-move-lang-down');
      if (moveDownBtn) {
        moveDownBtn.onclick = () => {
          if (idx < list.length - 1) {
            const temp = cvData.languages[idx + 1];
            cvData.languages[idx + 1] = cvData.languages[idx];
            cvData.languages[idx] = temp;
            renderLanguagesForm();
            triggerSave();
          }
        };
      }

      card.querySelector('.btn-delete-lang').onclick = () => {
        cvData.languages.splice(idx, 1);
        renderLanguagesForm();
        triggerSave();
      };

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Section Order Form Renderer
  // ==========================================================================
  const SECTION_METADATA = {
    links: { name: "Links (Tautan)" },
    summary: { name: "Professional Summary (Ringkasan)" },
    skills: { name: "Areas of Expertise (Keahlian)" },
    employment: { name: "Employment History (Pekerjaan)" },
    education: { name: "Education (Pendidikan)" },
    certifications: { name: "Certificates (Sertifikat)" },
    projects: { name: "Projects (Proyek)" },
    languages: { name: "Languages (Bahasa)" }
  };

  let draggedOrderIndex = null;

  function renderSectionOrderForm() {
    const container = document.getElementById('section-order-list');
    if (!container) return;
    container.innerHTML = '';

    const order = (cvData.settings && Array.isArray(cvData.settings.sectionOrder))
      ? cvData.settings.sectionOrder
      : (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? [...DEFAULT_SECTION_ORDER] : Object.keys(SECTION_METADATA));

    order.forEach((key, idx) => {
      const meta = SECTION_METADATA[key] || { name: key };
      const itemEl = document.createElement('div');
      itemEl.className = 'section-order-item';
      itemEl.setAttribute('draggable', 'true');
      itemEl.dataset.index = idx;
      itemEl.dataset.key = key;

      itemEl.innerHTML = `
        <span class="section-order-handle" title="Tahan dan geser untuk memindahkan urutan">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
          </svg>
        </span>
        <span class="section-order-num">${idx + 1}</span>
        <span class="section-order-title" title="${escapeHtml(meta.name)}">${escapeHtml(meta.name)}</span>
        <div class="section-order-actions">
          <button type="button" class="btn-order-move btn-move-up" title="Pindah ke Atas" ${idx === 0 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button type="button" class="btn-order-move btn-move-down" title="Pindah ke Bawah" ${idx === order.length - 1 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      `;

      // Up button click
      const upBtn = itemEl.querySelector('.btn-move-up');
      if (upBtn) {
        upBtn.onclick = (e) => {
          e.stopPropagation();
          if (idx > 0) {
            const temp = order[idx];
            order[idx] = order[idx - 1];
            order[idx - 1] = temp;
            renderSectionOrderForm();
            triggerSave();
          }
        };
      }

      // Down button click
      const downBtn = itemEl.querySelector('.btn-move-down');
      if (downBtn) {
        downBtn.onclick = (e) => {
          e.stopPropagation();
          if (idx < order.length - 1) {
            const temp = order[idx];
            order[idx] = order[idx + 1];
            order[idx + 1] = temp;
            renderSectionOrderForm();
            triggerSave();
          }
        };
      }

      // Drag and Drop
      itemEl.addEventListener('dragstart', (e) => {
        draggedOrderIndex = idx;
        itemEl.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      itemEl.addEventListener('dragend', () => {
        itemEl.classList.remove('dragging');
        container.querySelectorAll('.section-order-item').forEach(el => el.classList.remove('drag-over'));
      });

      itemEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        itemEl.classList.add('drag-over');
      });

      itemEl.addEventListener('dragleave', () => {
        itemEl.classList.remove('drag-over');
      });

      itemEl.addEventListener('drop', (e) => {
        e.preventDefault();
        itemEl.classList.remove('drag-over');
        if (draggedOrderIndex !== null && draggedOrderIndex !== idx) {
          const movedKey = order.splice(draggedOrderIndex, 1)[0];
          order.splice(idx, 0, movedKey);
          draggedOrderIndex = null;
          renderSectionOrderForm();
          triggerSave();
        }
      });

      container.appendChild(itemEl);
    });
  }

  // ==========================================================================
  // Live CV Document Renderer (HTML Output matching screenshot)
  // ==========================================================================
  function renderCV() {
    const s = cvData.settings || {};
    const root = document.documentElement;

    // Apply custom typography & layout CSS variables
    root.style.setProperty('--cv-font', getFontFamilyCSS(s.fontFamily));
    root.style.setProperty('--cv-font-size', s.fontSize || '10pt');
    root.style.setProperty('--cv-line-height', s.lineHeight || '1.45');
    root.style.setProperty('--cv-margin', s.paperMargin || '18mm');
    root.style.setProperty('--cv-left-col', s.leftColWidth || '25%');
    root.style.setProperty('--cv-right-col', '1fr');

    // Reset document
    cvDocument.innerHTML = '';
    const pages = [];

    function makePage() {
      const pageNum = pages.length + 1;
      const page = document.createElement('div');
      page.className = 'cv-page';
      page.dataset.page = String(pageNum);
      page.innerHTML = `
        <div class="cv-page-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>PAGE ${pageNum} (A4)</span>
        </div>
        <div class="cv-page-content"></div>
        <div class="cv-page-footer">Page ${pageNum}</div>
      `;
      cvDocument.appendChild(page);
      pages.push(page);
      return page;
    }

    let currentPage = makePage();
    let currentContent = currentPage.querySelector('.cv-page-content');

    function isPageOverflowing(page) {
      const content = page.querySelector('.cv-page-content');
      if (!content) return false;
      if ((content.scrollHeight - content.clientHeight) > 1.5) return true;
      const contentRect = content.getBoundingClientRect();
      const lastChild = content.lastElementChild;
      if (lastChild) {
        const lastRect = lastChild.getBoundingClientRect();
        if ((lastRect.bottom - contentRect.bottom) > 1.5) return true;
      }
      return false;
    }

    function advanceToNewPage() {
      currentPage = makePage();
      currentContent = currentPage.querySelector('.cv-page-content');
      return currentPage;
    }

    // 1. Header (Name, Job Title, Contacts) on Page 1
    const p = cvData.personal || {};
    const contactsArr = [];
    if (p.location) contactsArr.push(escapeHtml(p.location));
    if (p.phone) contactsArr.push(escapeHtml(p.phone));
    if (p.email) contactsArr.push(escapeHtml(p.email));

    const jobTitleHtml = p.jobTitle && p.jobTitle.trim()
      ? `<div class="cv-header-role">${escapeHtml(p.jobTitle.trim())}</div>`
      : '';

    const headerEl = document.createElement('header');
    headerEl.className = 'cv-header';
    headerEl.innerHTML = `
      <h1 class="cv-header-name">${escapeHtml(p.fullName || 'Nama Lengkap')}</h1>
      ${jobTitleHtml}
      <div class="cv-header-contacts">
        ${contactsArr.join(', ')}
      </div>
    `;
    currentContent.appendChild(headerEl);

    // Section Renderers with dynamic, granular pagination
    const sectionHandlers = {
      links: () => {
        if (!cvData.links || cvData.links.length === 0) return;
        const linksHtml = cvData.links.map((link, idx) => {
          const isLast = idx === cvData.links.length - 1;
          return `<a class="cv-link-item" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || link.url)}</a>${!isLast ? '<span class="cv-link-separator">,</span>' : ''}`;
        }).join(' ');

        const sec = document.createElement('section');
        sec.className = 'cv-section';
        sec.dataset.sectionKey = 'links';
        sec.innerHTML = `
          <div class="cv-section-row">
            <div class="cv-section-title">LINKS</div>
            <div class="cv-section-content cv-links-list">
              ${linksHtml}
            </div>
          </div>
        `;
        currentContent.appendChild(sec);
        if (isPageOverflowing(currentPage) && currentContent.children.length > 1) {
          currentContent.removeChild(sec);
          advanceToNewPage();
          currentContent.appendChild(sec);
        }
      },

      summary: () => {
        if (!cvData.summary || !cvData.summary.trim()) return;
        const summaryParas = cvData.summary.trim()
          .split(/\r?\n+/)
          .map(p => p.trim())
          .filter(Boolean);

        function createSummaryShell(isContinued = false) {
          const sec = document.createElement('section');
          sec.className = `cv-section${isContinued ? ' cv-section-continued' : ''}`;
          sec.dataset.sectionKey = 'summary';
          const label = isContinued ? ' <span class="cv-section-cont-label">(Continued)</span>' : '';
          sec.innerHTML = `
            <div class="cv-section-row">
              <div class="cv-section-title">SUMMARY${label}</div>
              <div class="cv-section-content cv-summary-text"></div>
            </div>
          `;
          return sec;
        }

        let currentSec = createSummaryShell(false);
        currentContent.appendChild(currentSec);
        let target = currentSec.querySelector('.cv-summary-text');

        summaryParas.forEach((paraText, pIdx) => {
          const pEl = document.createElement('p');
          pEl.className = 'cv-summary-para';
          pEl.innerHTML = escapeHtml(paraText);
          target.appendChild(pEl);

          if (isPageOverflowing(currentPage) && (pIdx > 0 || currentContent.children.length > 1)) {
            target.removeChild(pEl);
            if (target.children.length === 0) {
              currentContent.removeChild(currentSec);
            }
            advanceToNewPage();
            currentSec = createSummaryShell(true);
            currentContent.appendChild(currentSec);
            target = currentSec.querySelector('.cv-summary-text');
            target.appendChild(pEl);
          }
        });
      },

      skills: () => {
        const col1 = cvData.skills?.column1 || [];
        const col2 = cvData.skills?.column2 || [];
        if (col1.length === 0 && col2.length === 0) return;

        const col1Html = col1.map(s => `<div class="cv-skill-item">${escapeHtml(s)}</div>`).join('');
        const col2Html = col2.map(s => `<div class="cv-skill-item">${escapeHtml(s)}</div>`).join('');

        const sec = document.createElement('section');
        sec.className = 'cv-section';
        sec.dataset.sectionKey = 'skills';
        sec.innerHTML = `
          <div class="cv-section-row">
            <div class="cv-section-title">AREAS OF EXPERTISE</div>
            <div class="cv-section-content cv-skills-grid">
              <div class="cv-skill-column">${col1Html}</div>
              <div class="cv-skill-column">${col2Html}</div>
            </div>
          </div>
        `;

        currentContent.appendChild(sec);
        if (isPageOverflowing(currentPage) && currentContent.children.length > 1) {
          currentContent.removeChild(sec);
          advanceToNewPage();
          currentContent.appendChild(sec);
        }
      },

      employment: () => {
        if (!cvData.employment || cvData.employment.length === 0) return;

        function createEmploymentShell(isContinued = false) {
          const sec = document.createElement('section');
          sec.className = `cv-section${isContinued ? ' cv-section-continued' : ''}`;
          sec.dataset.sectionKey = 'employment';
          const label = isContinued ? ' <span class="cv-section-cont-label">(Continued)</span>' : '';
          sec.innerHTML = `
            <div class="cv-section-row" style="margin-bottom: 8px;">
              <div class="cv-section-title">EMPLOYMENT HISTORY${label}</div>
              <div class="cv-section-content"></div>
            </div>
          `;
          return sec;
        }

        let currentSec = createEmploymentShell(false);
        currentContent.appendChild(currentSec);

        if (isPageOverflowing(currentPage) && currentContent.children.length > 1) {
          currentContent.removeChild(currentSec);
          advanceToNewPage();
          currentSec = createEmploymentShell(false);
          currentContent.appendChild(currentSec);
        }

        let totalRolesPlaced = 0;

        cvData.employment.forEach(job => {
          const roles = Array.isArray(job.roles) && job.roles.length > 0 ? job.roles : [
            {
              jobTitle: job.jobTitle || '',
              dateRange: job.dateRange || '',
              bullets: Array.isArray(job.bullets) ? job.bullets : [],
              techStack: job.techStack || ''
            }
          ];

          const typeHtml = job.employmentType && job.employmentType.trim()
            ? ` <span class="cv-company-type">· ${escapeHtml(job.employmentType.trim())}</span>`
            : '';

          function createCompanyGroup(isContinued = false) {
            const grp = document.createElement('div');
            grp.className = 'cv-company-group';
            const contLabel = isContinued ? ' <span class="cv-company-type">(Continued)</span>' : '';
            grp.innerHTML = `
              <div class="cv-company-header-row">
                <div class="cv-job-date cv-company-date">${escapeHtml(job.companyDateRange || '')}</div>
                <div class="cv-company-main">
                  <div class="cv-company-name-heading">${escapeHtml(job.company || '')}${typeHtml}${contLabel}</div>
                </div>
              </div>
            `;
            return grp;
          }

          let currentCompanyGroup = createCompanyGroup(false);
          currentSec.appendChild(currentCompanyGroup);

          if (isPageOverflowing(currentPage) && (totalRolesPlaced > 0 || currentContent.children.length > 1)) {
            currentSec.removeChild(currentCompanyGroup);
            if (currentSec.querySelectorAll('.cv-company-group').length === 0) {
              currentContent.removeChild(currentSec);
            }
            advanceToNewPage();
            currentSec = createEmploymentShell(true);
            currentContent.appendChild(currentSec);
            currentCompanyGroup = createCompanyGroup(false);
            currentSec.appendChild(currentCompanyGroup);
          }

          let rolesPlacedForThisCompany = 0;

          roles.forEach((role, rIdx) => {
            const isLastRole = rIdx === roles.length - 1;
            const validBullets = (role.bullets || []).filter(b => b && b.trim());

            function createRoleEntry(isContinued = false) {
              const entry = document.createElement('div');
              entry.className = `cv-job-entry cv-sub-role ${isLastRole ? 'cv-last-role' : ''}`;
              const contLabel = isContinued ? ' <span class="cv-role-title-cont">(Continued)</span>' : '';
              entry.innerHTML = `
                <div class="cv-job-date">${isContinued ? '' : escapeHtml(role.dateRange || '')}</div>
                <div class="cv-job-main">
                  <div class="cv-job-header cv-role-title">${escapeHtml(role.jobTitle || '')}${contLabel}</div>
                  <ul class="cv-job-bullets"></ul>
                </div>
              `;
              return entry;
            }

            let currentRoleEntry = createRoleEntry(false);
            currentCompanyGroup.appendChild(currentRoleEntry);
            let currentBulletUl = currentRoleEntry.querySelector('.cv-job-bullets');

            if (isPageOverflowing(currentPage) && (totalRolesPlaced > 0 || currentContent.children.length > 1)) {
              currentCompanyGroup.removeChild(currentRoleEntry);
              if (currentCompanyGroup.querySelectorAll('.cv-job-entry').length === 0) {
                currentSec.removeChild(currentCompanyGroup);
              }
              if (currentSec.querySelectorAll('.cv-company-group').length === 0) {
                currentContent.removeChild(currentSec);
              }

              advanceToNewPage();
              currentSec = createEmploymentShell(true);
              currentContent.appendChild(currentSec);
              currentCompanyGroup = createCompanyGroup(rolesPlacedForThisCompany > 0);
              currentSec.appendChild(currentCompanyGroup);
              currentRoleEntry = createRoleEntry(false);
              currentCompanyGroup.appendChild(currentRoleEntry);
              currentBulletUl = currentRoleEntry.querySelector('.cv-job-bullets');
            }

            let bulletsOnThisPage = 0;

            validBullets.forEach((bulletText) => {
              const li = document.createElement('li');
              li.innerHTML = escapeHtml(bulletText.trim());
              currentBulletUl.appendChild(li);

              if (isPageOverflowing(currentPage)) {
                currentBulletUl.removeChild(li);

                if (bulletsOnThisPage === 0 && (totalRolesPlaced > 0 || currentContent.children.length > 1)) {
                  // No bullets could fit on this page!
                  // Do not leave an orphan company header or role title stranded without points.
                  currentCompanyGroup.removeChild(currentRoleEntry);
                  if (currentCompanyGroup.querySelectorAll('.cv-job-entry').length === 0) {
                    currentSec.removeChild(currentCompanyGroup);
                  }
                  if (currentSec.querySelectorAll('.cv-company-group').length === 0) {
                    currentContent.removeChild(currentSec);
                  }

                  advanceToNewPage();
                  currentSec = createEmploymentShell(true);
                  currentContent.appendChild(currentSec);
                  currentCompanyGroup = createCompanyGroup(rolesPlacedForThisCompany > 0);
                  currentSec.appendChild(currentCompanyGroup);
                  currentRoleEntry = createRoleEntry(false);
                  currentCompanyGroup.appendChild(currentRoleEntry);
                  currentBulletUl = currentRoleEntry.querySelector('.cv-job-bullets');
                  currentBulletUl.appendChild(li);
                  bulletsOnThisPage = 1;
                } else {
                  // At least 1 bullet was already placed on this page, so continue cleanly onto next page
                  advanceToNewPage();
                  currentSec = createEmploymentShell(true);
                  currentContent.appendChild(currentSec);
                  currentCompanyGroup = createCompanyGroup(true);
                  currentSec.appendChild(currentCompanyGroup);
                  currentRoleEntry = createRoleEntry(true);
                  currentCompanyGroup.appendChild(currentRoleEntry);
                  currentBulletUl = currentRoleEntry.querySelector('.cv-job-bullets');
                  currentBulletUl.appendChild(li);
                  bulletsOnThisPage = 1;
                }
              } else {
                bulletsOnThisPage++;
              }
            });

            if (role.techStack && role.techStack.trim()) {
              const tsEl = document.createElement('div');
              tsEl.className = 'cv-job-techstack';
              tsEl.textContent = `Tech Stack: ${role.techStack.trim()}`;
              const mainDiv = currentRoleEntry.querySelector('.cv-job-main');
              mainDiv.appendChild(tsEl);

              if (isPageOverflowing(currentPage)) {
                mainDiv.removeChild(tsEl);
                if (bulletsOnThisPage === 0 && (totalRolesPlaced > 0 || currentContent.children.length > 1)) {
                  currentCompanyGroup.removeChild(currentRoleEntry);
                  if (currentCompanyGroup.querySelectorAll('.cv-job-entry').length === 0) {
                    currentSec.removeChild(currentCompanyGroup);
                  }
                  if (currentSec.querySelectorAll('.cv-company-group').length === 0) {
                    currentContent.removeChild(currentSec);
                  }

                  advanceToNewPage();
                  currentSec = createEmploymentShell(true);
                  currentContent.appendChild(currentSec);
                  currentCompanyGroup = createCompanyGroup(rolesPlacedForThisCompany > 0);
                  currentSec.appendChild(currentCompanyGroup);
                  currentRoleEntry = createRoleEntry(false);
                  currentCompanyGroup.appendChild(currentRoleEntry);
                  currentRoleEntry.querySelector('.cv-job-main').appendChild(tsEl);
                } else if (bulletsOnThisPage > 1) {
                  // Keep at least 1 bullet with the tech stack on the continuation page so it is not an orphan title with 0 bullets
                  const lastLi = currentBulletUl.lastElementChild;
                  if (lastLi) {
                    currentBulletUl.removeChild(lastLi);
                  }

                  advanceToNewPage();
                  currentSec = createEmploymentShell(true);
                  currentContent.appendChild(currentSec);
                  currentCompanyGroup = createCompanyGroup(true);
                  currentSec.appendChild(currentCompanyGroup);
                  currentRoleEntry = createRoleEntry(true);
                  currentCompanyGroup.appendChild(currentRoleEntry);
                  currentBulletUl = currentRoleEntry.querySelector('.cv-job-bullets');
                  if (lastLi) {
                    currentBulletUl.appendChild(lastLi);
                  }
                  currentRoleEntry.querySelector('.cv-job-main').appendChild(tsEl);
                  bulletsOnThisPage = 1;
                } else {
                  advanceToNewPage();
                  currentSec = createEmploymentShell(true);
                  currentContent.appendChild(currentSec);
                  currentCompanyGroup = createCompanyGroup(true);
                  currentSec.appendChild(currentCompanyGroup);
                  currentRoleEntry = createRoleEntry(true);
                  currentCompanyGroup.appendChild(currentRoleEntry);
                  currentRoleEntry.querySelector('.cv-job-main').appendChild(tsEl);
                }
              }
            }

            rolesPlacedForThisCompany++;
            totalRolesPlaced++;
          });
        });
      },

      education: () => {
        if (!cvData.education || cvData.education.length === 0 || cvData.settings.showEducation === false) return;

        function createEduShell(isContinued = false) {
          const sec = document.createElement('section');
          sec.className = `cv-section${isContinued ? ' cv-section-continued' : ''}`;
          sec.dataset.sectionKey = 'education';
          const label = isContinued ? ' <span class="cv-section-cont-label">(Continued)</span>' : '';
          sec.innerHTML = `
            <div class="cv-section-row" style="margin-bottom: 8px;">
              <div class="cv-section-title">EDUCATION${label}</div>
              <div class="cv-section-content"></div>
            </div>
          `;
          return sec;
        }

        let currentSec = createEduShell(false);
        currentContent.appendChild(currentSec);
        let itemsInSec = 0;

        cvData.education.forEach(edu => {
          const titleInst = `${escapeHtml(edu.degree || '')}${edu.degree && edu.institution ? ', ' : ''}<span class="cv-job-company">${escapeHtml(edu.institution || '')}</span>`;
          const detailsHtml = edu.details && edu.details.trim()
            ? `<div class="cv-edu-details">${escapeHtml(edu.details.trim())}</div>`
            : '';

          const entry = document.createElement('div');
          entry.className = 'cv-edu-entry';
          entry.innerHTML = `
            <div class="cv-edu-date">${escapeHtml(edu.dateRange || '')}</div>
            <div class="cv-edu-main">
              <div class="cv-edu-header">${titleInst}</div>
              ${detailsHtml}
            </div>
          `;

          currentSec.appendChild(entry);

          if (isPageOverflowing(currentPage) && (itemsInSec > 0 || currentContent.children.length > 1)) {
            currentSec.removeChild(entry);
            if (currentSec.querySelectorAll('.cv-edu-entry').length === 0) {
              currentContent.removeChild(currentSec);
            }
            advanceToNewPage();
            currentSec = createEduShell(true);
            currentContent.appendChild(currentSec);
            currentSec.appendChild(entry);
            itemsInSec = 0;
          }
          itemsInSec++;
        });
      },

      certifications: () => {
        if (!cvData.certifications || cvData.certifications.length === 0 || cvData.settings.showCertifications === false) return;
        const validCerts = cvData.certifications.filter(c => c && c.name && c.name.trim());
        if (validCerts.length === 0) return;

        function createCertShell(isContinued = false) {
          const sec = document.createElement('section');
          sec.className = `cv-section${isContinued ? ' cv-section-continued' : ''}`;
          sec.dataset.sectionKey = 'certifications';
          const label = isContinued ? ' <span class="cv-section-cont-label">(Continued)</span>' : '';
          sec.innerHTML = `
            <div class="cv-section-row">
              <div class="cv-section-title">CERTIFICATES${label}</div>
              <div class="cv-section-content cv-cert-list"></div>
            </div>
          `;
          return sec;
        }

        let currentSec = createCertShell(false);
        currentContent.appendChild(currentSec);
        let target = currentSec.querySelector('.cv-cert-list');
        let itemsInSec = 0;

        validCerts.forEach(cert => {
          const title = escapeHtml(cert.name.trim());
          let dateText = cert.dateRange ? cert.dateRange.trim() : '';
          let formattedDate = '';
          if (dateText) {
            formattedDate = /^issued/i.test(dateText) ? dateText : `Issued ${dateText}`;
          }

          const credUrl = cert.credentialUrl && cert.credentialUrl.trim() ? cert.credentialUrl.trim() : '';
          const credId = cert.credentialId && cert.credentialId.trim() ? cert.credentialId.trim() : '';

          let credHtml = '';
          if (credUrl && credId) {
            credHtml = `<a href="${escapeHtml(credUrl)}" target="_blank" rel="noopener noreferrer" class="cv-cert-link">Credential: ${escapeHtml(credId)} ↗</a>`;
          } else if (credUrl) {
            credHtml = `<a href="${escapeHtml(credUrl)}" target="_blank" rel="noopener noreferrer" class="cv-cert-link">Show credential ↗</a>`;
          } else if (credId) {
            credHtml = `<span class="cv-cert-id">Credential ID: ${escapeHtml(credId)}</span>`;
          }

          let metaHtml = '';
          if (formattedDate && credHtml) {
            metaHtml = `<div class="cv-cert-meta"><span class="cv-cert-date">${escapeHtml(formattedDate)}</span><span class="cv-cert-sep"> · </span>${credHtml}</div>`;
          } else if (formattedDate) {
            metaHtml = `<div class="cv-cert-meta"><span class="cv-cert-date">${escapeHtml(formattedDate)}</span></div>`;
          } else if (credHtml) {
            metaHtml = `<div class="cv-cert-meta">${credHtml}</div>`;
          }

          const detailsHtml = cert.details && cert.details.trim()
            ? `<div class="cv-cert-details">${escapeHtml(cert.details.trim())}</div>`
            : '';

          const issuerHtml = cert.issuer && cert.issuer.trim()
            ? `<div class="cv-cert-issuer">${escapeHtml(cert.issuer.trim())}</div>`
            : '';

          const item = document.createElement('div');
          item.className = 'cv-cert-item';
          item.innerHTML = `
            <div class="cv-cert-title">${title}</div>
            ${issuerHtml}
            ${metaHtml}
            ${detailsHtml}
          `;

          target.appendChild(item);

          if (isPageOverflowing(currentPage) && (itemsInSec > 0 || currentContent.children.length > 1)) {
            target.removeChild(item);
            if (target.children.length === 0) {
              currentContent.removeChild(currentSec);
            }
            advanceToNewPage();
            currentSec = createCertShell(true);
            currentContent.appendChild(currentSec);
            target = currentSec.querySelector('.cv-cert-list');
            target.appendChild(item);
            itemsInSec = 0;
          }
          itemsInSec++;
        });
      },

      projects: () => {
        if (!cvData.projects || cvData.projects.length === 0 || !cvData.settings.showProjects) return;

        function createProjShell(isContinued = false) {
          const sec = document.createElement('section');
          sec.className = `cv-section${isContinued ? ' cv-section-continued' : ''}`;
          sec.dataset.sectionKey = 'projects';
          const label = isContinued ? ' <span class="cv-section-cont-label">(Continued)</span>' : '';
          sec.innerHTML = `
            <div class="cv-section-row" style="margin-bottom: 8px;">
              <div class="cv-section-title">PROJECTS${label}</div>
              <div class="cv-section-content"></div>
            </div>
          `;
          return sec;
        }

        let currentSec = createProjShell(false);
        currentContent.appendChild(currentSec);
        let itemsInSec = 0;

        cvData.projects.forEach(proj => {
          const projectUrl = (proj.projectUrl || proj.link || '').trim();
          let titleHtml = escapeHtml(proj.projectName || '');
          if (projectUrl) {
            titleHtml = `<a href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener noreferrer" class="cv-proj-link">${titleHtml} ↗</a>`;
          }
          const roleHtml = proj.role && proj.role.trim()
            ? `<span class="cv-job-company">${escapeHtml(proj.role.trim())}</span>`
            : '';
          const titleRole = titleHtml + (titleHtml && roleHtml ? ' — ' : '') + roleHtml;

          const descText = (proj.description || proj.shortDesc || '').trim();
          const descHtml = descText
            ? `<div class="cv-proj-desc">${escapeHtml(descText)}</div>`
            : '';

          const entry = document.createElement('div');
          entry.className = 'cv-proj-entry';
          entry.innerHTML = `
            <div class="cv-job-date">${escapeHtml(proj.dateRange || '')}</div>
            <div class="cv-job-main">
              <div class="cv-job-header">${titleRole}</div>
              ${descHtml}
            </div>
          `;

          currentSec.appendChild(entry);

          if (isPageOverflowing(currentPage) && (itemsInSec > 0 || currentContent.children.length > 1)) {
            currentSec.removeChild(entry);
            if (currentSec.querySelectorAll('.cv-proj-entry').length === 0) {
              currentContent.removeChild(currentSec);
            }
            advanceToNewPage();
            currentSec = createProjShell(true);
            currentContent.appendChild(currentSec);
            currentSec.appendChild(entry);
            itemsInSec = 0;
          }
          itemsInSec++;
        });
      },

      languages: () => {
        if (!cvData.languages || cvData.languages.length === 0 || cvData.settings.showLanguages === false) return;
        const langItemsHtml = cvData.languages
          .filter(l => l && l.name && l.name.trim())
          .map(l => {
            const prof = l.proficiency && l.proficiency.trim() ? ` — <span class="cv-lang-proficiency">${escapeHtml(l.proficiency.trim())}</span>` : '';
            const info = l.info && l.info.trim() ? ` <span class="cv-lang-proficiency">(${escapeHtml(l.info.trim())})</span>` : '';
            return `<div class="cv-lang-item"><strong>${escapeHtml(l.name.trim())}</strong>${prof}${info}</div>`;
          })
          .join('');

        if (!langItemsHtml) return;

        const sec = document.createElement('section');
        sec.className = 'cv-section';
        sec.dataset.sectionKey = 'languages';
        sec.innerHTML = `
          <div class="cv-section-row">
            <div class="cv-section-title">LANGUAGES</div>
            <div class="cv-section-content cv-languages-list">
              ${langItemsHtml}
            </div>
          </div>
        `;

        currentContent.appendChild(sec);

        if (isPageOverflowing(currentPage) && currentContent.children.length > 1) {
          currentContent.removeChild(sec);
          advanceToNewPage();
          currentContent.appendChild(sec);
        }
      }
    };

    // Render configured section order
    const order = (cvData.settings && Array.isArray(cvData.settings.sectionOrder))
      ? cvData.settings.sectionOrder
      : (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? DEFAULT_SECTION_ORDER : ['links', 'summary', 'skills', 'employment', 'education', 'certifications', 'projects', 'languages']);

    order.forEach(secKey => {
      if (typeof sectionHandlers[secKey] === 'function') {
        sectionHandlers[secKey]();
      }
    });

    // Update footer and badge numbering on all generated pages
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      const num = idx + 1;
      const badge = p.querySelector('.cv-page-badge span');
      if (badge) badge.textContent = `PAGE ${num} (A4)`;
      const footer = p.querySelector('.cv-page-footer');
      if (footer) footer.textContent = `Page ${num} of ${totalPages}`;
    });

    if (pageHeightStatus) {
      if (totalPages > 1) {
        pageHeightStatus.textContent = `${totalPages} Pages (A4)`;
        pageHeightStatus.classList.add('overflow');
      } else {
        pageHeightStatus.textContent = "1 Page (A4 Fit)";
        pageHeightStatus.classList.remove('overflow');
      }
    }

    refreshZoomHeight();
  }

  // Font family helper
  function getFontFamilyCSS(font) {
    switch (font) {
      case 'Georgia':
        return 'Georgia, serif';
      case 'Times New Roman':
        return '"Times New Roman", Times, serif';
      case 'Merriweather':
        return '"Merriweather", Georgia, serif';
      case 'Inter':
        return '"Inter", -apple-system, sans-serif';
      case 'EB Garamond':
      default:
        return '"EB Garamond", Georgia, "Times New Roman", serif';
    }
  }

  // ==========================================================================
  // Page Height & Multi-page Indicator
  // ==========================================================================
  function checkPageOverflow() {
    renderA4PageBreaks();
  }

  // ==========================================================================
  // Zoom Controls & Smooth Multi-Page Scrolling
  // ==========================================================================
  function refreshZoomHeight() {
    if (!cvPaperWrapper || !cvDocument) return;
    requestAnimationFrame(() => {
      const layoutH = cvDocument.offsetHeight;
      const visH = layoutH * currentZoom;
      const compensate = layoutH - visH;
      // Compensate margin bottom so the scroll area ends right after the visible paper bottom + padding
      cvPaperWrapper.style.marginBottom = `${-(compensate - 60)}px`;
    });
  }

  let updateZoom = null;

  function bindZoomControls() {
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    updateZoom = (z) => {
      currentZoom = Math.min(Math.max(z, 0.4), 1.6);
      if (zoomIndicator) {
        zoomIndicator.textContent = `${Math.round(currentZoom * 100)}%`;
      }

      cvPaperWrapper.style.transformOrigin = 'top center';
      cvPaperWrapper.style.transform = `scale(${currentZoom})`;
      refreshZoomHeight();
    };

    window.getCurrentZoom = () => currentZoom;
    window.setZoom = (z) => { if (updateZoom) updateZoom(z); };

    btnZoomIn.onclick = () => updateZoom(currentZoom + 0.1);
    btnZoomOut.onclick = () => updateZoom(currentZoom - 0.1);
    btnZoomReset.onclick = () => updateZoom(1.0);

    btnZoomFit.onclick = () => {
      if (!previewViewport) return;
      const availableWidth = previewViewport.clientWidth - 50;
      const paperWidthPx = 793.7; // 210mm in px at 96dpi
      const fitScale = Math.min(Math.max(availableWidth / paperWidthPx, 0.4), 1.0);
      updateZoom(fitScale);
    };

    // Initial zoom application
    updateZoom(1.0);

    // Auto fit on initial load for compact screens
    if (window.innerWidth < 1440) {
      setTimeout(() => btnZoomFit.click(), 150);
    }
  }

  function handleWindowResize() {
    if (!previewViewport || !updateZoom) return;
    const paperWidthPx = 793.7;
    const availableWidth = previewViewport.clientWidth - 50;
    if (availableWidth < paperWidthPx * currentZoom) {
      const fitScale = Math.max(availableWidth / paperWidthPx, 0.4);
      updateZoom(fitScale);
    } else {
      refreshZoomHeight();
    }
  }

  // ==========================================================================
  // Header Actions (Export Word, Export PDF, Print, JSON Backup & Restore)
  // ==========================================================================
  function bindHeaderActions() {
    // 1. Export Word (.docx)
    document.getElementById('btn-export-docx').onclick = async () => {
      const btn = document.getElementById('btn-export-docx');
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg> <span>Menyiapkan Word...</span>`;
      btn.disabled = true;

      try {
        await window.CVWordExporter.exportDocx(cvData);
      } catch (err) {
        console.error(err);
        alert("Gagal mengunduh file Word (.docx): " + err.message);
      } finally {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    };

    // 2. Direct Export PDF
    document.getElementById('btn-export-pdf').onclick = async () => {
      await window.CVPdfExporter.exportDirectPdf(cvData);
    };

    // 3. Print / Vector PDF
    document.getElementById('btn-print').onclick = () => {
      window.CVPdfExporter.printVectorPdf();
    };

    // 4. Save to File (Local server API / File System Access API / Download)
    let currentFileHandle = null;

    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      const iconSvg = type === 'success'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }

    async function saveCVToFile(promptSaveAs = false) {
      const jsonStr = JSON.stringify(cvData, null, 2);
      const safeName = (cvData.personal.fullName || 'cv_data').replace(/[^a-zA-Z0-9_-]/g, '_');
      const defaultFilename = `${safeName}_data.json`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // 1. Try local server endpoint if on http/https
      if (window.location.protocol.startsWith('http') && !promptSaveAs) {
        try {
          const resp = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonStr
          });
          if (resp.ok) {
            const res = await resp.json();
            if (res.success) {
              showToast(`Data berhasil disimpan ke file: ${res.file} (${nowTime})`);
              if (autosaveStatus) {
                autosaveStatus.textContent = `Tersimpan di ${res.file} (${nowTime})`;
                autosaveStatus.style.color = '#34d399';
              }
              return;
            }
          }
        } catch (e) {
          // Fallback to browser file saving
        }
      }

      // 2. Try modern File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          if (!currentFileHandle || promptSaveAs) {
            currentFileHandle = await window.showSaveFilePicker({
              suggestedName: defaultFilename,
              types: [{
                description: 'File Data CV (JSON)',
                accept: { 'application/json': ['.json'] }
              }]
            });
          }
          const writable = await currentFileHandle.createWritable();
          await writable.write(jsonStr);
          await writable.close();
          const fname = currentFileHandle.name || defaultFilename;
          showToast(`Data berhasil disimpan ke file: ${fname} (${nowTime})`);
          if (autosaveStatus) {
            autosaveStatus.textContent = `Tersimpan di ${fname} (${nowTime})`;
            autosaveStatus.style.color = '#34d399';
          }
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.warn("showSaveFilePicker error, using download fallback:", err);
        }
      }

      // 3. Fallback: Instant browser file download
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      showToast(`File ${defaultFilename} berhasil disimpan (${nowTime})`);
      if (autosaveStatus) {
        autosaveStatus.textContent = `File diunduh (${nowTime})`;
        autosaveStatus.style.color = '#34d399';
      }
    }

    async function openCVFromFile() {
      if ('showOpenFilePicker' in window) {
        try {
          const [handle] = await window.showOpenFilePicker({
            types: [{
              description: 'File Data CV (JSON)',
              accept: { 'application/json': ['.json'] }
            }],
            multiple: false
          });
          const file = await handle.getFile();
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed && (parsed.personal || parsed.employment)) {
            currentFileHandle = handle;
            cvData = Object.assign({}, cloneCVData(DEFAULT_CV_DATA), parsed);
            normalizeCVData(cvData);
            saveData();
            populateForm();
            renderCV();
            checkPageOverflow();
            showToast(`File "${file.name}" berhasil dibuka!`);
            return;
          } else {
            alert("Format file JSON tidak sesuai struktur data CV.");
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.warn("showOpenFilePicker error, using fallback:", err);
        }
      }

      // Fallback: trigger hidden file input
      const fileInput = document.getElementById('json-file-input');
      if (fileInput) fileInput.click();
    }

    // Bind Save buttons
    const btnSaveFile = document.getElementById('btn-save-file');
    if (btnSaveFile) btnSaveFile.onclick = () => saveCVToFile();

    const btnSidebarSave = document.getElementById('btn-sidebar-save');
    if (btnSidebarSave) btnSidebarSave.onclick = () => saveCVToFile();

    // Bind Open File button
    const btnOpenFile = document.getElementById('btn-open-file');
    if (btnOpenFile) btnOpenFile.onclick = () => openCVFromFile();

    // Fallback file input change listener
    const fileInput = document.getElementById('json-file-input');
    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported && (imported.personal || imported.employment)) {
              cvData = Object.assign({}, cloneCVData(DEFAULT_CV_DATA), imported);
              normalizeCVData(cvData);
              saveData();
              populateForm();
              renderCV();
              checkPageOverflow();
              showToast(`File "${file.name}" berhasil dimuat!`);
            } else {
              alert("Format file JSON tidak sesuai struktur data CV.");
            }
          } catch (err) {
            alert("Gagal membaca file JSON: " + err.message);
          }
        };
        reader.readAsText(file);
        fileInput.value = '';
      };
    }

    // 5. Reset to Sample Data
    document.getElementById('btn-reset-data').onclick = () => {
      if (confirm("Kembalikan data ke contoh awal Fajar Sujito? Perubahan Anda saat ini akan direset.")) {
        cvData = cloneCVData(DEFAULT_CV_DATA);
        normalizeCVData(cvData);
        saveData();
        populateForm();
        renderCV();
        checkPageOverflow();
        showToast("Data berhasil direset ke contoh awal.");
      }
    };
  }

  // ==========================================================================
  // Mobile Drawer Toggle
  // ==========================================================================
  function bindMobileToggle() {
    const btnEditor = document.getElementById('btn-toggle-editor');
    const btnPreview = document.getElementById('btn-toggle-preview');
    const sidebar = document.getElementById('editor-sidebar');
    const preview = document.getElementById('preview-panel');

    if (!btnEditor || !btnPreview) return;

    btnEditor.onclick = () => {
      btnEditor.classList.add('active');
      btnPreview.classList.remove('active');
      sidebar.classList.remove('hidden-mobile');
      preview.classList.add('hidden-mobile');
    };

    btnPreview.onclick = () => {
      btnPreview.classList.add('active');
      btnEditor.classList.remove('active');
      sidebar.classList.add('hidden-mobile');
      preview.classList.remove('hidden-mobile');
      // Trigger fit
      document.getElementById('btn-zoom-fit').click();
    };
  }

  // ==========================================================================
  // Sanitization Helper
  // ==========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
