import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">SCS Workspace</h1>
        <p className="text-xl text-muted-foreground mb-8">Task Management System</p>
        <Link to="/workspace/daily-tracker">
          <Button className="gap-2">
            <CalendarCheck className="w-5 h-5" />
            Go to Daily Tracker
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
