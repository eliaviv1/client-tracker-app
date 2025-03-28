import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmGw1G1Ub2LDGmugfrA3WitymIjbeamOc",
  authDomain: "clients-74af1.firebaseapp.com",
  projectId: "clients-74af1",
  storageBucket: "clients-74af1.firebasestorage.app",
  messagingSenderId: "682928524872",
  appId: "1:682928524872:web:289258d8ac2906a74e927d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ClientTrackerApp() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "" });
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  const [newProjectType, setNewProjectType] = useState("חתונה");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeProject, setActiveProject] = useState(null);

  const [vatRate, setVatRate] = useState("");
  const [nationalInsuranceRate, setNationalInsuranceRate] = useState("");
  const [incomeTaxRate, setIncomeTaxRate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      setClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProjects(projectsSnapshot.docs.map(doc => doc.data()));
    };
    fetchData();
  }, []);

  const addClientToProject = async () => {
    if ((!form.clientId && !form.clientName) || !form.amount || !activeProject) return;
    const name = form.clientId
      ? clients.find((c) => c.id === form.clientId)?.name || ""
      : form.clientName;
    const clientData = {
      ...form,
      id: editingId || Date.now(),
      project: activeProject,
      name
    };
    if (editingId) {
      await updateDoc(doc(db, "clients", editingId.toString()), clientData);
      setClients(clients.map((c) => (c.id === editingId ? clientData : c)));
      setEditingId(null);
    } else {
      const docRef = await addDoc(collection(db, "clients"), clientData);
      setClients([...clients, { ...clientData, id: docRef.id }]);
    }
    setForm({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "" });
  };

  const editClient = (client) => {
    setForm({
      clientId: client.clientId || "",
      clientName: client.clientName || client.name,
      amount: client.amount,
      status: client.status,
      notes: client.notes,
      date: client.date || ""
    });
    setEditingId(client.id);
  };

  const deleteClient = async (id) => {
    await deleteDoc(doc(db, "clients", id.toString()));
    setClients(clients.filter((c) => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "" });
    }
  };

  const addProject = async () => {
    if (!newProjectName.trim()) return;
    if (!projects.find((p) => p.name === newProjectName)) {
      const newProj = {
        name: newProjectName,
        budget: newProjectBudget,
        description: newProjectDescription,
        date: newProjectDate,
        type: newProjectType,
        client: newProjectClient
      };
      await addDoc(collection(db, "projects"), newProj);
      setProjects([...projects, newProj]);
    }
    setNewProjectName("");
    setNewProjectBudget("");
    setNewProjectDescription("");
    setNewProjectDate("");
    setNewProjectType("חתונה");
    setNewProjectClient("");
  };

  const clientsInProject = clients.filter((c) => c.project === activeProject);
  const availableClients = clients;
  const currentProject = projects.find((p) => p.name === activeProject);
  const filteredProjects = filterType === "all" ? projects : projects.filter(p => p.type === filterType);

  return (
    <Tabs defaultValue="projects" className="p-6 max-w-5xl mx-auto space-y-6">
      <TabsList>
        <TabsTrigger value="projects">פרויקטים</TabsTrigger>
        <TabsTrigger value="expenses">הוצאות</TabsTrigger>
        <TabsTrigger value="clients">לקוחות</TabsTrigger>
        <TabsTrigger value="settings">הגדרות</TabsTrigger>
      </TabsList>

      <TabsContent value="projects">
        <h1 className="text-2xl font-bold">ניהול פרויקטים והוצאות</h1>
        {!activeProject && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-xl font-semibold">פרויקטים</h2>
              <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="שם פרויקט חדש" />
              <Input value={newProjectBudget} onChange={(e) => setNewProjectBudget(e.target.value)} placeholder="סכום כולל לפרויקט" type="number" />
              <Textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="תיאור הפרויקט (אופציונלי)" />
              <Input value={newProjectDate} onChange={(e) => setNewProjectDate(e.target.value)} type="date" placeholder="תאריך הפרויקט" />
              <Input value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)} placeholder="שם הלקוח" />
              <Select value={newProjectType} onValueChange={(val) => setNewProjectType(val)}>
                <SelectTrigger>סוג הפרויקט: {newProjectType}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="חתונה">חתונה</SelectItem>
                  <SelectItem value="הפקה">הפקה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addProject}>צור פרויקט חדש</Button>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם או סטטוס..." />
              <Select value={filterType} onValueChange={(val) => setFilterType(val)}>
                <SelectTrigger>סנן לפי סוג: {filterType === "all" ? "הכל" : filterType}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="חתונה">חתונה</SelectItem>
                  <SelectItem value="הפקה">הפקה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
              {filteredProjects.map((project) => (
                <div key={project.name} className="border rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setActiveProject(project.name)}>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    {project.client && <p>לקוח: {project.client}</p>}
                    <p>סכום כולל: ₪{project.budget}</p>
                    {project.type && <p>סוג הפרויקט: {project.type}</p>}
                    {project.date && <p>תאריך: {project.date}</p>}
                    {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
                    <p>{clients.filter((c) => c.project === project.name).length} הוצאות</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeProject && currentProject && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">פרויקט: {activeProject}</h2>
                  {currentProject?.client && <p className="text-sm text-gray-500 mt-1">לקוח: {currentProject.client}</p>}
                  {currentProject?.type && <p className="text-sm text-gray-500 mt-1">סוג הפרויקט: {currentProject.type}</p>}
                </div>
                <Button variant="outline" onClick={() => setActiveProject(null)}>חזרה לכל הפרויקטים</Button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>סכום כולל לפרויקט: ₪{currentProject.budget}</p>
                <p>סה"כ הוצאות: ₪{clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0)}</p>
                <p className={`font-semibold ${parseFloat(currentProject.budget || 0) - clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  יתרה: ₪{(parseFloat(currentProject.budget || 0) - clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0))} (
                  {(100 * clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0) / parseFloat(currentProject.budget || 1)).toFixed(0)}% נוצל)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={form.clientId} onValueChange={(val) => setForm({ ...form, clientId: val, clientName: "" })}>
                  <SelectTrigger>{form.clientId ? clients.find(c => c.id === form.clientId)?.name : "בחר הוצאה קיימת"}</SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input name="clientName" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value, clientId: "" })} placeholder="או צור הוצאה חדשה" />
                <Input name="amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="סכום בפרויקט" type="number" />
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger>{form.status || "בחר סטטוס"}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="בתהליך">בתהליך</SelectItem>
                    <SelectItem value="הושלם">הושלם</SelectItem>
                    <SelectItem value="ממתין לתשלום">ממתין לתשלום</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" placeholder="תאריך העבודה" />
                <Textarea name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="הערות נוספות" className="md:col-span-2" />
              </div>
              <Button onClick={addClientToProject}>{editingId ? "שמור שינויים" : "הוסף הוצאה לפרויקט"}</Button>
              {clientsInProject.map((client) => (
                <div key={client.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 border rounded-xl p-4 shadow-sm items-center">
                  <div className="font-semibold">{client.name}</div>
                  <div>₪{client.amount}</div>
                  <div>{client.status}</div>
                  <div>{client.date}</div>
                  <div className="text-sm text-gray-600 col-span-1 md:col-span-1">{client.notes}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editClient(client)}>ערוך</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteClient(client.id)}>מחק</Button>
                  </div>
                </div>
              ))}
              {clientsInProject.length === 0 && <p>אין הוצאות בפרויקט זה.</p>}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="expenses">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם, סטטוס או פרויקט..." className="mb-4" />
            <Select value={activeProject || "all"} onValueChange={(val) => setActiveProject(val === "all" ? null : val)}>
              <SelectTrigger>סינון לפי פרויקט: {activeProject || "הכל"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.name} value={project.name}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 ? (
              <p>אין הוצאות להצגה.</p>
            ) : (
              <div className="space-y-2">
                {clients
                  .filter(c => (!activeProject || c.project === activeProject) && (c.name.includes(search) || c.status.includes(search) || (c.project || "").includes(search)))
                  .map((client) => (
                    <div key={client.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 border rounded-xl p-4 shadow-sm items-center">
                      <div className="font-semibold">{client.name}</div>
                      <div>₪{client.amount}</div>
                      <div>{client.status}</div>
                      <div>{client.date}</div>
                      <div className="text-sm text-gray-600 col-span-1 md:col-span-1">{client.notes}</div>
                      <div className="text-sm text-gray-500">{client.project}</div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clients">
        <h1 className="text-2xl font-bold">כרטיסיית לקוחות (בפיתוח)</h1>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-2xl font-bold">הגדרות</h1>
            <p className="text-gray-600">הזן כאן אחוזים כלליים שישמשו לחישובי הוצאות ודוחות:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">מע״מ (%)</label>
                <Input
                  type="number"
                  placeholder="למשל: 17"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ביטוח לאומי (%)</label>
                <Input
                  type="number"
                  placeholder="למשל: 3.5"
                  value={nationalInsuranceRate}
                  onChange={(e) => setNationalInsuranceRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">מס הכנסה (%)</label>
                <Input
                  type="number"
                  placeholder="למשל: 10"
                  value={incomeTaxRate}
                  onChange={(e) => setIncomeTaxRate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
