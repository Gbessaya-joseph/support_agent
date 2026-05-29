"use client";

import { useMemo } from "react";
import type { Conversation } from "@/lib/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import {
    getTodayConversationCount,
    getResolvedPercentage,
    getHumanEscalationCount,
    getTodayVsYesterdayDelta,
    getThisWeekVsLastWeekDelta,
} from "@/lib/utils/dashboard.utils";
import { Badge } from "../ui/badge";

interface StatsCardsProps {
    conversations: Conversation[];
}

export function StatsCards({ conversations }: StatsCardsProps) {
    const stats = useMemo(
        () => ({
            todayCount: getTodayConversationCount(conversations),
            todayVsYesterdayDelta: getTodayVsYesterdayDelta(conversations),
            thisWeekVsLastWeekDelta: getThisWeekVsLastWeekDelta(conversations),
            resolvedPct: getResolvedPercentage(conversations),
            escalationCount: getHumanEscalationCount(conversations),
        }),
        [conversations],
    );

    const statCards = [
        {
            label: "Conversations today",
            value: stats.todayCount,
            delta: `${stats.todayVsYesterdayDelta >= 0 ? '↑' : '↓'} ${Math.abs(stats.todayVsYesterdayDelta)} since yesterday`,
            deltaColor: "text-white",
        },
        {
            label: "Resolved by AI",
            value: `${stats.resolvedPct}%`,
            delta: `${stats.thisWeekVsLastWeekDelta >= 0 ? '↑' : '↓'} ${Math.abs(stats.thisWeekVsLastWeekDelta)}% this week`,
            deltaColor: "text-white",
        },
        {
            label: "Human Escalations",
            value: stats.escalationCount,
            delta:
                stats.escalationCount > 0
                    ? `● ${stats.escalationCount} awaiting attention`
                    : "● 0 awaiting attention",
            deltaColor:
                stats.escalationCount > 0 ? "text-amber-600" : "text-slate-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
                <Card key={index} className="p-0 rounded-2xl">
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            {stat.label}
                        </div>
                        <div className="text-3xl font-semibold text-foreground">
                            {stat.value}
                        </div>
                        <Badge
                            className={`text-xs mt-2 bg-blue-500 ${stat.deltaColor}`}
                        >
                            {stat.delta}
                        </Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
