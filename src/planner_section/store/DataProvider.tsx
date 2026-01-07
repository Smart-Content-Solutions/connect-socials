import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { DocPage, Task, TaskFilters, DocTag, TaskStatus, TaskPriority, Assignee } from "../types";
import { supabase } from "../supabase/client";
import { toast } from "sonner";

// Dev-only error logging to prevent information leakage in production
const logError = (operation: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.error(operation, error);
  }
};

// ============ DB TYPES ============
// Sub: These map to the database tables. Update when switching to real SCS backend.

interface DbDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_by: string;
  last_updated: string;
  created_at: string;
  notes: string | null;
}

interface DbTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  due_date: string | null;
  completed_date?: string | null;
  created_at: string;
  updated_at: string;
  comments: string | null;
  sort_order: number | null;
}

// ============ MAPPERS ============
// Sub: These convert between DB format and app format

const mapDbDocToDoc = (dbDoc: DbDoc): DocPage => ({
  id: dbDoc.id,
  title: dbDoc.title,
  content: dbDoc.content,
  tags: dbDoc.tags as DocTag[],
  createdBy: dbDoc.created_by,
  lastUpdated: new Date(dbDoc.last_updated),
  notes: dbDoc.notes || undefined,
});

const mapDbTaskToTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  status: dbTask.status as TaskStatus,
  priority: dbTask.priority as TaskPriority,
  assignee: dbTask.assignee as Assignee,
  dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
  completedDate: dbTask.completed_date ? new Date(dbTask.completed_date) : undefined,
  createdAt: new Date(dbTask.created_at),
  updatedAt: new Date(dbTask.updated_at),
  comments: dbTask.comments || undefined,
  sortOrder: dbTask.sort_order ?? 0,
});

// ============ CONTEXT TYPES ============

interface DataContextType {
  // State
  docs: DocPage[];
  tasks: Task[];
  isLoading: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Docs methods
  fetchDocs: () => Promise<void>;
  getDocById: (id: string) => DocPage | undefined;
  createDoc: (payload: { title?: string; content?: string; tags?: DocTag[]; createdBy?: string }) => Promise<DocPage>;
  updateDoc: (id: string, payload: Partial<DocPage>) => Promise<DocPage | undefined>;
  deleteDoc: (id: string) => Promise<boolean>;

  // Tasks methods
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  createTask: (payload: { title: string; description?: string; assignee?: Assignee; priority?: TaskPriority; status?: TaskStatus; dueDate?: Date }) => Promise<Task>;
  updateTask: (id: string, payload: Partial<Task>) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<boolean>;
  filterTasks: (filters: TaskFilters) => Task[];
  reorderTasks: (orderedIds: string[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ============ INITIAL FETCH ============

  const fetchDocs = useCallback(async () => {
    // Sub: Replace with GET /api/docs when switching to OVH/Vercel backend
    try {
      const { data, error } = await supabase
        .from("docs")
        .select("*")
        .order("last_updated", { ascending: false });

      if (error) throw error;
      setDocs((data || []).map(mapDbDocToDoc));
    } catch (error) {
      logError("Error fetching docs:", error);
      toast.error("Failed to load documents");
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    // Sub: Replace with GET /api/tasks when switching to OVH/Vercel backend
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTasks((data || []).map(mapDbTaskToTask));
    } catch (error) {
      logError("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDocs(), fetchTasks()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDocs, fetchTasks]);

  // ============ DOCS METHODS ============

  const getDocById = useCallback((id: string): DocPage | undefined => {
    return docs.find((d) => d.id === id);
  }, [docs]);

  const createDoc = useCallback(async (payload: { title?: string; content?: string; tags?: DocTag[]; createdBy?: string }): Promise<DocPage> => {
    // Sub: Replace with POST /api/docs when switching to OVH/Vercel backend
    try {
      const { data, error } = await supabase
        .from("docs")
        .insert({
          title: payload.title || "Untitled page",
          content: payload.content || "",
          tags: payload.tags || [],
          created_by: payload.createdBy || "Dominik",
        })
        .select()
        .single();

      if (error) throw error;

      const newDoc = mapDbDocToDoc(data);
      setDocs((prev) => [newDoc, ...prev]);
      toast.success("Document created");
      return newDoc;
    } catch (error) {
      logError("Error creating doc:", error);
      toast.error("Failed to create document");
      throw error;
    }
  }, []);

  const updateDoc = useCallback(async (id: string, payload: Partial<DocPage>): Promise<DocPage | undefined> => {
    // Sub: Replace with PATCH /api/docs/:id when switching to OVH/Vercel backend
    try {
      const updateData: Record<string, unknown> = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.content !== undefined) updateData.content = payload.content;
      if (payload.tags !== undefined) updateData.tags = payload.tags;
      if (payload.createdBy !== undefined) updateData.created_by = payload.createdBy;
      if (payload.notes !== undefined) updateData.notes = payload.notes;

      const { data, error } = await supabase
        .from("docs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updatedDoc = mapDbDocToDoc(data);
      setDocs((prev) => prev.map((doc) => (doc.id === id ? updatedDoc : doc)));
      return updatedDoc;
    } catch (error) {
      logError("Error updating doc:", error);
      toast.error("Failed to update document");
      return undefined;
    }
  }, []);

  const deleteDoc = useCallback(async (id: string): Promise<boolean> => {
    // Sub: Replace with DELETE /api/docs/:id when switching to OVH/Vercel backend
    try {
      const { error } = await supabase.from("docs").delete().eq("id", id);
      if (error) throw error;

      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
      return true;
    } catch (error) {
      logError("Error deleting doc:", error);
      toast.error("Failed to delete document");
      return false;
    }
  }, []);

  // ============ TASKS METHODS ============

  const getTaskById = useCallback((id: string): Task | undefined => {
    return tasks.find((t) => t.id === id);
  }, [tasks]);

  const createTask = useCallback(async (payload: { title: string; description?: string; assignee?: Assignee; priority?: TaskPriority; status?: TaskStatus; dueDate?: Date }): Promise<Task> => {
    // Sub: Replace with POST /api/tasks when switching to OVH/Vercel backend
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: payload.title,
          description: payload.description || "",
          status: payload.status || "To Do",
          priority: payload.priority || "Medium",
          assignee: payload.assignee || "Dominik",
          due_date: payload.dueDate
            ? `${payload.dueDate.getFullYear()}-${String(payload.dueDate.getMonth() + 1).padStart(2, '0')}-${String(payload.dueDate.getDate()).padStart(2, '0')}`
            : null,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask = mapDbTaskToTask(data);
      setTasks((prev) => [newTask, ...prev]);
      toast.success("Task created");
      return newTask;
    } catch (error) {
      logError("Error creating task:", error);
      toast.error("Failed to create task");
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id: string, payload: Partial<Task>): Promise<Task | undefined> => {
    // Sub: Replace with PATCH /api/tasks/:id when switching to OVH/Vercel backend
    try {
      const updateData: Record<string, unknown> = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.priority !== undefined) updateData.priority = payload.priority;
      if (payload.assignee !== undefined) updateData.assignee = payload.assignee;

      // Fix: Use local date formatting to avoid timezone issues
      if (payload.dueDate !== undefined) {
        updateData.due_date = payload.dueDate
          ? `${payload.dueDate.getFullYear()}-${String(payload.dueDate.getMonth() + 1).padStart(2, '0')}-${String(payload.dueDate.getDate()).padStart(2, '0')}`
          : null;
      }
      if (payload.completedDate !== undefined) {
        updateData.completed_date = payload.completedDate
          ? `${payload.completedDate.getFullYear()}-${String(payload.completedDate.getMonth() + 1).padStart(2, '0')}-${String(payload.completedDate.getDate()).padStart(2, '0')}`
          : null;
      }

      if (payload.comments !== undefined) updateData.comments = payload.comments;

      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = mapDbTaskToTask(data);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      return updatedTask;
    } catch (error) {
      logError("Error updating task:", error);
      toast.error("Failed to update task");
      return undefined;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    // Sub: Replace with DELETE /api/tasks/:id when switching to OVH/Vercel backend
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
      return true;
    } catch (error) {
      logError("Error deleting task:", error);
      toast.error("Failed to delete task");
      return false;
    }
  }, []);

  const filterTasks = useCallback((filters: TaskFilters): Task[] => {
    let filtered = [...tasks];

    if (filters.assignee && filters.assignee !== "All") {
      filtered = filtered.filter((t) => t.assignee === filters.assignee);
    }
    if (filters.status && filters.status !== "All") {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.priority && filters.priority !== "All") {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters.showCompleted === false) {
      filtered = filtered.filter((t) => t.status !== "Done");
    } else if (filters.showCompleted === true) {
      filtered = filtered.filter((t) => t.status === "Done");
    }

    return filtered;
  }, [tasks]);

  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    // Optimistically update local state
    const reordered = orderedIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined)
      .map((t, index) => ({ ...t, sortOrder: index }));

    setTasks(reordered);

    // Update in database
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from("tasks")
          .update({ sort_order: i })
          .eq("id", orderedIds[i]);

        if (error) throw error;
      }
    } catch (error) {
      logError("Error reordering tasks:", error);
      toast.error("Failed to save task order");
      // Refetch to restore correct order
      fetchTasks();
    }
  }, [tasks, fetchTasks]);

  return (
    <DataContext.Provider
      value={{
        docs,
        tasks,
        isLoading,
        searchQuery,
        setSearchQuery,
        fetchDocs,
        getDocById,
        createDoc,
        updateDoc,
        deleteDoc,
        fetchTasks,
        getTaskById,
        createTask,
        updateTask,
        deleteTask,
        filterTasks,
        reorderTasks,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

// Convenience hooks
export function useDocs() {
  const { docs, isLoading, fetchDocs, getDocById, createDoc, updateDoc, deleteDoc, searchQuery } = useData();
  return { docs, isLoading, fetchDocs, getDocById, createDoc, updateDoc, deleteDoc, searchQuery };
}

export function useTasks() {
  const { tasks, isLoading, fetchTasks, getTaskById, createTask, updateTask, deleteTask, filterTasks, reorderTasks, searchQuery } = useData();
  return { tasks, isLoading, fetchTasks, getTaskById, createTask, updateTask, deleteTask, filterTasks, reorderTasks, searchQuery };
}

export function useSearch() {
  const { searchQuery, setSearchQuery } = useData();
  return { searchQuery, setSearchQuery };
}
