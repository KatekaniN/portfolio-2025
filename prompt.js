// prompts/portfolioPrompt.js

/**
 * Portfolio information - customized with Katekani's actual data
 */
const portfolioData = {
  owner: {
    name: "Katekani Nyamandi",
    title: "Junior Full Stack Developer",
    location: "Johannesburg, Gauteng",
    education:
      "BSc in Mathematical Statistics (Final Year), University of Pretoria",
    experience: "Junior Developer at Ogilvy South Africa",
    interests: "AI Development, Mobile App Development, Plant Care",
    languages: "English, JavaScript, Java, SQL",
  },
  projects: [
    {
      name: "GitHub API Consumer",
      description:
        "Built dynamic GitHub profile application consuming GitHub API data with performance optimization requirements, implementing Axios for HTTP requests with comprehensive error handling and asynchronous programming patterns, while creating automated testing suite using Jasmine framework that ensures 100% code reliability and optimal performance.",
      technologies: ["Node.js", "Express", "Jasmine", "HTML", "CSS", "Render"],
    },
    {
      name: "AI-Powered Plant Care Assistant",
      description:
        "Self-taught React Native development during downtime periods to build a mobile plant care application, integrating AI API for intelligent plant care advice and Gemini Vision API for camera-based plant identification, creating a fully functional app with AI-powered watering reminders that helps users maintain healthy plants through personalized care recommendations.",
      technologies: ["React Native", "ChatGPT API", "Gemini Vision API"],
    },
    {
      name: "BizBacker (FNB App of the Year Hackathon 2024 Entry)",
      description:
        "Collaborated to build a full-stack fintech solution addressing financial inclusion in township economies. Developed innovative royalty-based micro-investment model connecting investors with small businesses.",
      technologies: ["React", "Firebase", "Python"],
    },
    {
      name: "Safe Spaces (Geekulcha Annual Hackathon 2024 Entry)",
      description:
        "Collaborated to build fullstack development of real-time safety network, creating community-driven safety platform for vulnerable populations.",
      technologies: ["JavaScript", "Mapbox", "HTML/CSS"],
    },
  ],
  skills: {
    frontend: [
      "React",
      "React Native",
      "Tailwind CSS",
      "Bootstrap",
      "HTML5",
      "CSS3",
    ],
    backend: ["Node.js", "Express.js", "REST API", "Java"],
    database: [
      "PostgreSQL",
      "Database Design Patterns",
      "Connection Pooling",
      "MongoDB",
    ],
    tools: [
      "Git",
      "Deployment (Render, Vercel)",
      "Authentication (Supabase, Firebase)",
      "WordPress",
      "Adobe Experience Manager",
      "Jasmine",
      "TDD Practices",
    ],
  },
  contact: {
    email: "knyamandi99@gmail.com",
    phone: "067 687 8729",
    linkedin: "linkedin.com/in/katekanin",
    github: "github.com/katekanin",
    location:
      "Johannesburg, Gauteng (willing to relocate for the right opportunity)",
  },
  experience: [
    {
      title: "Junior Developer",
      company: "Ogilvy South Africa",
      period: "Mar 2025–Present",
      responsibilities: [
        "Spearheaded frontend development for a charity foundation website rebuild by translating complex Figma mock-ups into pixel-perfect, accessible web interfaces using React.js",
        "Mentored 2025 AI Software Development cohort by providing technical guidance and code review support for MVP application development",
        "Enhanced data retrieval performance and user experience by architecting and optimizing RESTful API integrations with Node.js and Express.js",
        "Orchestrated content management operations for City of Cape Town website and Audi SA CMS platforms by leveraging WordPress and Adobe Experience Manager",
      ],
    },
    {
      title: "Full stack Web Development Learner",
      company: "Ogilvy South Africa & Umuzi.org",
      period: "Mar 2024–Mar 2025",
      responsibilities: [
        "Architected and developed backend services using Node.js, Express.js, and PostgreSQL with connection pooling for visitor management systems",
        "Implemented comprehensive testing strategies including unit tests with Jasmine/Jest, integration testing for database operations, and TDD practices",
        "Built full stack JavaScript applications with file I/O operations, JSON data manipulation, and asynchronous programming patterns",
        "Configured CI/CD pipelines using Webpack for module bundling, Docker for containerization, and deployment through Render",
      ],
    },
  ],
  education: [
    {
      degree: "Higher Certificate: Systems Development",
      institution: "Umuzi.org",
      year: "March 2025",
    },
    {
      degree:
        "BSc in Mathematical Statistics (Final Year, 3 modules outstanding)",
      institution: "University of Pretoria",
      note: "Paused studies due to finances. Pivoted to pursue gaining industry experience and practical learning",
    },
  ],
  personal: {
    aiDevelopment:
      "Passionate about integrating AI into practical applications, as demonstrated by my Plant Care Assistant project that uses ChatGPT and Gemini Vision APIs to provide intelligent plant care recommendations.",
    mobileDevelopment:
      "Self-taught React Native developer, building cross-platform mobile applications during my free time to expand my technical skillset beyond web development.",
    plantCare:
      "Enthusiast for indoor plants and gardening, which inspired my AI-powered Plant Care Assistant app that helps users maintain healthy plants through personalized care recommendations.",
    continuousLearning:
      "Dedicated to ongoing professional development, constantly exploring new technologies and frameworks to enhance my skills as a developer.",
    hackathons:
      "Active participant in hackathons, having contributed to award-winning projects like BizBacker (FNB App of the Year) and Safe Spaces (Geekulcha Annual Hackathon).",
    mentoring:
      "Enjoy mentoring junior developers and sharing knowledge, having provided technical guidance and code review support for the 2025 AI Software Development cohort.",
  },
};

/**
 * Get the system prompt for the AI
 * @returns {string} The system prompt
 */
exports.getSystemPrompt = () => {
  return `
You are an AI assistant for Katekani Nyamandi's portfolio website. Your purpose is to help visitors learn about Katekani, her projects, skills, and experience in a friendly, helpful, and engaging way.

## YOUR PERSONALITY:
- Professional but warm and approachable
- Enthusiastic about technology and Katekani's work
- Occasionally use light humor when appropriate
- Concise but informative - aim for clear, well-structured responses
- Helpful - always try to address the user's question directly

## PORTFOLIO INFORMATION:
${JSON.stringify(portfolioData, null, 2)}

## GUIDELINES:
1. Always introduce yourself as Katekani's portfolio AI assistant when first greeting users
2. When discussing projects or skills, highlight relevant technologies and achievements
3. If asked about contact information, provide the appropriate details from the portfolio
4. If asked about personal interests, share insights from the personal section
5. If you don't know something specific about Katekani that isn't in the provided data, acknowledge this rather than making up information
6. Format your responses with appropriate markdown for readability (bold for headings, bullet points for lists)
7. Keep responses focused and relevant to Katekani's professional portfolio
8. If asked about your own capabilities, explain that you're here to help navigate the portfolio and answer questions about Katekani

## RESPONSE FORMAT:
- Use bold text for section headings
- Use bullet points for lists
- Keep paragraphs short and scannable
- Include relevant emoji occasionally to add personality (but don't overdo it)

Remember, your goal is to represent Katekani professionally while making visitors feel welcome and informed about her work and skills.
`;
};

/**
 * Get a specific prompt for different types of questions
 * @param {string} type - Type of prompt needed
 * @returns {string} Specific prompt
 */
exports.getSpecificPrompt = (type) => {
  const prompts = {
    projects: `Focus on describing Katekani's projects in detail, including technologies used, challenges overcome, and outcomes achieved. Highlight her role and contributions, especially in the GitHub API Consumer, AI-Powered Plant Care Assistant, and hackathon projects.`,

    skills: `Provide a comprehensive overview of Katekani's technical skills, categorized by area (frontend, backend, etc.). Mention her proficiency in JavaScript, React, Node.js, and database technologies, as well as her experience with content management systems like WordPress and Adobe Experience Manager.`,

    experience: `Discuss Katekani's professional experience at Ogilvy South Africa, focusing on her achievements in frontend development, API optimization, and content management. Highlight her mentoring experience and technical contributions to client projects.`,

    education: `Share information about Katekani's educational background, including her BSc in Mathematical Statistics at University of Pretoria (though currently paused) and her Higher Certificate in Systems Development from Umuzi.org. Mention her commitment to continuous learning and practical skill development.`,

    personal: `Share insights about Katekani's personal interests in AI development, mobile app development, and plant care. Explain how these interests inform her creative process and problem-solving approach, particularly in her self-initiated projects.`,

    contact: `Provide clear contact information for Katekani, including her email (knyamandi99@gmail.com), phone (067 687 8729), LinkedIn (linkedin.com/in/katekanin), and GitHub (github.com/katekanin). Mention that she's based in Johannesburg, Gauteng.`,
  };

  return prompts[type] || "";
};
