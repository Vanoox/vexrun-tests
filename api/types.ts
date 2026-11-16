// response shapes from http-api.json (only what the tests use)

export type Form = {
  id: string;
  name: string;
  is_enabled: boolean;
  limit: number | null;
  honeypot_field: string | null;
  redirect_url: string | null;
  success_title: string;
  success_message: string;
  created_at: number;
};

export type FormOverview = {
  status: "open" | "form_disabled" | "submission_limit_reached";
  schema: null;
  show_branding: boolean;
  redirect_url: string | null;
  success_title: string;
  success_message: string;
};

export type Submission = {
  id: string;
  country: string;
  ip: string;
  user_agent: string;
  referer: string;
  data: Record<string, unknown>;
  files: unknown[];
  created_at: number;
};

export type SubmissionList = {
  results: Submission[];
  total: number;
};
