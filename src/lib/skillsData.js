export const SKILL_CATEGORIES = {
  Programming: [
    "Python", "JavaScript", "Java", "C++", "C#", "TypeScript", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "R", "MATLAB", "Scala",
  ],
  "Web Development": [
    "React", "Vue.js", "Angular", "Node.js", "Next.js", "HTML/CSS", "Tailwind CSS",
    "Django", "Flask", "Laravel", "Spring Boot", "GraphQL", "REST APIs", "MongoDB",
  ],
  "Graphic Design": [
    "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD", "Canva",
    "Sketch", "InDesign", "After Effects", "Logo Design", "UI/UX Design",
  ],
  "Video Editing": [
    "Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects",
    "Motion Graphics", "Color Grading", "YouTube Content", "Reels/Shorts",
  ],
  "Content Writing": [
    "Blog Writing", "Copywriting", "SEO Writing", "Technical Writing",
    "Creative Writing", "Script Writing", "Resume Writing", "Email Marketing",
  ],
  Presentation: [
    "PowerPoint", "Google Slides", "Pitch Deck Design", "Data Visualization",
    "Infographics", "Prezi",
  ],
  "Data Entry": [
    "Excel", "Google Sheets", "Data Analysis", "Data Cleaning",
    "Database Management", "CRM Management",
  ],
  Research: [
    "Market Research", "Academic Research", "Competitive Analysis",
    "Survey Design", "Literature Review", "Data Collection",
  ],
  "Digital Marketing": [
    "Social Media Marketing", "Facebook Ads", "Google Ads", "Instagram Marketing",
    "LinkedIn Marketing", "Email Campaigns", "Analytics", "Growth Hacking",
  ],
  "Academic Help": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Economics",
    "Statistics", "Calculus", "Linear Algebra",
  ],
};

export const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's (Pursuing)",
  "Bachelor's (Completed)",
  "Master's (Pursuing)",
  "Master's (Completed)",
  "PhD (Pursuing)",
  "PhD (Completed)",
];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

export function calculateSkillMatch(userSkills, taskSkills) {
  if (!userSkills?.length || !taskSkills?.length) return 0;
  const matches = taskSkills.filter((s) => userSkills.includes(s)).length;
  return Math.round((matches / taskSkills.length) * 100);
}

export function getMatchColor(percent) {
  if (percent >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (percent >= 50) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  if (percent > 0) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  return "bg-muted text-muted-foreground border-border";
}
