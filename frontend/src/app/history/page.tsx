"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  ChevronDown,
  Calendar,
  RotateCcw,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";


type Decision = "accept" | "reject";

interface Candidate {
  id: string;
  name: string;
  role: string;
  decision: Decision;
  systemScore: number;
  systemScoreLabel: string;
  academicAverage: number;
  academicAverageLabel: string;
  reviewedAt: string;
  avatarInitials: string;
  avatarColor: string;
}

const TODAY_CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Alexander Sterling",
    role: "Software Engineer — Backend",
    decision: "accept",
    systemScore: 91,
    systemScoreLabel: "Strong",
    academicAverage: 87,
    academicAverageLabel: "High",
    reviewedAt: "Today, 08:42 AM",
    avatarInitials: "AS",
    avatarColor: "bg-primary/15 text-primary",
  },
  {
    id: "2",
    name: "Sophia Chen",
    role: "Data Analyst — Insights Team",
    decision: "accept",
    systemScore: 88,
    systemScoreLabel: "Strong",
    academicAverage: 82,
    academicAverageLabel: "High",
    reviewedAt: "Today., 09:15 AM",
    avatarInitials: "SC",
    avatarColor: "bg-chart-4/15 text-chart-4",
  },
  {
    id: "3",
    name: "Marcus Thorne",
    role: "UX Designer — Product Design",
    decision: "reject",
    systemScore: 54,
    systemScoreLabel: "Weaker",
    academicAverage: 61,
    academicAverageLabel: "Average",
    reviewedAt: "Today, 10:03 AM",
    avatarInitials: "MT",
    avatarColor: "bg-destructive/15 text-destructive",
  },
];

const YESTERDAY_CANDIDATES: Candidate[] = [
  {
    id: "4",
    name: "Priya Nair",
    role: "DevOps Engineer — Infrastructure",
    decision: "accept",
    systemScore: 79,
    systemScoreLabel: "Good",
    academicAverage: 74,
    academicAverageLabel: "Good",
    reviewedAt: "Yesterday, 03:30 PM",
    avatarInitials: "PN",
    avatarColor: "bg-primary/15 text-primary",
  },
  {
    id: "5",
    name: "Ethan Voss",
    role: "Product Manager — Growth",
    decision: "reject",
    systemScore: 47,
    systemScoreLabel: "Weaker",
    academicAverage: 55,
    academicAverageLabel: "Below Avg",
    reviewedAt: "Yesterday, 04:00 PM",
    avatarInitials: "EV",
    avatarColor: "bg-destructive/15 text-destructive",
  },
  {
    id: "6",
    name: "Lena Hoffmann",
    role: "Marketing Strategist",
    decision: "accept",
    systemScore: 83,
    systemScoreLabel: "Strong",
    academicAverage: 79,
    academicAverageLabel: "High",
    reviewedAt: "Yesterday, 05:22 PM",
    avatarInitials: "LH",
    avatarColor: "bg-chart-4/15 text-chart-4",
  },
];

const EARLIER_CANDIDATES: Candidate[] = [
  {
    id: "7",
    name: "James Okafor",
    role: "Cybersecurity Analyst",
    decision: "accept",
    systemScore: 95,
    systemScoreLabel: "Exceptional",
    academicAverage: 91,
    academicAverageLabel: "High",
    reviewedAt: "5 Jul, 11:10 AM",
    avatarInitials: "JO",
    avatarColor: "bg-primary/15 text-primary",
  },
  {
    id: "8",
    name: "Amara Diallo",
    role: "Financial Analyst — Risk",
    decision: "reject",
    systemScore: 38,
    systemScoreLabel: "Weaker",
    academicAverage: 48,
    academicAverageLabel: "Below Avg",
    reviewedAt: "5 Jul, 02:45 PM",
    avatarInitials: "AD",
    avatarColor: "bg-destructive/15 text-destructive",
  },
];

const GROUPS = [
  { label: "Processed Today", candidates: TODAY_CANDIDATES },
  { label: "Applied Yesterday", candidates: YESTERDAY_CANDIDATES },
  { label: "Earlier This Week", candidates: EARLIER_CANDIDATES },
];
