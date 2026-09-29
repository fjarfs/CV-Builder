/**
 * CLI Generator to test or create a sample Word (.docx) file from terminal
 * Usage: node scripts/generate_sample.js
 */

const fs = require('fs');
const path = require('path');
const docx = require('../assets/libs/docx.umd.js');
const { DEFAULT_CV_DATA } = require('../js/data.js');

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
  ExternalHyperlink
} = docx;

async function buildSampleDocx() {
  const fontName = "EB Garamond";
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

  // Header (Centered Name, Title & Contacts)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: DEFAULT_CV_DATA.personal.jobTitle ? 30 : 70 },
      children: [
        new TextRun({
          text: DEFAULT_CV_DATA.personal.fullName || 'Full Name',
          bold: true,
          size: 28, // 14pt
          font: fontName,
          color: primaryColor
        })
      ]
    })
  );

  if (DEFAULT_CV_DATA.personal.jobTitle && DEFAULT_CV_DATA.personal.jobTitle.trim()) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 70 },
        children: [
          new TextRun({
            text: DEFAULT_CV_DATA.personal.jobTitle.trim(),
            bold: true,
            size: 21, // 10.5pt
            font: fontName,
            color: "2b2b2b"
          })
        ]
      })
    );
  }

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180 },
      children: [
        new TextRun({
          text: `${DEFAULT_CV_DATA.personal.location}, ${DEFAULT_CV_DATA.personal.phone}, ${DEFAULT_CV_DATA.personal.email}`,
          size: 19,
          font: fontName,
          color: mutedColor
        })
      ]
    })
  );

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
              children: rightCellContent
            })
          ]
        })
      ]
    });
  }

  // Section Elements for Dynamic Ordering
  const linksElements = [];
  const summaryElements = [];
  const skillsElements = [];
  const employmentElements = [];
  const educationElements = [];
  const certificationsElements = [];
  const projectsElements = [];
  const languagesElements = [];

  // Links
  const linkRuns = [];
  DEFAULT_CV_DATA.links.forEach((l, idx) => {
    linkRuns.push(new TextRun({ text: l.label, underline: {}, size: 19, font: fontName }));
    if (idx < DEFAULT_CV_DATA.links.length - 1) {
      linkRuns.push(new TextRun({ text: ', ', size: 19, font: fontName }));
    }
  });
  linksElements.push(createSectionTable("LINKS", [new Paragraph({ spacing: { before: 40, after: 40 }, children: linkRuns })]));
  linksElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));

  // Summary
  const summaryParas = DEFAULT_CV_DATA.summary.trim()
    .split(/\r?\n+/)
    .map((pText, pIdx, arr) => new Paragraph({
      spacing: {
        before: pIdx === 0 ? 40 : 40,
        after: pIdx === arr.length - 1 ? 40 : 60,
        line: 260
      },
      children: [new TextRun({ text: pText.trim(), size: 19, font: fontName, color: primaryColor })]
    }));

  summaryElements.push(createSectionTable("PROFESSIONAL SUMMARY", summaryParas));
  summaryElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));

  // Skills
  const col1Paras = DEFAULT_CV_DATA.skills.column1.map(s => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: s, size: 19, font: fontName })] }));
  const col2Paras = DEFAULT_CV_DATA.skills.column2.map(s => new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: s, size: 19, font: fontName })] }));
  const skillsSubTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorder, children: col1Paras }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorder, children: col2Paras })
        ]
      })
    ]
  });
  skillsElements.push(createSectionTable("AREAS OF EXPERTISE", [skillsSubTable]));
  skillsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));

  // Employment
  const historyRows = [];
  historyRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: noBorder,
          children: [
            new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [new TextRun({ text: "EMPLOYMENT HISTORY", bold: true, size: 19, font: fontName, color: primaryColor })]
            })
          ]
        }),
        new TableCell({ width: { size: 75, type: WidthType.PERCENTAGE }, borders: noBorder, children: [new Paragraph({ children: [] })] })
      ]
    })
  );

  DEFAULT_CV_DATA.employment.forEach(job => {
    const roles = Array.isArray(job.roles) && job.roles.length > 0 ? job.roles : [
      {
        jobTitle: job.jobTitle || '',
        dateRange: job.dateRange || '',
        bullets: job.bullets || [],
        techStack: job.techStack || ''
      }
    ];

    // 1. Company Header Row (always on top, whether 1 role or multiple roles)
    const companyRuns = [
      new TextRun({
        text: job.company || '',
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
                children: [new TextRun({ text: job.companyDateRange || '', bold: true, size: 18.5, font: fontName, color: primaryColor })]
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
          children: [new TextRun({ text: role.jobTitle || '', bold: true, size: 19, font: fontName, color: primaryColor })]
        })
      );

      (role.bullets || []).forEach(b => {
        if (b && b.trim()) {
          rightChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 20, after: 20, line: 250 },
              children: [new TextRun({ text: b.trim(), size: 18.5, font: fontName, color: primaryColor })]
            })
          );
        }
      });

      const isLast = rIdx === roles.length - 1;
      if (role.techStack && role.techStack.trim()) {
        rightChildren.push(
          new Paragraph({
            spacing: { before: 30, after: isLast ? 120 : 60 },
            children: [new TextRun({ text: `Tech Stack: ${role.techStack.trim()}`, size: 18.5, font: fontName, color: mutedColor })]
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
              children: [new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: role.dateRange || '', size: 18.5, font: fontName, color: mutedColor })] })]
            }),
            new TableCell({ width: { size: 75, type: WidthType.PERCENTAGE }, borders: noBorder, children: rightChildren })
          ]
        })
      );
    });
  });

  employmentElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: sectionBorder,
      margins: { top: 120, bottom: 120, left: 60, right: 60 },
      rows: historyRows
    })
  );
  employmentElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));

  // Education
  const educationList = DEFAULT_CV_DATA.education || [];
  if (educationList.length > 0) {
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

    educationList.forEach(edu => {
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

    educationElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: sectionBorder,
        margins: { top: 120, bottom: 120, left: 60, right: 60 },
        rows: eduRows
      })
    );
    educationElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
  }

  // Certificates
  const certList = DEFAULT_CV_DATA.certifications || [];
  if (certList.length > 0) {
    const certChildren = [];

    certList.forEach((cert, cIdx) => {
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
      certificationsElements.push(
        new Table({
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
        })
      );
      certificationsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }
  }

  // Projects
  const projList = DEFAULT_CV_DATA.projects || [];
  if (projList.length > 0 && DEFAULT_CV_DATA.settings && DEFAULT_CV_DATA.settings.showProjects) {
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

    projList.forEach(proj => {
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

      const projCellLeft = [
        new Paragraph({
          spacing: { before: 40, after: 30 },
          children: [
            new TextRun({
              text: proj.dateRange || '',
              size: 18,
              font: fontName,
              color: mutedColor
            })
          ]
        })
      ];

      projRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: projCellLeft
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

    if (projRows.length > 1) {
      projectsElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: sectionBorder,
          margins: { top: 120, bottom: 120, left: 60, right: 60 },
          rows: projRows
        })
      );
      projectsElements.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
    }
  }

  // Languages
  const langList = DEFAULT_CV_DATA.languages || [];
  if (langList.length > 0) {
    const langParas = [];
    langList.forEach(l => {
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
      languagesElements.push(
        new Table({
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
        })
      );
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

  const order = (DEFAULT_CV_DATA.settings && Array.isArray(DEFAULT_CV_DATA.settings.sectionOrder))
    ? DEFAULT_CV_DATA.settings.sectionOrder
    : (typeof DEFAULT_SECTION_ORDER !== 'undefined' ? DEFAULT_SECTION_ORDER : Object.keys(sectionDocxMap));

  order.forEach(key => {
    const items = sectionDocxMap[key];
    if (Array.isArray(items)) {
      items.forEach(el => docChildren.push(el));
    }
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: docChildren
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '../Fajar_Sujito_CV.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Sample Word CV generated at:', outputPath, 'Size:', buffer.length, 'bytes');
}

buildSampleDocx().catch(console.error);
