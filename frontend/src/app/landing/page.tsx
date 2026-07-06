import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import AllCandidates from "./components/all-candidates";
import PendingCandidates from "./components/pending-candidates";
import AcceptedCandidates from "./components/accepted-candidates";

const page = () => {
  return (
    <div className="w-full flex flex-col items-center gap-4 p-4">
      <Input className="w-1/2 border border-accent" />
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="self-center">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All Candidates</TabsTrigger>
          <TabsTrigger value="accepted">Accepted Candidates</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingCandidates />
        </TabsContent>
        <TabsContent value="all">
          <AllCandidates />
        </TabsContent>
        <TabsContent value="accepted">
          <AcceptedCandidates />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
