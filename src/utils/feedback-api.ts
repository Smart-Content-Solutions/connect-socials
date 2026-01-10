import { useAuth } from "@clerk/clerk-react";
import type { CreateFeedbackRequest, Feedback, FeedbackSubmission } from "@/types/feedback";

/**
 * Submit feedback to the API with localStorage fallback
 * @param data - Feedback data to submit
 * @param getToken - Clerk getToken function
 * @returns Promise that resolves to the created feedback or null if fallback used
 */
export async function submitFeedback(
  data: CreateFeedbackRequest,
  getToken: () => Promise<string | null>
): Promise<Feedback | null> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: data.rating,
        category: data.category,
        message: data.message,
        pageUrl: data.pageUrl || window.location.href,
      }),
    });

    // Handle response - try to parse as JSON first
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // If JSON parse fails, try reading as text
      const text = await response.text();
      throw new Error(`Server error: ${text || response.statusText || "Unknown error"}`);
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.details || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Success - return the feedback
    return responseData.feedback;
  } catch (error: any) {
    // If API call fails for any reason, fall back to localStorage
    console.error("API feedback submission failed, using localStorage fallback:", error);

    // Save to localStorage as fallback
    const existingData = localStorage.getItem("scs_feedback_submissions");
    const submissions: FeedbackSubmission[] = existingData ? JSON.parse(existingData) : [];

    const fallbackSubmission: FeedbackSubmission = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      rating: data.rating,
      category: data.category,
      message: data.message.trim(),
      pageUrl: data.pageUrl || window.location.href,
      userId: undefined, // Will be set by form component if user is signed in
      userEmail: undefined,
      userName: undefined,
    };

    submissions.push(fallbackSubmission);
    localStorage.setItem("scs_feedback_submissions", JSON.stringify(submissions));

    // Set last submitted timestamp
    localStorage.setItem("scs_feedback_last_submitted_at", new Date().toISOString());

    // Return null to indicate fallback was used
    return null;
  }
}
