import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"; // מחק ייבוא כפול
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
  const [form, setForm] = useState({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "", isCash: false });
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  const [newProjectType, setNewProjectType] = useState("הפקה");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeProject, setActiveProject] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [vatRate, setVatRate] = useState("");
  const [nationalInsuranceRate, setNationalInsuranceRate] = useState("");
  const [incomeTaxRate, setIncomeTaxRate] = useState("");
  const [isVatIncluded, setIsVatIncluded] = useState("לא כולל מע\"מ");
  const calculateVAT = (amount) => {
    if (!amount || isNaN(amount) || !vatRate || isNaN(vatRate)) {
      return 0; // אם אין סכום או מע"מ תקין, החזר 0
    }
  
    if (isVatIncluded === "כולל מע\"מ") {
      // חישוב המע"מ מתוך הסכום הכולל
      const vatMultiplier = 1 + parseFloat(vatRate) / 100;
      return (parseFloat(amount) - parseFloat(amount) / vatMultiplier).toFixed(2);
    }
  
    // חישוב מע"מ רגיל (כאשר לא כולל מע"מ)
    return ((parseFloat(amount) * parseFloat(vatRate)) / 100).toFixed(2);
  };

  const calculateNetAmount = (amount) => {
    if (!amount || isNaN(amount)) return 0;
  
    // המרת הסכום למספר
    const parsedAmount = parseFloat(amount);
  
    // חישוב ביטוח לאומי
    const nationalInsurance = (parsedAmount * parseFloat(nationalInsuranceRate || 0)) / 100;
  
    // חישוב הסכום לאחר ניכוי ביטוח לאומי
    const afterNationalInsurance = parsedAmount - nationalInsurance;
  
    // חישוב מס הכנסה על הסכום לאחר ניכוי ביטוח לאומי
    const incomeTax = (afterNationalInsurance * parseFloat(incomeTaxRate || 0)) / 100;
  
    // חישוב הסכום לאחר ניכוי מס הכנסה
    const netAmount = afterNationalInsurance - incomeTax;
  
    return netAmount.toFixed(2); // החזרת התוצאה עם 2 ספרות אחרי הנקודה
  };  useEffect(() => {
    const fetchData = async () => {
      const settingsSnapshot = await getDocs(collection(db, "settings"));
      const settingsData = settingsSnapshot.docs[0]?.data();
      if (settingsData) {
        setVatRate(settingsData.vatRate || "");
        setNationalInsuranceRate(settingsData.nationalInsuranceRate || "");
        setIncomeTaxRate(settingsData.incomeTaxRate || "");
      }
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
    setForm({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "", isCash: false });
  };

  const editClient = (client) => {
    setForm({
      clientId: client.clientId || "",
      clientName: client.clientName || client.name,
      amount: client.amount,
      status: client.status,
      notes: client.notes,
      date: client.date || "",
      isCash: client.isCash || false
    });
    setEditingId(client.id);
  };

  const deleteClient = async (id) => {
    try {
      console.log("Attempting to delete client with ID:", id); // הדפסת ה-ID לקונסול

      // מחיקת המסמך מהבסיס נתונים
      const clientRef = doc(db, "clients", id.toString());
      await deleteDoc(clientRef);
  
      // עדכון הלקוחות ב-state המקומי
      setClients(clients.filter((c) => c.id !== id));
  
      // איפוס מצב העריכה אם הלקוח שנמחק היה בעריכה
      if (editingId === id) {
        setEditingId(null);
        setForm({ clientId: "", clientName: "", amount: "", status: "", notes: "", date: "", isCash: false });
      }
  
      alert("ההוצאה נמחקה בהצלחה!");
    } catch (error) {
      console.error("Error deleting client:", error.message);
      alert("אירעה שגיאה בעת מחיקת ההוצאה. נסה שוב.");
    }
  };

  const addProject = async () => {
    if (!newProjectName.trim()) return;

    const updatedProject = {
      name: newProjectName,
      budget: newProjectBudget,
      description: newProjectDescription,
      date: newProjectDate,
      type: newProjectType,
      client: newProjectClient,
      vatIncluded: isVatIncluded,
    };

    if (editingId) {
      // עדכון פרויקט קיים
      const projectRef = collection(db, "projects");
      const snapshot = await getDocs(projectRef);
      const docToUpdate = snapshot.docs.find((doc) => doc.data().name === editingId);

      if (docToUpdate) {
        await updateDoc(doc(db, "projects", docToUpdate.id), updatedProject);
        setProjects(projects.map((p) => (p.name === editingId ? updatedProject : p)));
      }
      setEditingId(null); // איפוס מצב העריכה
    } else {
      // יצירת פרויקט חדש
      if (!projects.find((p) => p.name === newProjectName)) {
        const docRef = await addDoc(collection(db, "projects"), updatedProject);
        setProjects([...projects, { ...updatedProject, id: docRef.id }]);
      }
    }

    // איפוס הטופס
    setNewProjectName("");
    setNewProjectBudget("");
    setNewProjectDescription("");
    setNewProjectDate("");
    setNewProjectType("הפקה");
    setNewProjectClient("");
    setIsVatIncluded("לא כולל מע\"מ");
  };

  const deleteProject = async (projectName) => {
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${projectName}"?`);
    if (!confirmDelete) return;
  
    const projectDoc = projects.find((p) => p.name === projectName);
    if (!projectDoc) return;
  
    const projectRef = collection(db, "projects");
    const snapshot = await getDocs(projectRef);
    const docToDelete = snapshot.docs.find((doc) => doc.data().name === projectName);
  
    if (docToDelete) {
      await deleteDoc(doc(db, "projects", docToDelete.id));
      setProjects(projects.filter((p) => p.name !== projectName));
      if (activeProject === projectName) {
        setActiveProject(null);
      }
    }
  };

  const editProject = (project) => {
    setNewProjectName(project.name);
    setNewProjectBudget(project.budget);
    setNewProjectDescription(project.description);
    setNewProjectDate(project.date);
    setNewProjectType(project.type);
    setNewProjectClient(project.client);
    setIsVatIncluded(project.vatIncluded || "לא כולל מע\"מ");
    setEditingId(project.name); // נשתמש בשם הפרויקט כ-ID לעריכה
    setActiveProject(null); // חזרה לטופס יצירת פרויקט
  };

  const cancelEdit = () => {
    setNewProjectName("");
    setNewProjectBudget("");
    setNewProjectDescription("");
    setNewProjectDate("");
    setNewProjectType("הפקה");
    setNewProjectClient("");
    setIsVatIncluded("לא כולל מע\"מ");
    setEditingId(null); // איפוס מצב העריכה
  };

  const setActiveProjectAndScroll = (projectName) => {
    setActiveProject(projectName);
    window.scrollTo({ top: 0, behavior: "smooth" }); // גלילה לראש הדף עם אנימציה חלקה
  };

  const clientsInProject = clients.filter((c) => c.project === activeProject);
  const availableClients = clients;
  const currentProject = projects.find((p) => p.name === activeProject);
  const filteredProjects = (filterType === "all" ? projects : projects.filter(p => p.type === filterType))
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const projectData = projects.map((project) => {
    const totalExpenses = clients
      .filter((client) => client.project === project.name)
      .reduce((acc, client) => acc + parseFloat(client.amount || 0), 0);
  
    const percentageUsed = ((totalExpenses / parseFloat(project.budget || 1)) * 100).toFixed(2);
  
    return {
      name: project.name,
      expenses: totalExpenses,
      percentage: parseFloat(percentageUsed),
    };
  });

  const [openMenuIndex, setOpenMenuIndex] = useState(null); // State לשליטה בתפריט לפי אינדקס

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
              <Textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="תיאור הפרויקט (אופציונלי)" />

              <Input value={newProjectBudget} onChange={(e) => setNewProjectBudget(e.target.value)} placeholder="סכום כולל לפרויקט" type="number" />
              <Select value={isVatIncluded} onValueChange={(val) => setIsVatIncluded(val)}>
    <SelectTrigger>מע"מ: {isVatIncluded}</SelectTrigger>
    <SelectContent>
      <SelectItem value="כולל מע&quot;מ">כולל מע"מ</SelectItem>
      <SelectItem value="לא כולל מע&quot;מ">לא כולל מע"מ</SelectItem>
    </SelectContent>
    </Select>
              <div>
  <label className="block text-sm font-medium mb-1">מע"מ (₪)</label>
  <Input
    type="text"
    value={newProjectBudget ? calculateVAT(newProjectBudget) : ""}
    readOnly
    placeholder="מעמ יחושב אוטומטית"
    className="bg-gray-100 cursor-not-allowed"
  />
</div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך הפרויקט</label>
                <Input 
                  value={newProjectDate} 
                  onChange={(e) => setNewProjectDate(e.target.value)} 
                  type="date" 
                  placeholder="תאריך הפרויקט" 
                />
              </div>
              <Input value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)} placeholder="שם הלקוח" />
              <Select value={newProjectType} onValueChange={(val) => setNewProjectType(val)}>
                <SelectTrigger>סוג הפרויקט: {newProjectType}</SelectTrigger>
                <SelectContent>
                <SelectItem value="הפקה">הפקה</SelectItem>
                <SelectItem value="חתונה">חתונה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
  <Button onClick={addProject}>
    {editingId ? "שמור שינויים" : "צור פרויקט חדש"}
  </Button>
  {editingId && (
    <Button variant="outline" onClick={cancelEdit}>
      ביטול
    </Button>
  )}
</div>
              <Select value={sortOrder} onValueChange={(val) => setSortOrder(val)}>
                <SelectTrigger>מיין לפי תאריך: {sortOrder === "asc" ? "עולה" : "יורד"}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">עולה</SelectItem>
                  <SelectItem value="desc">יורד</SelectItem>
                </SelectContent>
              </Select>
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
              {filteredProjects.map((project, index) => (
  <div
    key={project.name}
    className="flex justify-between items-center border-b py-2 cursor-pointer hover:bg-gray-50"
  >
    <span
      className="font-medium"
      onClick={() => setActiveProjectAndScroll(project.name)}
    >
      {project.name}
    </span>
    <div className="flex items-center gap-2 relative">
      <span className="text-sm text-gray-500">{project.date}</span>
      <button
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation(); // מונע את הפעלת setActiveProject
          setOpenMenuIndex(index === openMenuIndex ? null : index); // פותח/סוגר את התפריט לפי אינדקס
        }}
      >
        {/* אייקון של שלוש נקודות */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
      </button>
      {openMenuIndex === index && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setOpenMenuIndex(null); // סגור את התפריט
              editProject(project);
            }}
          >
            ערוך
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
            onClick={() => {
              setOpenMenuIndex(null); // סגור את התפריט
              deleteProject(project.name);
            }}
          >
            מחק
          </button>
        </div>
      )}
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
    <h2 className="text-xl font-semibold">שם הפרויקט: {activeProject}</h2>
    {currentProject?.client && <p className="text-m text-gray-500 mt-1">לקוח: {currentProject.client}</p>}
    {currentProject?.type && <p className="text-l text-gray-800 mt-1">סוג הפרויקט: {currentProject.type}</p>}


  </div>
  <div className="flex flex-col gap-2">
  <Button
    variant="outline"
    className="w-20 sm:w-32 md:w-40 lg:w-48 h-8 sm:h-10 md:h-12 lg:h-14 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center"
    onClick={() => setActiveProject(null)}
  >
    חזרה
  </Button>
  <Button
    variant="outline"
    className="w-20 sm:w-32 md:w-40 lg:w-48 h-8 sm:h-10 md:h-12 lg:h-14 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center"
    onClick={() => editProject(currentProject)}
  >
    ערוך
  </Button>
</div>
</div>
              <div className="text-m text-gray-600 space-y-1">
                <p>סכום כולל לפרויקט: ₪{currentProject.budget}</p>
                <p>סה"כ הוצאות: ₪{clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0)}</p>
                <p className={`font-semibold ${parseFloat(currentProject.budget || 0) - clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  יתרה: ₪{(parseFloat(currentProject.budget || 0) - clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0))} (
                  {(100 * clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0) / parseFloat(currentProject.budget || 1)).toFixed(0)}% נוצל)
                </p>
              </div>
{/* גרף הוצאות מתוך ההכנסות */}
<div className="flex flex-col">
  <ResponsiveContainer width="100%" height={100}>
    <BarChart
          layout="vertical" // שינוי הפריסה לאופקית
      data={[
        {
          name: currentProject.name,
          income: parseFloat(currentProject.budget || 0),
          expenses: clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0),
          remaining: Math.max(
            parseFloat(currentProject.budget || 0) -
              clientsInProject.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0),
            0
          ), // יתרה
        },
      ]}
    >
      <XAxis type="number" /> {/* ציר הערכים */}
      <YAxis type="category" dataKey="name" /> {/* ציר הקטגוריות */}
      <Tooltip />
      <Bar
        dataKey="expenses"
        stackId="a"
        fill="#ff4d4f" // צבע אדום להוצאות
        name="הוצאות"
        label={{ position: "inside", fill: "#ffffff", formatter: (value) => `₪${value}` }}
      />
      <Bar
        dataKey="remaining"
        stackId="a"
        fill="#82ca9d" // צבע ירוק ליתרה
        name="יתרה"
        label={{ position: "inside", fill: "#ffffff", formatter: (value) => `₪${value}` }}
      />
    </BarChart>
  </ResponsiveContainer>
</div>             
 {/* טופס הוספת הוצאות */}
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
                <div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="isCash"
    checked={form.isCash}
    onChange={(e) => setForm({ ...form, isCash: e.target.checked })}
  />
  <label htmlFor="isCash" className="text-sm font-medium">
    מזומן
  </label>
</div>
              </div>
              <Button onClick={addClientToProject}>{editingId ? "שמור שינויים" : "הוסף הוצאה לפרויקט"}</Button>
              {clientsInProject.map((client) => (
  <div key={client.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 border rounded-xl p-4 shadow-sm items-center">
    <div className="font-semibold">{client.name}</div>
    <div>
      ₪{client.amount}
      {client.isCash && (
        <span className="text-sm text-gray-500 ml-2">
          (לאחר מיסים: ₪{calculateNetAmount(client.amount)})
        </span>
      )}
    </div>
    <div>{client.status}</div>
    <div>{client.date}</div>
    <div className="text-sm text-gray-600 col-span-1 md:col-span-1">{client.notes}</div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="w-24 sm:w-32 md:w-40 lg:w-48 h-8 sm:h-10 md:h-12 lg:h-14 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center"
        onClick={() => editClient(client)}
      >
        ערוך
      </Button>
      <Button
        variant="destructive"
        className="w-24 sm:w-32 md:w-40 lg:w-48 h-8 sm:h-10 md:h-12 lg:h-14 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center"
        onClick={() => deleteClient(client.id)}
      >
        מחק
      </Button>
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
            <div>
              <label className="block text-sm font-medium mb-1">מע"מ (%)</label>
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

            <div className="pt-4">
             <Button onClick={async () => {
  const settingsSnapshot = await getDocs(collection(db, "settings"));
  const docId = settingsSnapshot.docs[0]?.id;
  const settingsRef = docId
    ? doc(db, "settings", docId)
    : await addDoc(collection(db, "settings"), {});
  await updateDoc(settingsRef, {
    vatRate,
    nationalInsuranceRate,
    incomeTaxRate,
  });
}}>
  שמור הגדרות
</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
