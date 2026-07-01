import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingCandidates from "@/components/pendingCandidates/PendingCandidates";
import AllCandidates from "@/components/allCandidates/AllCandidates";
import { Input } from "@/components/ui/input";

const page = () => {
  return (
    <div className="w-full flex flex-col items-center gap-4 p-4">
      <Input className="w-1/2 border border-accent" />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All Candidates</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingCandidates />
        </TabsContent>
        <TabsContent value="all">
          <AllCandidates />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
