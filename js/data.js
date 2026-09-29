// Default CV Data matching the user's uploaded CV design
const DEFAULT_CV_DATA = {
  personal: {
    fullName: "Fajar Sujito",
    jobTitle: "Full Stack Developer",
    location: "Jakarta, Indonesia",
    phone: "+6281903492372",
    email: "fjarfs@gmail.com"
  },
  links: [
    { label: "Portfolio", url: "https://fajarsujito.com" },
    { label: "Linkedin", url: "https://linkedin.com/in/fajarsujito" },
    { label: "GitHub", url: "https://github.com/fajarsujito" }
  ],
  summary: "Full Stack Developer specializing in frontend, backend, and cloud infrastructure for production web applications. Experienced building responsive, SEO-friendly interfaces with React, Next.js, TypeScript, and Tailwind CSS, while also designing scalable APIs and backend services with REST APIs, Node.js, Go, and Laravel. Strong hands-on experience delivering reliable systems on AWS and Cloudflare with a focus on performance, maintainability, and clean architecture. In recent roles, I have led engineering direction, mentored developers, and coordinated cross-functional delivery across product, design, and backend teams. I combine technical execution with leadership to ship dependable products and improve long-term team velocity.",
  skills: {
    column1: [
      "React",
      "Next.js",
      "Go",
      "MySQL",
      "Microservices",
      "Cloudflare",
      "RabbitMQ",
      "REST API",
      "Tailwind CSS"
    ],
    column2: [
      "TypeScript",
      "Node.js",
      "Laravel",
      "Redis",
      "AWS",
      "ELK",
      "Vercel",
      "React Native"
    ]
  },
  employment: [
    {
      id: "emp-1",
      company: "Independent Product Builder",
      employmentType: "Produk Sendiri",
      companyDateRange: "",
      roles: [
        {
          id: "role-1-1",
          jobTitle: "Full Stack Developer",
          dateRange: "Jan 2023 — Jan 2026",
          bullets: [
            "Independently owned frontend architecture and product implementation for production web applications built with React, Next.js, and TypeScript.",
            "Led the design of reusable UI patterns and scalable component structures to keep features consistent, maintainable, and fast to ship.",
            "Improved frontend responsiveness, SEO, accessibility, and user experience through interface refactoring, page optimization, and cleaner interaction flows.",
            "Integrated backend APIs for authentication, analytics, payments, and product workflows, ensuring frontend behavior stayed reliable across releases.",
            "Drove code-quality and workflow improvements that made the application easier to extend and support over time."
          ],
          techStack: "React, Next.js, TypeScript, Tailwind CSS, REST API, AWS"
        }
      ]
    },
    {
      id: "emp-2",
      company: "Looq Creative",
      employmentType: "Full-time",
      companyDateRange: "Jan 2022 — Jan 2026",
      roles: [
        {
          id: "role-2-1",
          jobTitle: "Lead Full Stack Developer",
          dateRange: "Jan 2024 — Jan 2026",
          bullets: [
            "Promoted to lead frontend delivery for client and product websites, driving architecture standards, component reusability, and code reviews.",
            "Coordinated cross-functional technical execution across client needs and product priorities to keep releases moving smoothly and reliably."
          ],
          techStack: "React, TypeScript, Next.js, Node.js"
        },
        {
          id: "role-2-2",
          jobTitle: "Full Stack Developer",
          dateRange: "Jan 2022 — Dec 2023",
          bullets: [
            "Built end-to-end features across frontend, backend APIs, and deployment, with a strong focus on UI quality and implementation consistency.",
            "Improved system reliability and delivery speed by refining frontend architecture, reducing rework, and tightening implementation standards."
          ],
          techStack: "Laravel, JavaScript, React, MySQL"
        }
      ]
    },
    {
      id: "emp-3",
      company: "PT Satuu Teknologi Utama",
      employmentType: "Full-time",
      companyDateRange: "",
      roles: [
        {
          id: "role-3-1",
          jobTitle: "Full Stack Developer",
          dateRange: "Jan 2021 — Jan 2022",
          bullets: [
            "Owned frontend-heavy application delivery, building user flows and interfaces that improved usability and operational efficiency.",
            "Worked on application architecture, API integration, authentication, and operational dashboards to support stable product experiences."
          ],
          techStack: "Vue.js, PHP, REST API, MySQL"
        }
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      dateRange: "2016 — 2020",
      degree: "Bachelor of Computer Science (S.Kom)",
      institution: "Universitas Mercu Buana, Jakarta",
      details: "Focus on Software Engineering, Web Technologies & Distributed Systems. GPA 3.75/4.00"
    }
  ],
  projects: [
    {
      id: "proj-1",
      dateRange: "2024",
      projectName: "Enterprise SaaS Analytics Dashboard",
      projectUrl: "",
      role: "Lead Full Stack Developer",
      description: "Real-time metrics streaming dashboard serving 10,000+ daily active users, cutting initial page load latency by 45% using edge caching."
    }
  ],
  certifications: [
    {
      id: "cert-1",
      dateRange: "2023",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services (AWS)",
      credentialId: "AWS-892147",
      credentialUrl: "https://aws.amazon.com/verification",
      details: "Validation of robust cloud architecture, microservices, and secure infrastructure."
    }
  ],
  languages: [
    {
      id: "lang-1",
      name: "Indonesian",
      proficiency: "Native or Bilingual"
    },
    {
      id: "lang-2",
      name: "English",
      proficiency: "Professional Working Proficiency"
    }
  ],
  settings: {
    fontFamily: "EB Garamond", // 'EB Garamond', 'Georgia', 'Times New Roman', 'Merriweather', 'Inter'
    fontSize: "10pt", // 9pt, 9.5pt, 10pt, 10.5pt, 11pt
    lineHeight: "1.45",
    paperMargin: "18mm",
    leftColWidth: "25%",
    showProjects: false,
    showEducation: true,
    showCertifications: true,
    showLanguages: true,
    sectionOrder: [
      "links",
      "summary",
      "skills",
      "employment",
      "education",
      "certifications",
      "projects",
      "languages"
    ]
  }
};

const DEFAULT_SECTION_ORDER = [
  "links",
  "summary",
  "skills",
  "employment",
  "education",
  "certifications",
  "projects",
  "languages"
];

// Global helper to clone data safely
function cloneCVData(data) {
  return JSON.parse(JSON.stringify(data));
}

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.DEFAULT_CV_DATA = DEFAULT_CV_DATA;
  window.DEFAULT_SECTION_ORDER = DEFAULT_SECTION_ORDER;
  window.cloneCVData = cloneCVData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_CV_DATA, DEFAULT_SECTION_ORDER, cloneCVData };
}
