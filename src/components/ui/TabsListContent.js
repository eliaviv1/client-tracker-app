import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/tabs/Tabs";

export default function TabsListContent({ children }) {
  return (
    <Tabs defaultValue="projects" className="p-6 max-w-5xl mx-auto space-y-6">
      <TabsList>
        <TabsTrigger value="projects">פרויקטים</TabsTrigger>
        <TabsTrigger value="expenses">הוצאות</TabsTrigger>
        <TabsTrigger value="clients">לקוחות</TabsTrigger>
        <TabsTrigger value="settings">הגדרות</TabsTrigger>
      </TabsList>

      <TabsContent value="projects">
        {children.projects || <p>תוכן כרטיסיית פרויקטים</p>}
      </TabsContent>

      <TabsContent value="expenses">
        {children.expenses || <p>תוכן כרטיסיית הוצאות</p>}
      </TabsContent>

      <TabsContent value="clients">
        {children.clients || <p>תוכן כרטיסיית לקוחות</p>}
      </TabsContent>

      <TabsContent value="settings">
        {children.settings || <p>תוכן כרטיסיית הגדרות</p>}
      </TabsContent>
    </Tabs>
  );
}