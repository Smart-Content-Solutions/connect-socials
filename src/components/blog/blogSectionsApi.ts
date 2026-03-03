import { supabase } from "@/lib/supabase";

export type SectionType = "our" | "client";
export type AssignmentMap = Record<string, SectionType>;

const SETTINGS_KEY = "blog_section_assignments";
const LOCAL_SETTINGS_KEY = "blog_section_assignments_local";

interface BlogSectionsResponse {
  assignments: AssignmentMap;
}

async function fetchFromSupabase(): Promise<AssignmentMap> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load blog sections: ${error.message}`);
  }

  const assignments = (data?.value as any)?.assignments;
  if (!assignments || typeof assignments !== "object") {
    return {};
  }

  const cleaned: AssignmentMap = {};
  for (const [postId, section] of Object.entries(assignments)) {
    if ((section === "our" || section === "client") && /^\d+$/.test(postId)) {
      cleaned[postId] = section;
    }
  }

  return cleaned;
}

function fetchFromLocalStorage(): AssignmentMap {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { assignments?: AssignmentMap };
    return parsed?.assignments || {};
  } catch {
    return {};
  }
}

async function saveToSupabase(assignments: AssignmentMap): Promise<AssignmentMap> {
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: SETTINGS_KEY,
      value: { assignments },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(`Failed to save blog sections: ${error.message}`);
  }

  return assignments;
}

function saveToLocalStorage(assignments: AssignmentMap): AssignmentMap {
  localStorage.setItem(
    LOCAL_SETTINGS_KEY,
    JSON.stringify({ assignments, updatedAt: new Date().toISOString() })
  );
  return assignments;
}

export async function fetchBlogSections(): Promise<AssignmentMap> {
  const response = await fetch("/api/blog-sections");

  if (!response.ok) {
    if (response.status === 404) {
      try {
        return await fetchFromSupabase();
      } catch {
        return fetchFromLocalStorage();
      }
    }
    throw new Error(`Failed to load blog sections: ${response.status}`);
  }

  const data = (await response.json()) as BlogSectionsResponse;
  return data.assignments || {};
}

export async function saveBlogSections(
  assignments: AssignmentMap,
  authToken?: string | null
): Promise<AssignmentMap> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch("/api/blog-sections", {
    method: "POST",
    headers,
    body: JSON.stringify({ assignments }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      try {
        return await saveToSupabase(assignments);
      } catch {
        return saveToLocalStorage(assignments);
      }
    }
    const fallbackMessage = `Failed to save blog sections (${response.status})`;
    const text = await response.text().catch(() => "");
    try {
      const parsed = text ? (JSON.parse(text) as { error?: string }) : null;
      throw new Error(parsed?.error || fallbackMessage);
    } catch {
      throw new Error(text || fallbackMessage);
    }
  }

  const data = (await response.json()) as BlogSectionsResponse;
  return data.assignments || {};
}
