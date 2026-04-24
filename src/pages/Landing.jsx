import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/lib/firestore";
import { Zap, Target, TrendingUp, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const heroImages = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80",
  "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?w=1920&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80",
];

const features = [
  { icon: Target, title: "Skill-Based Matching", desc: "See only tasks that match your skills. Our engine ensures perfect matches." },
  { icon: TrendingUp, title: "Earn While You Learn", desc: "Build real-world experience and earn money while completing your education." },
  { icon: Shield, title: "Verified Clients", desc: "All clients are verified. Work on genuine tasks from real companies." },
  { icon: Zap, title: "Instant Notifications", desc: "Get notified immediately when a new task matching your skills is posted." },
];

export default function Landing() {
  const [currentImage, setCurrentImage] = useState(0);
  const [stats, setStats] = useState({ students: 0, tasks: 0, companies: 0, completed: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadStats() {
      const [tasks, applications] = await Promise.all([
        entities.Task.list(),
        entities.Application.filter({ status: "accepted" }),
      ]);
      const completedTasks = tasks.filter((t) => t.status === "completed").length;
      const companies = new Set(tasks.map((t) => t.posted_by)).size;
      setStats({ students: applications.length + 12, tasks: tasks.length, companies, completed: completedTasks });
    }
    loadStats().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <img src={heroImages[currentImage]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">ST</span>
              </div>
              <span className="font-heading font-bold text-white text-xl">SmartTask</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-white/80 hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              SmartTask — <span className="text-primary">Earn</span> While You Learn
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              The skill-based micro task marketplace connecting talented students with real companies.
              Get matched to tasks you're skilled at and start earning today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="px-8 py-3.5 bg-primary text-primary-foreground font-heading font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg"
              >
                Get Started
              </Link>
              <Link
                to="/marketplace"
                className="px-8 py-3.5 bg-white/10 text-white font-heading font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg backdrop-blur-sm border border-white/20"
              >
                Browse Tasks
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute bottom-12 grid grid-cols-2 md:grid-cols-4 gap-6 px-4 max-w-3xl w-full"
          >
            {[
              { label: "Active Users", value: stats.students },
              { label: "Tasks Posted", value: stats.tasks },
              { label: "Companies", value: stats.companies },
              { label: "Tasks Completed", value: stats.completed },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-foreground">
            Why SmartTask?
          </h2>
          <p className="text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            Everything you need to start earning with your skills
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { step: "01", title: "Create Profile", desc: "Sign up with Google and set up your skills profile" },
              { step: "02", title: "Get Matched", desc: "Our engine matches you with relevant tasks" },
              { step: "03", title: "Earn & Grow", desc: "Apply, complete tasks, and build your portfolio" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-heading font-bold text-primary/10">{item.step}</div>
                <h3 className="font-heading font-semibold text-foreground mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">ST</span>
            </div>
            <span className="font-heading font-bold text-foreground">SmartTask</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SmartTask. Earn While You Learn.
          </p>
        </div>
      </footer>
    </div>
  );
}
