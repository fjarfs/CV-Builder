/**
 * DOCX Generator for Modern CV
 * Uses window.docx library (docx.js) to generate a pixel-faithful .docx document
 * matching the executive 2-column ATS serif layout.
 */

window.CVWordExporter = {
  exportDocx: async function(cvData) {
    if (!window.docx) {
      alert("DOCX library is not loaded. Please check your internet connection or local scripts.");
      return;
    }

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      WidthType,
      BorderStyle,
      AlignmentType,
      ExternalHyperlink,
      convertInchesToTwip
    } = window.docx;

    const fontName = cvData.settings && cvData.settings.fontFamily ? cvData.settings.fontFamily : "EB Garamond";
    const primaryColor = "111111";
    const mutedColor = "444444";
    const dividerColor = "222222";

    const noBorder = {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }
    };

    const sectionBorder = {
      top: { style: BorderStyle.SINGLE, size: 8, color: dividerColor },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    };

    const docChildren = [];

    // 1. Header (Centered Name, Title & Contacts)
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: cvData.personal.jobTitle ? 30 : 70 },
        children: [
          new TextRun({
            text: cvData.personal.fullName || 'Full Name',
            bold: true,
            size: 28, // 14pt
            font: fontName,
            color: primaryColor
          })
        ]
      })
    );

    if (cvData.personal.jobTitle && cvData.personal.jobTitle.trim()) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 70 },
          children: [
            new TextRun({
              text: cvData.personal.jobTitle.trim(),
              bold: true,
              size: 21, // 10.5pt
              font: fontName,
              color: "2b2b2b"
            })
          ]
        })
      );
    }

    const contactParts = [];
    if (cvData.personal.location) contactParts.push(cvData.personal.location);
    if (cvData.personal.phone) contactParts.push(cvData.personal.phone);
    if (cvData.personal.email) contactParts.push(cvData.personal.email);

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 180 },
        children: [
          new TextRun({
            text: contactParts.join(", "),
            size: 19, // 9.5pt
            font: fontName,
            color: mutedColor
          })
        ]
      })
    );

    // Helper: Create Section Table
    function createSectionTable(sectionTitle, rightCellContent) {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sectionBorder,
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: sectionTitle.toUpperCase(),
                        bold: true,
                        size: 19, // 9.5pt
                        font: fontName,
                        color: primaryColor
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: rightCellContent
              })
            ]
          })
        ]
      });
    }

    // Collect Section Elements for Dynamic Ordering
    const linksElements = [];
    const summaryElements = [];
    const skillsElements = [];
    const employmentElements = [];
    const educationElements = [];
    const certificationsElements = [];
    const projectsElements = [];
    const languagesElements = [];

    // 2. LINKS SECTION
    if (cvData.links && cvData.links.length > 0) {
      const linkRuns = [];
      cvData.links.forEach((link, idx) => {
        linkRuns.push(
          new TextRun({
            text: link.label || link.url,
            underline: {},
            size: 19,
            font: fontName,
            color: "000000"
          })
        );
        if (idx < cvData.links.length - 1) {
          linkRuns.push(new TextRun({ text: ", ", size: 19, font: fontName }));
        }
      });

      const linksPara = new Paragraph({
        spacing: { before: 40, after: 40 },
        children: linkRuns
      });

      linksElements.push(createSectionTable("LINKS", [linksPara]));
      linksElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 3. PROFESSIONAL SUMMARY SECTION
    if (cvData.summary && cvData.summary.trim()) {
      const summaryParas = cvData.summary.trim()
        .split(/\r?\n+/)
        .map((pText, pIdx, arr) => new Paragraph({
          spacing: {
            before: pIdx === 0 ? 40 : 40,
            after: pIdx === arr.length - 1 ? 40 : 60,
            line: 260
          },
          children: [
            new TextRun({
              text: pText.trim(),
              size: 19,
              font: fontName,
              color: primaryColor
            })
          ]
        }));

      summaryElements.push(createSectionTable("PROFESSIONAL SUMMARY", summaryParas));
      summaryElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 4. AREAS OF EXPERTISE (Skills)
    if (cvData.skills) {
      const col1 = cvData.skills.column1 || [];
      const col2 = cvData.skills.column2 || [];

      const col1Paras = col1.map(
        skill =>
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: skill, size: 19, font: fontName, color: primaryColor })]
          })
      );
      const col2Paras = col2.map(
        skill =>
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: skill, size: 19, font: fontName, color: primaryColor })]
          })
      );

      const skillsSubTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: col1Paras.length > 0 ? col1Paras : [new Paragraph({ children: [] })]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: col2Paras.length > 0 ? col2Paras : [new Paragraph({ children: [] })]
              })
            ]
          })
        ]
      });

      skillsElements.push(createSectionTable("AREAS OF EXPERTISE", [skillsSubTable]));
      skillsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 5. EMPLOYMENT HISTORY
    if (cvData.employment && cvData.employment.length > 0) {
      const historyRows = [];

      // Row 1: Section Header
      historyRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 40 },
                  children: [
                    new TextRun({
                      text: "EMPLOYMENT HISTORY",
                      bold: true,
                      size: 19,
                      font: fontName,
                      color: primaryColor
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [new Paragraph({ children: [] })]
            })
          ]
        })
      );

      // Rows for each job
      cvData.employment.forEach(job => {
        const roles = Array.isArray(job.roles) && job.roles.length > 0 ? job.roles : [
          {
            jobTitle: job.jobTitle || '',
            dateRange: job.dateRange || '',
            bullets: job.bullets || [],
            techStack: job.techStack || ''
          }
        ];

        // 1. Company Header Row
        const companyRuns = [
          new TextRun({
            text: job.company || "",
            bold: true,
            size: 20,
            font: fontName,
            color: primaryColor
          })
        ];

        if (job.employmentType && job.employmentType.trim()) {
          companyRuns.push(
            new TextRun({
              text: ` · ${job.employmentType.trim()}`,
              italics: true,
              size: 18.5,
              font: fontName,
              color: mutedColor
            })
          );
        }

        historyRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 60, after: 20 },
                    children: [
                      new TextRun({
                        text: job.companyDateRange || "",
                        bold: true,
                        size: 18.5,
                        font: fontName,
                        color: primaryColor
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 60, after: 40 },
                    children: companyRuns
                  })
                ]
              })
            ]
          })
        );

        // 2. Each Role Row
        roles.forEach((role, rIdx) => {
          const rightChildren = [];
          rightChildren.push(
            new Paragraph({
              spacing: { before: 20, after: 20 },
              children: [
                new TextRun({
                  text: role.jobTitle || "",
                  bold: true,
                  size: 19,
                  font: fontName,
                  color: primaryColor
                })
              ]
            })
          );

          if (role.bullets && role.bullets.length > 0) {
            role.bullets.forEach(b => {
              if (b && b.trim()) {
                rightChildren.push(
                  new Paragraph({
                    bullet: { level: 0 },
                    spacing: { before: 20, after: 20, line: 250 },
                    children: [
                      new TextRun({
                        text: b.trim(),
                        size: 18.5,
                        font: fontName,
                        color: primaryColor
                      })
                    ]
                  })
                );
              }
            });
          }

          const isLast = rIdx === roles.length - 1;
          if (role.techStack && role.techStack.trim()) {
            rightChildren.push(
              new Paragraph({
                spacing: { before: 30, after: isLast ? 120 : 60 },
                children: [
                  new TextRun({
                    text: `Tech Stack: ${role.techStack.trim()}`,
                    size: 18.5,
                    font: fontName,
                    color: mutedColor
                  })
                ]
              })
            );
          } else {
            rightChildren.push(new Paragraph({ spacing: { after: isLast ? 100 : 50 } }));
          }

          historyRows.push(
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      spacing: { before: 20, after: 20 },
                      children: [
                        new TextRun({
                          text: role.dateRange || "",
                          size: 18.5,
                          font: fontName,
                          color: mutedColor
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: rightChildren
                })
              ]
            })
          );
        });
      });

      const employmentTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sectionBorder,
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        rows: historyRows
      });

      employmentElements.push(employmentTable);
      employmentElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 6. EDUCATION (if enabled or present)
    if (cvData.education && cvData.education.length > 0 && cvData.settings.showEducation !== false) {
      const eduRows = [];

      eduRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 40 },
                  children: [
                    new TextRun({
                      text: "EDUCATION",
                      bold: true,
                      size: 19,
                      font: fontName,
                      color: primaryColor
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [new Paragraph({ children: [] })]
            })
          ]
        })
      );

      cvData.education.forEach(edu => {
        const eduRight = [];
        const eduTitle = `${edu.degree || ''}${edu.degree && edu.institution ? ', ' : ''}${edu.institution || ''}`;
        eduRight.push(
          new Paragraph({
            spacing: { before: 40, after: 30 },
            children: [
              new TextRun({
                text: eduTitle,
                bold: true,
                size: 19.5,
                font: fontName,
                color: primaryColor
              })
            ]
          })
        );

        if (edu.details && edu.details.trim()) {
          eduRight.push(
            new Paragraph({
              spacing: { before: 20, after: 80 },
              children: [
                new TextRun({
                  text: edu.details.trim(),
                  size: 18.5,
                  font: fontName,
                  color: mutedColor
                })
              ]
            })
          );
        }

        eduRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 40, after: 20 },
                    children: [
                      new TextRun({
                        text: edu.dateRange || "",
                        size: 18.5,
                        font: fontName,
                        color: mutedColor
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: eduRight
              })
            ]
          })
        );
      });

      const eduTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sectionBorder,
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        rows: eduRows
      });

      educationElements.push(eduTable);
      educationElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 7. CERTIFICATES (if enabled)
    if (cvData.certifications && cvData.certifications.length > 0 && cvData.settings.showCertifications !== false) {
      const certChildren = [];

      cvData.certifications.forEach((cert, cIdx) => {
        if (!cert || !cert.name || !cert.name.trim()) return;

        const isFirst = cIdx === 0;
        // Title line
        certChildren.push(
          new Paragraph({
            spacing: { before: isFirst ? 40 : 160, after: 15 },
            children: [
              new TextRun({
                text: cert.name.trim(),
                bold: true,
                size: 19.5,
                font: fontName,
                color: primaryColor
              })
            ]
          })
        );

        // Issuer line (below title)
        if (cert.issuer && cert.issuer.trim()) {
          certChildren.push(
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: cert.issuer.trim(),
                  size: 18.5,
                  font: fontName,
                  color: primaryColor
                })
              ]
            })
          );
        }

        let dateText = cert.dateRange ? cert.dateRange.trim() : '';
        let formattedDate = '';
        if (dateText) {
          formattedDate = /^issued/i.test(dateText) ? dateText : `Issued ${dateText}`;
        }

        const credUrl = cert.credentialUrl && cert.credentialUrl.trim() ? cert.credentialUrl.trim() : '';
        const credId = cert.credentialId && cert.credentialId.trim() ? cert.credentialId.trim() : '';

        const metaRuns = [];
        if (formattedDate) {
          metaRuns.push(
            new TextRun({
              text: formattedDate,
              italics: true,
              size: 18,
              font: fontName,
              color: mutedColor
            })
          );
        }

        if (formattedDate && (credUrl || credId)) {
          metaRuns.push(
            new TextRun({
              text: " · ",
              size: 18,
              font: fontName,
              color: mutedColor
            })
          );
        }

        if (credUrl) {
          const linkLabel = credId ? `Credential: ${credId} ↗` : "Show credential ↗";
          metaRuns.push(
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: linkLabel,
                  size: 18,
                  font: fontName,
                  color: "1d4ed8",
                  underline: {}
                })
              ],
              link: credUrl
            })
          );
        } else if (credId) {
          metaRuns.push(
            new TextRun({
              text: `Credential ID: ${credId}`,
              size: 18,
              font: fontName,
              color: mutedColor
            })
          );
        }

        if (metaRuns.length > 0) {
          certChildren.push(
            new Paragraph({
              spacing: { before: 0, after: cert.details && cert.details.trim() ? 20 : 40 },
              children: metaRuns
            })
          );
        }

        if (cert.details && cert.details.trim()) {
          certChildren.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: cert.details.trim(),
                  size: 18.5,
                  font: fontName,
                  color: mutedColor
                })
              ]
            })
          );
        }
      });

      if (certChildren.length > 0) {
        const certTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: sectionBorder,
          margins: { top: 120, bottom: 120, left: 60, right: 60 },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({
                          text: "CERTIFICATES",
                          bold: true,
                          size: 19,
                          font: fontName,
                          color: primaryColor
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: certChildren
                })
              ]
            })
          ]
        });

        certificationsElements.push(certTable);
        certificationsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
      }
    }

    // 8. PROJECTS (if enabled)
    if (cvData.projects && cvData.projects.length > 0 && cvData.settings.showProjects) {
      const projRows = [];

      projRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 40 },
                  children: [
                    new TextRun({
                      text: "PROJECTS",
                      bold: true,
                      size: 19,
                      font: fontName,
                      color: primaryColor
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [new Paragraph({ children: [] })]
            })
          ]
        })
      );

      cvData.projects.forEach(proj => {
        const projRight = [];
        const projectUrl = (proj.projectUrl || proj.link || '').trim();
        const titleRuns = [];

        if (projectUrl) {
          titleRuns.push(
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: proj.projectName || '',
                  bold: true,
                  size: 19.5,
                  font: fontName,
                  underline: {},
                  color: "1d4ed8"
                }),
                new TextRun({
                  text: " ↗",
                  size: 18,
                  font: fontName,
                  color: "1d4ed8"
                })
              ],
              link: projectUrl
            })
          );
        } else {
          titleRuns.push(
            new TextRun({
              text: proj.projectName || '',
              bold: true,
              size: 19.5,
              font: fontName,
              color: primaryColor
            })
          );
        }

        if (proj.role && proj.role.trim()) {
          titleRuns.push(
            new TextRun({
              text: proj.projectName ? ` — ${proj.role.trim()}` : proj.role.trim(),
              size: 19.5,
              font: fontName,
              color: primaryColor
            })
          );
        }

        projRight.push(
          new Paragraph({
            spacing: { before: 40, after: 30 },
            children: titleRuns
          })
        );

        const descText = (proj.description || proj.shortDesc || '').trim();
        if (descText) {
          projRight.push(
            new Paragraph({
              spacing: { before: 20, after: 40, line: 260 },
              children: [
                new TextRun({
                  text: descText,
                  size: 18.5,
                  font: fontName,
                  color: mutedColor
                })
              ]
            })
          );
        }

        projRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 40, after: 20 },
                    children: [
                      new TextRun({
                        text: proj.dateRange || "",
                        size: 18.5,
                        font: fontName,
                        color: mutedColor
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: projRight
              })
            ]
          })
        );
      });

      const projTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sectionBorder,
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        rows: projRows
      });

      projectsElements.push(projTable);
      projectsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }

    // 9. LANGUAGES (if enabled)
    if (cvData.languages && cvData.languages.length > 0 && cvData.settings.showLanguages !== false) {
      const langParas = [];
      cvData.languages.forEach(l => {
        if (!l || !l.name || !l.name.trim()) return;
        const runs = [
          new TextRun({
            text: l.name.trim(),
            bold: true,
            size: 19,
            font: fontName,
            color: primaryColor
          })
        ];

        let extra = '';
        if (l.proficiency && l.proficiency.trim()) {
          extra += ` — ${l.proficiency.trim()}`;
        }
        if (l.info && l.info.trim()) {
          extra += ` (${l.info.trim()})`;
        }
        if (extra) {
          runs.push(
            new TextRun({
              text: extra,
              size: 18.5,
              font: fontName,
              color: mutedColor
            })
          );
        }

        langParas.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            children: runs
          })
        );
      });

      if (langParas.length > 0) {
        const langTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: sectionBorder,
          margins: { top: 120, bottom: 120, left: 60, right: 60 },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      spacing: { before: 40, after: 40 },
                      children: [
                        new TextRun({
                          text: "LANGUAGES",
                          bold: true,
                          size: 19,
                          font: fontName,
                          color: primaryColor
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: langParas
                })
              ]
            })
          ]
        });

        languagesElements.push(langTable);
        languagesElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
      }
    }

    // Append Sections in User-Configured Order
    const sectionDocxMap = {
      links: linksElements,
      summary: summaryElements,
      skills: skillsElements,
      employment: employmentElements,
      education: educationElements,
      certifications: certificationsElements,
      projects: projectsElements,
      languages: languagesElements
    };

    const order = (cvData.settings && Array.isArray(cvData.settings.sectionOrder))
      ? cvData.settings.sectionOrder
      : (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? DEFAULT_SECTION_ORDER : Object.keys(sectionDocxMap));

    order.forEach(key => {
      const items = sectionDocxMap[key];
      if (Array.isArray(items)) {
        items.forEach(el => docChildren.push(el));
      }
    });

    // Build the Document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 in = 12.7 mm
                right: 720,
                bottom: 720,
                left: 720
              }
            }
          },
          children: docChildren
        }
      ]
    });

    // Generate and Download
    try {
      const blob = await Packer.toBlob(doc);
      const safeName = (cvData.personal.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}_CV.docx`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      return true;
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
      alert("Error generating Word document: " + err.message);
      return false;
    }
  }
};
