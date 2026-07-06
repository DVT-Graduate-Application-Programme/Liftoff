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


