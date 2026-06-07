import type { ReactNode } from "react";
import type UserResponse from "../../../api/models/response/UserResponse";

export type DashboardEventKind = "deadline" | "opens";

export type DashboardEvent = {
  id: string;
  kind: DashboardEventKind;
  title: string;
  subjectName: string;
  subjectId: string;
  at: Date;
};

export type StatDef = {
  value: string;
  label: string;
  hint: string;
  icon: ReactNode;
  color: string;
};

export type DashboardHomeProps = {
  user: UserResponse | undefined;
};

export type OpenNowRow = {
  id: string;
  title: string;
  subjectName: string;
  subjectId: string;
  close: Date;
};

export type CalendarCell = {
  date: Date;
  inMonth: boolean;
};

export type ActivityTone = "neutral" | "ok" | "info";

export type ActivityFeedItem = {
  id: string;
  text: string;
  when: string;
  tone: ActivityTone;
};
