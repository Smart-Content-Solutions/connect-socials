import { Settings, User, Bell, Shield, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settingSections = [
  { icon: User, label: "Profile", description: "Manage your account details" },
  { icon: Bell, label: "Notifications", description: "Configure alert preferences" },
  { icon: Shield, label: "Security", description: "Password and authentication" },
  { icon: Palette, label: "Appearance", description: "Theme and display settings" },
];

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section) => (
          <Card
            key={section.label}
            className="bg-card border-border hover:border-gold/30 transition-colors cursor-pointer group"
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <section.icon className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">{section.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-gold" />
            Workspace Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Workspace Name</span>
            <span className="font-medium text-foreground">SCS Workspace</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Plan</span>
            <span className="px-2 py-1 bg-gold/10 text-gold text-xs font-medium rounded">Pro</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground">Team Members</span>
            <span className="font-medium text-foreground">3</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
