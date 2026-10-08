// Default CV Data matching the user's uploaded CV design and ATS revisions
const DEFAULT_CV_DATA = {
  personal: {
    fullName: "Fajar Sujito",
    jobTitle: "Engineering Leader | Head of Backend",
    location: "Jakarta, Indonesia",
    phone: "+6281903492372",
    email: "fjarfs@gmail.com"
  },
  links: [
    { label: "Portfolio", url: "https://fajarsujito.my.id" },
    { label: "LinkedIn", url: "https://linkedin.com/in/fajar-sujito" },
    { label: "GitHub", url: "https://github.com/fjarfs" }
  ],
  summary: "Engineering leader with 8+ years of experience building and scaling backend platforms for fintech, trading, and high-throughput digital ecosystems. Led cross-functional teams of up to 15 engineers across backend, DevOps, and QA, achieving 99.95% platform uptime on AWS. Architected failover gateways for low-latency trading, event-driven microservices (RabbitMQ, CQRS, SAGA), and robust BCP frameworks. Proven track record in cloud modernization, security compliance (ISO 27001, OWASP), and accelerating delivery by 30% through AI-assisted engineering practices.",
  skills: {
    column1: [
      "System Design & Distributed Systems",
      "Event-Driven Architecture (RabbitMQ, CQRS)",
      "High Availability & BCP Resilience",
      "AWS (ECS, EKS, Aurora, DynamoDB)",
      "Microservices & REST / FIX API",
      "Go, Node.js, TypeScript",
      "AI-Assisted Development (Kiro, LLMs)"
    ],
    column2: [
      "Kubernetes (EKS), Docker, CI/CD",
      "MySQL, PostgreSQL, Redis",
      "Observability & APM (ELK, New Relic)",
      "OWASP Security & ISO 27001 Controls",
      "React, Next.js, Tailwind CSS",
      "Laravel, PHP",
      "Engineering Leadership & Mentorship"
    ]
  },
  employment: [
    {
      id: "emp-sam",
      company: "PT Surya Anugrah Mulya",
      employmentType: "Full-time",
      companyDateRange: "Jan 2024 – Aug 2026",
      roles: [
        {
          id: "role-sam-1",
          jobTitle: "Head of Backend Engineer",
          dateRange: "Nov 2024 – Aug 2026",
          bullets: [
            "Architected a failover gateway for high-frequency trading operations, guaranteeing business continuity with sub-30-second recovery and 99.95% uptime during market hours.",
            "Led production cloud migration to AWS, raising platform uptime to 99.95% and cutting incident detection time by 60% through ELK-based observability.",
            "Built and led a 12-engineer cross-functional engineering team, cutting release cycle time from 2 weeks to 3 days while instituting automated testing and code quality standards.",
            "Introduced AI-assisted development practices using Kiro and OpenRouter, improving sprint delivery speed by 30% and automating code reviews, unit test generation, and boilerplate scaffolding.",
            "Established enterprise BCP frameworks and automated operational reporting across 15 mission-critical systems, saving ~80 hours per month in manual reporting."
          ],
          techStack: "AWS, Cloudflare, MySQL, Redis, RabbitMQ, ELK, Go, Node.js, Laravel, Docker, FIX API"
        },
        {
          id: "role-sam-2",
          jobTitle: "Research And Development Manager",
          dateRange: "Jan 2024 – Oct 2024",
          bullets: [
            "Spearheaded core architecture modernization, decomposing legacy monolith into 8 event-driven microservices and reducing deployment duration from hours to under 15 minutes.",
            "Pioneered automated DevOps and CI/CD pipelines, increasing release frequency from monthly to weekly and reducing production deployment errors by 70%.",
            "Delivered proof-of-concept integrations with liquidity providers via REST and FIX API, and built a trading simulation environment to backtest 12 algorithmic strategies."
          ],
          techStack: "AWS, Go, Node.js, Laravel, Python, FIX API, Docker"
        }
      ]
    },
    {
      id: "emp-mifx",
      company: "MIFX",
      employmentType: "Full-time",
      companyDateRange: "May 2022 – Dec 2023",
      roles: [
        {
          id: "role-mifx-1",
          jobTitle: "Engineering Manager",
          dateRange: "Jan 2023 – Dec 2023",
          bullets: [
            "Managed the Backend organization of 13+ engineers across 3 squad leads, aligning architecture roadmaps with business priorities and mentoring senior talent.",
            "Architected an event-driven microservices architecture using RabbitMQ, SAGA, and CQRS patterns, improving data consistency across 9 services and reducing order latency by 35%.",
            "Scaled API layer via AWS API Gateway and service-repository patterns, handling ~500,000 requests per day with p95 response time under 250 ms.",
            "Implemented real-time notification streaming with WebSockets (Socket.IO), broadcasting trade executions and price feeds to ~3,000 concurrent users with sub-second latency."
          ],
          techStack: "AWS, Laravel, Node.js, MySQL, Redis, RabbitMQ, ELK"
        },
        {
          id: "role-mifx-2",
          jobTitle: "Technical Lead",
          dateRange: "May 2022 – Dec 2022",
          bullets: [
            "Architected trading platform infrastructure on AWS (API Gateway, NLB, ECS, Aurora, Redis, Docker), supporting ~2,000 concurrent users with 99.9% uptime.",
            "Architected and deployed 7 microservices across both AWS and Alibaba Cloud with zero downtime releases, establishing redundant multi-cloud operational capability.",
            "Integrated OneZero FIX API for low-latency market order routing and price feeds, processing ~20,000 orders per day at ~50 ms average latency.",
            "Standardized engineering practices across 3 financial products, increasing automated test coverage from ~10% to ~70% and recruiting 6 engineers within 4 months."
          ],
          techStack: "AWS, Alibaba Cloud, ECS, Aurora, Redis, Docker, FIX API, Laravel, Node.js"
        }
      ]
    },
    {
      id: "emp-dxtr",
      company: "DXTR ASIA",
      employmentType: "Full-time",
      companyDateRange: "Jul 2018 – May 2022",
      roles: [
        {
          id: "role-dxtr-1",
          jobTitle: "Technical Lead",
          dateRange: "Aug 2020 – May 2022",
          bullets: [
            "Led cross-functional team of ~15 engineers across 4 squads and 3 partner vendors, directing technical delivery and system scalability in close coordination with the CTO.",
            "Scaled notification backbone delivering ~5 million notifications per day (~20,000 messages/min at peak) with 99.9% delivery success.",
            "Modernized microservices on AWS (ECS, EKS, API Gateway, Aurora, DynamoDB), cutting infrastructure costs by ~25% and reducing p95 latency from ~800 ms to ~300 ms.",
            "Instituted automated CI/CD and New Relic APM alerting, shortening deployment cycles from 2 hours to 20 minutes and cutting production incidents by ~40%."
          ],
          techStack: "AWS, EKS, ECS, Aurora, DynamoDB, Redis, Node.js, Laravel, Docker"
        },
        {
          id: "role-dxtr-2",
          jobTitle: "Lead Backend Developer",
          dateRange: "Aug 2019 – Jul 2020",
          bullets: [
            "Led migration of Sampoerna Retail Community (SRC) applications from monolith to microservices on AWS (ECS), improving API response times by ~45%.",
            "Engineered asynchronous messaging pipelines with AWS SQS/SNS, decoupling service dependencies and processing ~100,000 daily events with zero loss.",
            "Mentored a 5-engineer backend team and established SonarQube quality gates, reducing production defects by ~35%."
          ],
          techStack: "AWS, ECS, SQS, SNS, Laravel, MySQL, DynamoDB, Redis"
        },
        {
          id: "role-dxtr-3",
          jobTitle: "Senior Backend Developer",
          dateRange: "Jul 2018 – Jul 2019",
          bullets: [
            "Engineered core backend platforms (B2B, B2C, DTE) for SRC from the ground up, sustaining ~3,000 concurrent users at initial rollout with 99.5% uptime.",
            "Designed caching architectures across Redis and DynamoDB, reducing database query load by ~40% and integrating Gojek delivery and OTP services."
          ],
          techStack: "Laravel, Lumen, MySQL, DynamoDB, Redis, AWS EC2, ECS"
        }
      ]
    },
    {
      id: "emp-independent",
      company: "Independent Product Builder",
      employmentType: "Self-Employed",
      companyDateRange: "Jan 2023 – Present",
      roles: [
        {
          id: "role-indep-1",
          jobTitle: "Full Stack Developer & Architect",
          dateRange: "Jan 2023 – Present",
          bullets: [
            "Architected and deployed full-stack SaaS and analytics applications (React, Next.js, TypeScript, Go, Laravel), achieving Lighthouse 95+ scores across Performance, Accessibility, and SEO.",
            "Hardened web security posture with strict CSP, HSTS, and HTTP headers, achieving an A+ rating on securityheaders.com.",
            "Engineered resilient payment workflows, secure authentication, and cloud deployment pipelines on AWS, Cloudflare, and Vercel."
          ],
          techStack: "React, Next.js, TypeScript, Go, Laravel, AWS, Cloudflare, PostgreSQL"
        }
      ]
    },
    {
      id: "emp-consulting",
      company: "Consulting & Contract Engineering",
      employmentType: "Concurrent / Contract",
      companyDateRange: "Apr 2020 – Apr 2026",
      roles: [
        {
          id: "role-consult-1",
          jobTitle: "Software Architect & Security Consultant",
          dateRange: "Apr 2020 – Apr 2026",
          bullets: [
            "PT Rayanusa Tekno Medika (2020 – 2026): Architected EMOP healthcare management platform (~2,000 users) and audited cloud security for ICE ON IMERI; implemented OWASP Top 10 and ISO 27001 controls, passing 2 external penetration tests with zero critical findings.",
            "Crocodic / LKPP (2021): Built Request for Quotation (RFQ) microservices and real-time WebSocket chat (~1,500 connections) for Toko Daring LKPP national government e-procurement marketplace.",
            "PT Satuu Teknologi Utama (2021 – 2022): Architected offline-first ERP system for 21 warehouse branches, eliminating data loss during connectivity outages and cutting hosting costs by ~20% on AWS."
          ],
          techStack: "AWS, Laravel, React, React Native, Node.js, MySQL, Redis, OWASP"
        }
      ]
    },
    {
      id: "emp-early",
      company: "PT Internet Solusi Layanan Informasi Mandiri",
      employmentType: "Full-time",
      companyDateRange: "Apr 2018 – Jun 2018",
      roles: [
        {
          id: "role-early-1",
          jobTitle: "Full Stack Developer",
          dateRange: "Apr 2018 – Jun 2018",
          bullets: [
            "Developed database models, REST endpoints, and automated reporting dashboards for client web applications using PHP and PostgreSQL."
          ],
          techStack: "PHP, PostgreSQL, JavaScript, Apache"
        }
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      "dateRange": "2016 – 2020",
      degree: "Bachelor of Computer Science (S.Kom)",
      institution: "Universitas Negeri Semarang",
      details: "Focus on Software Engineering & Distributed Systems. GPA 3.6/4.00"
    },
    {
      id: "edu-2",
      "dateRange": "2016",
      degree: "Short Course in Computing",
      institution: "Hiroshima University",
      details: "International exchange program in applied computer science."
    }
  ],
  projects: [
    {
      id: "proj-1",
      dateRange: "2026",
      projectName: "Sobat Saham",
      role: "Full Stack Developer & Creator",
      description: "Quantitative analytics platform for the Indonesia Stock Exchange (IDX), providing retail investors with disciplined valuation screeners, financial metrics, and portfolio tracking.",
      projectUrl: "https://www.sobatsaham.com/"
    },
    {
      id: "proj-2",
      dateRange: "2026",
      projectName: "AMB Megatrend",
      role: "Engineering Lead",
      description: "Institutional liquidity provider and risk management dashboard engineered for precision financial operations, position risk assessment, and real-time execution analytics.",
      projectUrl: "https://ambmegatrend.com/"
    },
    {
      id: "proj-3",
      dateRange: "2022 – 2023",
      projectName: "MIFX Trading Platform",
      role: "Engineering Manager & Technical Lead",
      description: "High-throughput forex and commodity trading web platforms with low-latency order routing, real-time WebSocket market updates, and event-driven microservices handling 500,000+ daily requests.",
      projectUrl: "https://mifx.com/"
    },
    {
      id: "proj-4",
      dateRange: "2018 – 2020",
      projectName: "Sampoerna Retail Community (SRC)",
      role: "Senior Backend Developer → Lead Backend Developer",
      description: "Ecosystem of 7 interconnected web and mobile platforms modernizing Indonesia's traditional retail grocery network on scalable AWS microservices, supporting high-volume daily retail transactions.",
      projectUrl: "https://www.src.id/"
    }
  ],
  certifications: [
    {
      id: "cert-1",
      dateRange: "2022",
      name: "Menjadi Google Cloud Engineer",
      issuer: "Dicoding Indonesia",
      credentialId: "0LZ01R2QQP65",
      credentialUrl: "https://www.dicoding.com/certificates/0LZ01R2QQP65",
      details: ""
    },
    {
      id: "cert-2",
      dateRange: "2021",
      name: "Architecting on AWS (Membangun Arsitektur Cloud di AWS)",
      issuer: "Dicoding Indonesia",
      credentialId: "1OP8L72L2ZQK",
      credentialUrl: "https://www.dicoding.com/certificates/1OP8L72L2ZQK",
      details: ""
    },
    {
      id: "cert-3",
      dateRange: "2021",
      name: "ISO 27001 - Network & Communication Security Management",
      issuer: "Udemy",
      credentialId: "UC-b64bcf50-79ba-4d03-8c49-51cf875c8592",
      credentialUrl: "https://www.udemy.com/certificate/UC-b64bcf50-79ba-4d03-8c49-51cf875c8592/",
      details: ""
    },
    {
      id: "cert-4",
      dateRange: "2022",
      name: "AWS Services for Solutions Architect Associate (Course)",
      issuer: "Udemy",
      credentialId: "UC-d6bd0959-450d-4370-b721-28be2e3cc795",
      credentialUrl: "https://www.udemy.com/certificate/UC-d6bd0959-450d-4370-b721-28be2e3cc795/",
      details: ""
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
    fontFamily: "EB Garamond",
    fontSize: "10pt",
    lineHeight: "1.45",
    paperMargin: "16mm",
    leftColWidth: "25%",
    layoutMode: "single-column",
    showProjects: true,
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

function cloneCVData(data) {
  return JSON.parse(JSON.stringify(data));
}

if (typeof window !== 'undefined') {
  window.DEFAULT_CV_DATA = DEFAULT_CV_DATA;
  window.DEFAULT_SECTION_ORDER = DEFAULT_SECTION_ORDER;
  window.cloneCVData = cloneCVData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_CV_DATA, DEFAULT_SECTION_ORDER, cloneCVData };
}
