'use client'
import { useState, useEffect } from "react";
import { TvMinimalPlay, ChartNoAxesCombined, UserRoundPlus, Users, Search, SkipForward, CloudDrizzle, FileWarningIcon, Upload, Gift, ClipboardCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
    {
        title: "Statistics",
        url: "/statistics",
        icon: ChartNoAxesCombined,
    },
    {
        title: "Queue up",
        url: "/queue-up",
        icon: UserRoundPlus,
    },
    {
        title: "Live runners",
        url: "/live-runners",
        icon: TvMinimalPlay,
    },
    {
        title: "Queue",
        url: "/queue",
        icon: Users,
    },
    {
        title: "Controls",
        url: "/controls",
        icon: SkipForward,
    },
    {
        title: "Query",
        url: "/query",
        icon: Search,
    },
    {
        title: "Shift Check-Ins",
        url: "/shift-checkins",
        icon: ClipboardCheck,
    },
    {
        title: "Upload speedyteam",
        url: "/upload-speedyteam",
        icon: Upload,
    },
    {
        title: "Runner Rewards",
        url: "/runner-rewards",
        icon: Gift,
    },
    {
        title: "DEV ONLY RESET",
        url: "/dev-only-reset",
        icon: FileWarningIcon,
    }
];

export function AppSidebar() {
    const [raining, setRaining] = useState(false);

    useEffect(() => {
        // Fetch the current raining state from the database
        async function fetchRainingState() {
            const response = await fetch("/api/global-state");
            const data = await response.json();
            setRaining(data.raining);
        }

        fetchRainingState();
    }, []);

    const handleRainingToggle = async () => {
        const newRainingState = !raining;
        setRaining(newRainingState);

        // Update the raining state in the database
        await fetch("/api/global-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raining: newRainingState }),
        });
    };

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <div className="flex items-center">
                                        <CloudDrizzle />
                                        <span>Raining: </span>
                                        <Switch checked={raining} onCheckedChange={handleRainingToggle} />
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}