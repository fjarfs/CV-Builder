/**
 * PDF Generator & ATS Text Verification for Modern CV
 * Provides:
 * 1. Native High-Precision Vector PDF (100% real selectable text for ATS parsers)
 * 2. In-App Plain Text Extractor (to verify text sequence matches ATS expectations)
 */

window.CVPdfExporter = {
  /**
   * Main ATS Vector PDF Generator:
   * Uses browser print engine with dedicated @media print stylesheets.
   * Produces authentic vector PDF with embedded fonts, selectable text, and clickable links.
   */
  exportAtsVectorPdf: async function() {
    // 1. Wait for web fonts if still loading
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Ensure zoom is reset to 1.0 for exact millimeter rendering
    const originalZoom = (window.getCurrentZoom && typeof window.getCurrentZoom === 'function') 
      ? window.getCurrentZoom() 
      : 1.0;
    const previewViewport = document.getElementById('preview-viewport');
    const originalScrollTop = previewViewport ? previewViewport.scrollTop : 0;
    const originalScrollLeft = previewViewport ? previewViewport.scrollLeft : 0;

    try {
      if (window.setZoom && typeof window.setZoom === 'function') {
        window.setZoom(1.0);
      }
      if (previewViewport) {
        previewViewport.scrollTop = 0;
        previewViewport.scrollLeft = 0;
      }

      // 3. Briefly notify user if toast system exists
      if (typeof window.showToast === 'function') {
        window.showToast("Membuka dialog cetak... Pilih 'Save as PDF' untuk menyimpan PDF teks asli ATS.", 'success');
      }

      // Small delay for viewport reflow before opening print dialog
      await new Promise(resolve => setTimeout(resolve, 120));

      // 4. Trigger native browser print dialog
      window.print();
    } finally {
      // 5. Restore user zoom & scroll
      if (window.setZoom && typeof window.setZoom === 'function') {
        window.setZoom(originalZoom);
      }
      if (previewViewport) {
        previewViewport.scrollTop = originalScrollTop;
        previewViewport.scrollLeft = originalScrollLeft;
      }
    }
  },

  // Alias for backward compatibility
  printVectorPdf: function() {
    this.exportAtsVectorPdf();
  },

  exportDirectPdf: async function() {
    await this.exportAtsVectorPdf();
  },

  /**
   * Generates pure sequential plain text of the CV exactly as an ATS parser would read it.
   */
  getAtsPlainText: function(cvData) {
    if (!cvData) return "";
    const lines = [];

    // Header
    const p = cvData.personal || {};
    if (p.fullName) lines.push(p.fullName.toUpperCase());
    if (p.jobTitle) lines.push(p.jobTitle);
    
    const contactParts = [];
    if (p.location) contactParts.push(p.location);
    if (p.phone) contactParts.push(p.phone);
    if (p.email) contactParts.push(p.email);
    if (contactParts.length) lines.push(contactParts.join(" | "));

    // Links
    if (cvData.links && cvData.links.length) {
      lines.push("");
      lines.push("LINKS");
      cvData.links.forEach(l => {
        lines.push(`${l.label}: ${l.url}`);
      });
    }

    // Summary
    if (cvData.summary) {
      lines.push("");
      lines.push("PROFESSIONAL SUMMARY");
      lines.push(cvData.summary.trim());
    }

    // Skills
    if (cvData.skills) {
      lines.push("");
      lines.push("SKILLS");
      const c1 = cvData.skills.column1 || [];
      const c2 = cvData.skills.column2 || [];
      const allSkills = [...c1, ...c2];
      lines.push(allSkills.join(" • "));
    }

    // Work Experience
    if (cvData.employment && cvData.employment.length) {
      lines.push("");
      lines.push("WORK EXPERIENCE");
      cvData.employment.forEach(job => {
        const roles = Array.isArray(job.roles) && job.roles.length ? job.roles : [job];
        roles.forEach(role => {
          const title = role.jobTitle || "";
          const company = job.company || "";
          const dates = role.dateRange || job.companyDateRange || "";
          const headerLine = [title, company, dates].filter(Boolean).join(" | ");
          lines.push("");
          lines.push(headerLine);

          const bullets = role.bullets || [];
          bullets.forEach(b => {
            if (b && b.trim()) lines.push(`• ${b.trim()}`);
          });

          if (role.techStack) {
            lines.push(`Technologies: ${role.techStack}`);
          }
        });
      });
    }

    // Education
    if (cvData.education && cvData.education.length && cvData.settings?.showEducation !== false) {
      lines.push("");
      lines.push("EDUCATION");
      cvData.education.forEach(edu => {
        const line = [edu.degree, edu.institution, edu.dateRange].filter(Boolean).join(" | ");
        lines.push(line);
        if (edu.details) lines.push(edu.details);
      });
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length && cvData.settings?.showCertifications !== false) {
      lines.push("");
      lines.push("CERTIFICATIONS");
      cvData.certifications.forEach(cert => {
        const line = [cert.name, cert.issuer, cert.dateRange].filter(Boolean).join(" | ");
        lines.push(line);
        if (cert.credentialId) lines.push(`Credential ID: ${cert.credentialId}`);
      });
    }

    // Projects
    if (cvData.projects && cvData.projects.length && cvData.settings?.showProjects !== false) {
      lines.push("");
      lines.push("PROJECTS");
      cvData.projects.forEach(proj => {
        const line = [proj.projectName, proj.role, proj.dateRange].filter(Boolean).join(" | ");
        lines.push(line);
        if (proj.description) lines.push(proj.description);
        if (proj.projectUrl) lines.push(proj.projectUrl);
      });
    }

    // Languages
    if (cvData.languages && cvData.languages.length && cvData.settings?.showLanguages !== false) {
      lines.push("");
      lines.push("LANGUAGES");
      cvData.languages.forEach(l => {
        lines.push(`${l.name} (${l.proficiency})`);
      });
    }

    return lines.join("\n");
  }
};
