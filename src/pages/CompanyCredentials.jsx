import { ArrowLeft, Building2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const companies = [
  { name: "TechNova Solutions", email: "technova@smarttask.com", tasks: 5, category: "Web Development & Tech" },
  { name: "CodeFix Labs", email: "codefix@smarttask.com", tasks: 4, category: "Programming & QA" },
  { name: "AutomateX", email: "automatex@smarttask.com", tasks: 3, category: "Automation & Data" },
  { name: "LaunchPad Inc", email: "launchpad@smarttask.com", tasks: 5, category: "Startups & Products" },
  { name: "CreativeEdge Studio", email: "creativeedge@smarttask.com", tasks: 4, category: "Graphic Design" },
  { name: "BrandVibe Agency", email: "brandvibe@smarttask.com", tasks: 7, category: "Marketing & Branding" },
  { name: "MediaFlow Productions", email: "mediaflow@smarttask.com", tasks: 4, category: "Video & Media" },
  { name: "ContentCraft Agency", email: "contentcraft@smarttask.com", tasks: 5, category: "Content & Writing" },
  { name: "EduTech Solutions", email: "edutech@smarttask.com", tasks: 10, category: "Education & Academic" },
  { name: "DataHarvest", email: "dataharvest@smarttask.com", tasks: 3, category: "Data & Research" },
];

export default function CompanyCredentials() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Company Credentials</h1>
        <p className="text-muted-foreground mb-8">
          {companies.length} registered companies on SmartTask platform
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {companies.map((company, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground">{company.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{company.category}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <Mail size={13} />
                    <span className="truncate">{company.email}</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {company.tasks} tasks posted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
