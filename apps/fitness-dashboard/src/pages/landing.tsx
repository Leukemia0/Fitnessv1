import { Link } from "wouter";
import { Activity, ArrowRight, Zap, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <Activity className="h-7 w-7 text-primary" />
          <span>FitTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-4">
            <Zap className="h-4 w-4" />
            <span className="font-medium text-foreground">Your personal fitness command center</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Track Every Step.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
              Conquer Every Goal.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A precise, motivating, and always-on dashboard for your fitness journey. 
            No clutter, just the meaningful data you need to reach your peak performance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full group">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 mb-16 px-4"
        >
          <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm text-left">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Workout Logging</h3>
            <p className="text-muted-foreground leading-relaxed">Fast, frictionless entry. Log your running, lifting, or swimming in seconds.</p>
          </div>
          
          <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm text-left">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nutrition Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">Keep your macros in check. Understand your fuel to optimize your performance.</p>
          </div>
          
          <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm text-left">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Deep Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">Visual progress charts. Watch your streak grow and your stats improve over time.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
