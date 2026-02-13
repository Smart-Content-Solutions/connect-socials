import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import {
    Shield, Star, Crown, User as UserIcon, Settings2,
    ChevronDown, ChevronRight, Check, X, Plus, Trash2,
    Share2, Globe, Brain, Video, Edit2, Save,
    Grip, Lock, Unlock, Info, Sparkles, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    loadRoleConfig,
    saveRoleConfig,
    ALL_TOOLS,
    type RoleConfig,
    type MainRole,
    type AddOnRole,
    type ToolDefinition,
    DEFAULT_MAIN_ROLES,
    DEFAULT_ADDON_ROLES,
} from '@/lib/roleConfig';

// ─── Icon resolver ──────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
    Crown, Star, Shield, User: UserIcon, Share2, Globe, Brain, Video, Sparkles, Layers,
};

function RoleIcon({ iconName, className }: { iconName: string; className?: string }) {
    const Icon = ICON_MAP[iconName] || Shield;
    return <Icon className={className} />;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function RoleSettingsPage() {
    const { getToken } = useAuth();
    const [config, setConfig] = useState<RoleConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRoleType, setSelectedRoleType] = useState<'main' | 'addon'>('main');
    const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');
    const [editingDesc, setEditingDesc] = useState<string | null>(null);
    const [editDescValue, setEditDescValue] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // ─── Data Loading ──────────────────────────────────────────────────
    useEffect(() => {
        async function fetchConfig() {
            setIsLoading(true);
            try {
                // Load from Supabase via our roleConfig module
                const data = await loadRoleConfig();
                if (data && data.mainRoles) {
                    setConfig(data);
                }
            } catch (error) {
                console.error("Failed to load role config:", error);
                toast.error("Failed to load role configuration");
            } finally {
                setIsLoading(false);
            }
        }
        fetchConfig();
    }, []);

    // Get selected role
    const selectedRole = useMemo(() => {
        if (!config) return null;
        if (selectedRoleType === 'main') {
            return config.mainRoles.find(r => r.id === selectedRoleId) || null;
        }
        return config.addOnRoles.find(r => r.id === selectedRoleId) || null;
    }, [config, selectedRoleType, selectedRoleId]);

    // ─── Handlers ──────────────────────────────────────────────────────

    async function handleSave() {
        if (!config) return;
        
        try {
            // Get the auth token from Clerk
            const token = await getToken();
            
            // Save via API endpoint (uses service role to bypass RLS)
            await saveRoleConfig(config, token || undefined);

            setHasUnsavedChanges(false);
            toast.success('Role configuration saved!');
        } catch (error) {
            console.error("Save error:", error);
            toast.error('Failed to save configuration: ' + (error as Error).message);
        }
    }

    function handleResetToDefaults() {
        const defaultConfig: RoleConfig = {
            mainRoles: DEFAULT_MAIN_ROLES,
            addOnRoles: DEFAULT_ADDON_ROLES,
            version: 1,
        };
        setConfig(defaultConfig);
        setHasUnsavedChanges(true);
        toast.info('Reset to defaults — save to apply');
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show error if config failed to load
    if (!config) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-gray-400">Failed to load role configuration</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    function toggleToolForRole(toolId: string) {
        setConfig(prev => {
            const newConfig = { ...prev };

            if (selectedRoleType === 'main') {
                newConfig.mainRoles = prev.mainRoles.map(role => {
                    if (role.id !== selectedRoleId) return role;
                    // Don't modify admin (always has *)
                    if (role.id === 'admin') return role;

                    const hasIt = role.toolIds.includes(toolId);
                    return {
                        ...role,
                        toolIds: hasIt
                            ? role.toolIds.filter(t => t !== toolId)
                            : [...role.toolIds, toolId],
                    };
                });
            } else {
                newConfig.addOnRoles = prev.addOnRoles.map(role => {
                    if (role.id !== selectedRoleId) return role;
                    const hasIt = role.toolIds.includes(toolId);
                    return {
                        ...role,
                        toolIds: hasIt
                            ? role.toolIds.filter(t => t !== toolId)
                            : [...role.toolIds, toolId],
                    };
                });
            }

            return newConfig;
        });
        setHasUnsavedChanges(true);
    }

    function startEditingName(roleId: string, currentName: string) {
        setEditingName(roleId);
        setEditNameValue(currentName);
    }

    function saveEditName() {
        if (!editingName || !editNameValue.trim()) return;
        setConfig(prev => {
            const newConfig = { ...prev };
            if (selectedRoleType === 'main') {
                newConfig.mainRoles = prev.mainRoles.map(r =>
                    r.id === editingName ? { ...r, name: editNameValue.trim() } : r
                );
            } else {
                newConfig.addOnRoles = prev.addOnRoles.map(r =>
                    r.id === editingName ? { ...r, name: editNameValue.trim() } : r
                );
            }
            return newConfig;
        });
        setEditingName(null);
        setHasUnsavedChanges(true);
    }

    function startEditingDesc(roleId: string, currentDesc: string) {
        setEditingDesc(roleId);
        setEditDescValue(currentDesc);
    }

    function saveEditDesc() {
        if (!editingDesc) return;
        setConfig(prev => {
            const newConfig = { ...prev };
            if (selectedRoleType === 'main') {
                newConfig.mainRoles = prev.mainRoles.map(r =>
                    r.id === editingDesc ? { ...r, description: editDescValue.trim() } : r
                );
            } else {
                newConfig.addOnRoles = prev.addOnRoles.map(r =>
                    r.id === editingDesc ? { ...r, description: editDescValue.trim() } : r
                );
            }
            return newConfig;
        });
        setEditingDesc(null);
        setHasUnsavedChanges(true);
    }

    function addNewAddOnRole() {
        const newId = `addon_${Date.now()}`;
        const newRole: AddOnRole = {
            id: newId,
            name: 'New Add-on Role',
            description: 'Description for this add-on role',
            color: 'text-teal-400',
            bgColor: 'bg-teal-500/20',
            borderColor: 'border-teal-500/30',
            icon: 'Sparkles',
            toolIds: [],
        };
        setConfig(prev => ({
            ...prev,
            addOnRoles: [...prev.addOnRoles, newRole],
        }));
        setSelectedRoleType('addon');
        setSelectedRoleId(newId);
        setHasUnsavedChanges(true);
        toast.success('New add-on role created');
    }

    function deleteAddOnRole(roleId: string) {
        if (!config) return;
        
        setConfig(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                addOnRoles: prev.addOnRoles.filter(r => r.id !== roleId),
            };
        });
        if (selectedRoleId === roleId) {
            setSelectedRoleId(config.mainRoles[0]?.id || 'admin');
            setSelectedRoleType('main');
        }
        setHasUnsavedChanges(true);
        toast.success('Add-on role deleted');
    }

    // ─── Computed values ───────────────────────────────────────────────
    const coreTools = ALL_TOOLS.filter(t => t.category === 'Core');
    const corpTools = ALL_TOOLS.filter(t => t.category === 'Corporate');
    const isAdminRole = selectedRole && 'isSystem' in selectedRole && selectedRole.id === 'admin';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <Settings2 className="w-7 h-7 text-yellow-400" />
                        Role Management
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Configure roles and tool permissions — inspired by Discord's role system
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleResetToDefaults}
                        className="border-gray-600 hover:bg-gray-800 text-gray-300"
                    >
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges}
                        className={cn(
                            "transition-all duration-300",
                            hasUnsavedChanges
                                ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-semibold shadow-lg shadow-yellow-500/20"
                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                    </Button>
                </div>
            </motion.div>

            {/* Unsaved changes banner */}
            <AnimatePresence>
                {hasUnsavedChanges && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 flex items-center gap-3"
                    >
                        <Info className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span className="text-sm text-yellow-300">You have unsaved changes. Click Save to apply.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-12 gap-6">
                {/* ─── LEFT: Role List ─────────────────────────────────────── */}
                <div className="col-span-4">
                    {/* Main Roles Section */}
                    <Card className="bg-gray-900/50 border-gray-800 mb-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                Main Roles
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                                Hierarchical roles — higher priority overrides lower
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-1 pt-0">
                            {config.mainRoles
                                .sort((a, b) => b.priority - a.priority)
                                .map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => {
                                            setSelectedRoleType('main');
                                            setSelectedRoleId(role.id);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                                            selectedRoleType === 'main' && selectedRoleId === role.id
                                                ? `${role.bgColor} ${role.borderColor} border`
                                                : "hover:bg-gray-800/50 border border-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                            selectedRoleType === 'main' && selectedRoleId === role.id
                                                ? role.bgColor
                                                : "bg-gray-800"
                                        )}>
                                            <RoleIcon iconName={role.icon} className={cn("w-4 h-4", role.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                selectedRoleType === 'main' && selectedRoleId === role.id
                                                    ? role.color
                                                    : "text-gray-300"
                                            )}>
                                                {role.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {role.toolIds.includes("*") ? "All tools" : `${role.toolIds.length} tools`}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[10px] shrink-0", role.bgColor, role.borderColor, role.color)}>
                                            P{role.priority}
                                        </Badge>
                                    </button>
                                ))}
                        </CardContent>
                    </Card>

                    {/* Add-on Roles Section */}
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-400" />
                                    Add-on Roles
                                </CardTitle>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={addNewAddOnRole}
                                    className="h-7 px-2 text-gray-400 hover:text-emerald-400"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Independent permissions — stack on top of main roles
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-1 pt-0">
                            {config.addOnRoles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => {
                                        setSelectedRoleType('addon');
                                        setSelectedRoleId(role.id);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                                        selectedRoleType === 'addon' && selectedRoleId === role.id
                                            ? `${role.bgColor} ${role.borderColor} border`
                                            : "hover:bg-gray-800/50 border border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        selectedRoleType === 'addon' && selectedRoleId === role.id
                                            ? role.bgColor
                                            : "bg-gray-800"
                                    )}>
                                        <RoleIcon iconName={role.icon} className={cn("w-4 h-4", role.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            selectedRoleType === 'addon' && selectedRoleId === role.id
                                                ? role.color
                                                : "text-gray-300"
                                        )}>
                                            {role.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {role.toolIds.length} tools
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteAddOnRole(role.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </button>
                            ))}
                            {config.addOnRoles.length === 0 && (
                                <p className="text-xs text-gray-500 text-center py-4">No add-on roles yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ─── RIGHT: Role Editor ──────────────────────────────────── */}
                <div className="col-span-8">
                    {selectedRole ? (
                        <motion.div
                            key={`${selectedRoleType}-${selectedRoleId}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Role Header */}
                            <Card className="bg-gray-900/50 border-gray-800 mb-4">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-xl flex items-center justify-center",
                                            selectedRole.bgColor
                                        )}>
                                            <RoleIcon iconName={selectedRole.icon} className={cn("w-7 h-7", selectedRole.color)} />
                                        </div>
                                        <div className="flex-1">
                                            {/* Editable Name */}
                                            {editingName === selectedRole.id ? (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Input
                                                        value={editNameValue}
                                                        onChange={(e) => setEditNameValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditName()}
                                                        className="h-8 text-lg font-bold bg-gray-800 border-gray-600 text-white"
                                                        autoFocus
                                                    />
                                                    <Button size="sm" variant="ghost" onClick={saveEditName} className="h-8 w-8 p-0 text-green-400">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingName(null)} className="h-8 w-8 p-0 text-red-400">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <h2
                                                    className={cn("text-xl font-bold cursor-pointer hover:underline decoration-dotted underline-offset-4 flex items-center gap-2", selectedRole.color)}
                                                    onClick={() => startEditingName(selectedRole.id, selectedRole.name)}
                                                >
                                                    {selectedRole.name}
                                                    <Edit2 className="w-3.5 h-3.5 opacity-40" />
                                                </h2>
                                            )}

                                            {/* Editable Description */}
                                            {editingDesc === selectedRole.id ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Input
                                                        value={editDescValue}
                                                        onChange={(e) => setEditDescValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditDesc()}
                                                        className="h-7 text-sm bg-gray-800 border-gray-600 text-gray-300"
                                                        autoFocus
                                                    />
                                                    <Button size="sm" variant="ghost" onClick={saveEditDesc} className="h-7 w-7 p-0 text-green-400">
                                                        <Check className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingDesc(null)} className="h-7 w-7 p-0 text-red-400">
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p
                                                    className="text-sm text-gray-400 mt-1 cursor-pointer hover:text-gray-300 flex items-center gap-1"
                                                    onClick={() => startEditingDesc(selectedRole.id, selectedRole.description)}
                                                >
                                                    {selectedRole.description}
                                                    <Edit2 className="w-3 h-3 opacity-30" />
                                                </p>
                                            )}

                                            <div className="flex items-center gap-3 mt-3">
                                                <Badge variant="outline" className={cn("text-xs", selectedRole.bgColor, selectedRole.borderColor, selectedRole.color)}>
                                                    {selectedRoleType === 'main' ? 'Main Role' : 'Add-on Role'}
                                                </Badge>
                                                {'priority' in selectedRole && (
                                                    <Badge variant="outline" className="text-xs bg-gray-800 border-gray-600 text-gray-400">
                                                        Priority: {(selectedRole as MainRole).priority}
                                                    </Badge>
                                                )}
                                                {'isSystem' in selectedRole && (selectedRole as MainRole).isSystem && (
                                                    <Badge variant="outline" className="text-xs bg-gray-800 border-gray-600 text-gray-400">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        System Role
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tool Permissions */}
                            <Card className="bg-gray-900/50 border-gray-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-yellow-400" />
                                        Tool Permissions
                                    </CardTitle>
                                    <p className="text-xs text-gray-500">
                                        {isAdminRole
                                            ? "Admin has full access to all tools (cannot be modified)"
                                            : "Toggle which tools this role grants access to"}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {/* Core Tools */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                            Core Tools
                                            <span className="text-xs text-gray-500 normal-case font-normal">
                                                ({coreTools.filter(t => selectedRole && (selectedRole.toolIds.includes("*") || selectedRole.toolIds.includes(t.id))).length}/{coreTools.length})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {coreTools.map(tool => {
                                                const isGranted = selectedRole!.toolIds.includes("*") || selectedRole!.toolIds.includes(tool.id);
                                                return (
                                                    <ToolPermissionToggle
                                                        key={tool.id}
                                                        tool={tool}
                                                        isGranted={isGranted}
                                                        isDisabled={!!isAdminRole}
                                                        roleColor={selectedRole!.color}
                                                        onToggle={() => toggleToolForRole(tool.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Corporate Tools */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                            Corporate Tools
                                            <span className="text-xs text-gray-500 normal-case font-normal">
                                                ({corpTools.filter(t => selectedRole && (selectedRole.toolIds.includes("*") || selectedRole.toolIds.includes(t.id))).length}/{corpTools.length})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {corpTools.map(tool => {
                                                const isGranted = selectedRole!.toolIds.includes("*") || selectedRole!.toolIds.includes(tool.id);
                                                return (
                                                    <ToolPermissionToggle
                                                        key={tool.id}
                                                        tool={tool}
                                                        isGranted={isGranted}
                                                        isDisabled={!!isAdminRole}
                                                        roleColor={selectedRole!.color}
                                                        onToggle={() => toggleToolForRole(tool.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Settings2 className="w-12 h-12 text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg">Select a role to configure</p>
                                <p className="text-gray-500 text-sm mt-1">Click on a role from the left to edit its permissions</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Tool Permission Toggle Component ────────────────────────────────
function ToolPermissionToggle({
    tool,
    isGranted,
    isDisabled,
    roleColor,
    onToggle,
}: {
    tool: ToolDefinition;
    isGranted: boolean;
    isDisabled: boolean;
    roleColor: string;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            disabled={isDisabled}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 text-left group w-full",
                isGranted
                    ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15"
                    : "bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50",
                isDisabled && "opacity-60 cursor-not-allowed"
            )}
        >
            {/* Toggle */}
            <div className={cn(
                "w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0",
                isGranted ? "bg-green-500" : "bg-gray-600"
            )}>
                <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: isGranted ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </div>

            {/* Tool info */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-medium truncate",
                    isGranted ? "text-white" : "text-gray-400"
                )}>
                    {tool.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{tool.description}</p>
            </div>

            {/* Status icon */}
            {isGranted ? (
                <Unlock className="w-3.5 h-3.5 text-green-400 shrink-0" />
            ) : (
                <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            )}
        </button>
    );
}
