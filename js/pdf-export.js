/**
 * PDF Generator for Modern CV
 * Supports both:
 * 1. Direct one-click PDF download via jsPDF + html2canvas (page-by-page assembly)
 * 2. High-precision vector PDF via browser print dialog
 */

window.CVPdfExporter = {
  exportDirectPdf: async function(cvData) {
    const cvElement = document.getElementById('cv-document');
    if (!cvElement) {
      alert("CV document preview not found.");
      return;
    }

    const safeName = (cvData && cvData.personal && cvData.personal.fullName 
      ? cvData.personal.fullName 
      : 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_CV.pdf`;

    // Show indicator
    const btn = document.getElementById('btn-export-pdf');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg> Generating PDF...`;
    }

    // Save current zoom and scroll state
    const originalZoom = (window.getCurrentZoom && typeof window.getCurrentZoom === 'function') 
      ? window.getCurrentZoom() 
      : 1.0;
    const previewViewport = document.getElementById('preview-viewport');
    const originalScrollTop = previewViewport ? previewViewport.scrollTop : 0;
    const originalScrollLeft = previewViewport ? previewViewport.scrollLeft : 0;

    try {
      // 1. Temporarily reset zoom to 1.0 so html2canvas renders exact 210mm (100% scale)
      if (window.setZoom && typeof window.setZoom === 'function') {
        window.setZoom(1.0);
      }
      if (previewViewport) {
        previewViewport.scrollTop = 0;
        previewViewport.scrollLeft = 0;
      }

      // 2. Add PDF export mode class (hides badges, normalizes margins)
      cvElement.classList.add('pdf-export-mode');

      // 3. Ensure all web fonts are completely rendered before rasterizing
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Give browser layout a brief tick to stabilize
      await new Promise(resolve => setTimeout(resolve, 80));

      const pages = Array.from(cvElement.querySelectorAll('.cv-page'));
      if (pages.length === 0) {
        throw new Error("No CV pages found to export.");
      }

      // Direct page-by-page assembly via jsPDF + html2canvas
      // This completely eliminates any slicing bugs, rounding gaps, or double-breaks.
      const hasJsPdf = typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined';
      const hasHtml2Canvas = typeof html2canvas !== 'undefined';

      if (hasJsPdf && hasHtml2Canvas) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        });

        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i];
          if (btn) {
            btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg> Halaman ${i + 1}/${pages.length}...`;
          }

          if (i > 0) {
            pdf.addPage('a4', 'portrait');
          }

          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            logging: false,
            backgroundColor: '#ffffff',
            width: pageEl.offsetWidth,
            height: pageEl.offsetHeight
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          // Exactly 210mm x 297mm - 100% 1-to-1 mapping
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        }

        pdf.save(filename);
      } else if (typeof html2pdf !== 'undefined') {
        // Fallback to html2pdf
        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true
          },
          pagebreak: {
            mode: 'legacy'
          }
        };
        await html2pdf().set(opt).from(cvElement).save();
      } else {
        alert("PDF export library not loaded. Please use the Print / Vector PDF button.");
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Encountered an issue generating direct PDF. You can also use the 'Print / Vector PDF' button for an ultra-sharp PDF!");
    } finally {
      // Restore clean preview state
      cvElement.classList.remove('pdf-export-mode');
      if (window.setZoom && typeof window.setZoom === 'function') {
        window.setZoom(originalZoom);
      }
      if (previewViewport) {
        previewViewport.scrollTop = originalScrollTop;
        previewViewport.scrollLeft = originalScrollLeft;
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  printVectorPdf: function() {
    // Triggers browser print with dedicated print stylesheet
    window.print();
  }
};
