"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Privacy from "./Privacy";
import ImageSettings from "./ImageSettings";
import Admins from "./Admins";
import Danger from "./Danger";

type CommunitySettingsTabsProps = {
  communityId: string;
};

export default function CommunitySettingsTabs({ communityId }: CommunitySettingsTabsProps) {
  return (
    <div className="mx-auto max-w-190 px-3 py-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Community Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage c/{communityId} branding, privacy policies, administrators, and lifecycle.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="flex border-b border-border mb-6">
            <TabsTrigger
              value="privacy"
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
            >
              Privacy
            </TabsTrigger>
            <TabsTrigger
              value="image"
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
            >
              Image
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
            >
              Admins
            </TabsTrigger>
            <TabsTrigger
              value="danger"
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
            >
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="outline-none">
            <Privacy communityId={communityId} />
          </TabsContent>
          <TabsContent value="image" className="outline-none">
            <ImageSettings communityId={communityId} />
          </TabsContent>
          <TabsContent value="admins" className="outline-none">
            <Admins communityId={communityId} />
          </TabsContent>
          <TabsContent value="danger" className="outline-none">
            <Danger communityId={communityId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
