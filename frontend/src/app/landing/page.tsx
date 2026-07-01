import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingCandidates from "@/components/pendingCandidates/PendingCandidates";
import AllCandidates from "@/components/allCandidates/AllCandidates";

const page = () => {
  return (
    <div className="w-full">
      <input className="w-1/2 border border-accent width-50" />
      <Tabs>
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
