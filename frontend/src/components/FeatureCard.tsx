import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="p-6 bg-card border-border hover:border-primary/40 transition-colors">
      <div className="flex flex-col items-start text-left gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
};

export default FeatureCard;
