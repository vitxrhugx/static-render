import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 bg-card">
      <div className="container px-4">
        <div className="relative max-w-4xl mx-auto">
          {/* Background gradient */}
          <div className="absolute inset-0 gradient-hero rounded-3xl opacity-10 blur-xl" />
          
          <div className="relative gradient-hero rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
                Comece a transformar seus dados hoje
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                Experimente gratuitamente e descubra como o clima pode ser seu aliado estratégico
              </p>
              <Link to="/signup">
                <Button 
                  size="xl" 
                  className="bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  Criar conta gratuita
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
