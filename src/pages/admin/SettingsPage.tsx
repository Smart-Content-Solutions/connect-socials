import { motion } from 'framer-motion';
import { Search, User, Shield, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { staffMembers } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = staffMembers.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Staff & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage team members and system settings</p>
      </motion.div>

      {/* Admin Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass rounded-xl p-4 border-primary/20 bg-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Admin Access Required</p>
            <p className="text-xs text-muted-foreground">
              Only users with Admin role can manage staff members and system settings.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Staff Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Staff Members</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStaff.map((staff, index) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass rounded-xl p-5 card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-white/10">
                  <User className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{staff.name}</h3>
                    <Badge 
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        staff.role === 'admin' 
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-muted border-white/10 text-muted-foreground'
                      )}
                    >
                      {staff.role === 'admin' ? 'Admin' : 'Staff'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No staff members found</p>
          </div>
        )}
      </motion.div>

      {/* Settings Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/20 border border-white/5">
            <h3 className="text-sm font-medium text-foreground mb-1">Notifications</h3>
            <p className="text-xs text-muted-foreground">Configure email and in-app notifications</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-white/5">
            <h3 className="text-sm font-medium text-foreground mb-1">Integrations</h3>
            <p className="text-xs text-muted-foreground">Connect CRM, email, and calendar tools</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-white/5">
            <h3 className="text-sm font-medium text-foreground mb-1">Lead Sources</h3>
            <p className="text-xs text-muted-foreground">Manage lead source categories</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-white/5">
            <h3 className="text-sm font-medium text-foreground mb-1">Export Data</h3>
            <p className="text-xs text-muted-foreground">Download leads and reports</p>
          </div>
        </div>
      </motion.div>

      {/* Strategy Calls Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="glass rounded-xl p-4 border-primary/10 bg-primary/5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Strategy Call Bookings</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Strategy call bookings from the website contact page are collected here in the admin under Leads → Strategy Calls.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
