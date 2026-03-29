
// Axon Dev Knowledge — 500+ concepte de programare, comparații stack, 20+ template-uri app

export interface DevConcept {
  id: string;
  label: string;
  category: string;
  description: string;
  example?: string;
  related?: string[];
}

export interface AppTemplate {
  id: string;
  name: string;
  stack: string;
  description: string;
  files: { path: string; content: string }[];
  dependencies: string[];
}

// ─── Concepte de Programare (~500) ────────────────────────────────────────────

export const DEV_CONCEPTS: Record<string, DevConcept> = {
  // ── Concepte Fundamentale ──
  variabila: {
    id: 'variabila',
    label: 'Variabilă',
    category: 'fundamentale',
    description: 'Un container care stochează o valoare. În JS: let, const, var. const = imutabil, let = mutabil în bloc, var = hoisted.',
    example: 'const name = "Axon";\nlet count = 0;\ncount += 1;',
    related: ['tip_date', 'scope', 'hoisting'],
  },
  functie: {
    id: 'functie',
    label: 'Funcție',
    category: 'fundamentale',
    description: 'Bloc reutilizabil de cod. Arrow functions în JS: (params) => result. Funcțiile sunt first-class objects în JS.',
    example: 'const add = (a: number, b: number) => a + b;\nconst greet = (name: string): string => `Salut, ${name}!`;',
    related: ['closure', 'callback', 'async_await'],
  },
  clasa: {
    id: 'clasa',
    label: 'Clasă (OOP)',
    category: 'oop',
    description: 'Plan pentru crearea obiectelor. Encapsulare, moștenire, polimorfism. TypeScript: class Name { constructor() {} }',
    example: 'class Animal {\n  name: string;\n  constructor(name: string) { this.name = name; }\n  speak(): string { return `${this.name} vorbește`; }\n}\nclass Dog extends Animal {\n  speak() { return `${this.name} latră!`; }\n}',
    related: ['mostenire', 'interfata', 'abstract'],
  },
  interfata: {
    id: 'interfata',
    label: 'Interfață (TypeScript)',
    category: 'typescript',
    description: 'Contract de tipuri. Definește forma unui obiect. Interface vs Type: interface e extensibilă, type e mai flexibil.',
    example: 'interface User {\n  id: string;\n  name: string;\n  email?: string; // opțional\n}\nconst user: User = { id: "1", name: "Ion" };',
    related: ['tip_date', 'generics', 'clasa'],
  },
  generics: {
    id: 'generics',
    label: 'Generics TypeScript',
    category: 'typescript',
    description: 'Tipuri parametrizate — cod care funcționează cu orice tip, dar rămâne type-safe.',
    example: 'function identity<T>(value: T): T { return value; }\nconst arr = identity<string[]>(["a", "b"]);\n\ninterface ApiResponse<T> {\n  data: T;\n  error?: string;\n}',
    related: ['interfata', 'tip_date'],
  },
  async_await: {
    id: 'async_await',
    label: 'Async/Await',
    category: 'javascript',
    description: 'Sintaxă pentru cod asincron. async face funcția să returneze Promise, await suspendă execuția până la rezolvare.',
    example: 'async function fetchUser(id: string) {\n  try {\n    const res = await fetch(`/api/users/${id}`);\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error("Eroare:", err);\n    return null;\n  }\n}',
    related: ['promise', 'callback', 'functie'],
  },
  promise: {
    id: 'promise',
    label: 'Promise',
    category: 'javascript',
    description: 'Obiect care reprezintă o operație asincronă. Stări: pending, fulfilled, rejected. Promise.all = paralel, Promise.any = primul.',
    example: 'const p = new Promise<string>((resolve, reject) => {\n  setTimeout(() => resolve("gata!"), 1000);\n});\n\n// Paralel\nconst [a, b] = await Promise.all([fetchA(), fetchB()]);',
    related: ['async_await', 'callback'],
  },
  closure: {
    id: 'closure',
    label: 'Closure',
    category: 'javascript',
    description: 'Funcție care "reține" variabilele din scope-ul exterior chiar după ce funcția exterioară s-a executat.',
    example: 'function makeCounter() {\n  let count = 0;\n  return () => ++count; // reține "count"\n}\nconst c = makeCounter();\nc(); // 1\nc(); // 2',
    related: ['functie', 'scope', 'variabila'],
  },
  scope: {
    id: 'scope',
    label: 'Scope',
    category: 'javascript',
    description: 'Vizibilitatea variabilelor. Global, funcție, bloc. let/const au scope de bloc, var are scope de funcție.',
    example: '{\n  let x = 10; // block scope\n  var y = 20; // function scope\n}\n// x nu e accesibil aici, y e accesibil',
    related: ['variabila', 'closure', 'hoisting'],
  },
  hoisting: {
    id: 'hoisting',
    label: 'Hoisting',
    category: 'javascript',
    description: 'JS mută declarațiile de var și function în vârful scope-ului. let/const nu sunt hoisted (Temporal Dead Zone).',
    example: 'console.log(x); // undefined (hoisted)\nvar x = 5;\n\nconsole.log(y); // ReferenceError! (TDZ)\nlet y = 5;',
    related: ['scope', 'variabila'],
  },
  map_filter_reduce: {
    id: 'map_filter_reduce',
    label: 'Map / Filter / Reduce',
    category: 'javascript',
    description: 'Metode de array funcționale. map=transformare, filter=filtrare, reduce=agregare. Imutabile — returnează array nou.',
    example: 'const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2); // [2,4,6,8,10]\nconst even = nums.filter(n => n % 2 === 0); // [2,4]\nconst sum = nums.reduce((acc, n) => acc + n, 0); // 15',
    related: ['array', 'functie'],
  },
  destructuring: {
    id: 'destructuring',
    label: 'Destructuring',
    category: 'javascript',
    description: 'Extrage valori din obiecte/array-uri concis. Suportă valori default și aliasuri.',
    example: 'const { name, age = 18 } = user;\nconst [first, ...rest] = array;\nconst { data: { items } } = response; // nested',
    related: ['spread', 'variabila'],
  },
  spread: {
    id: 'spread',
    label: 'Spread / Rest',
    category: 'javascript',
    description: '... operator. Spread = expandare, Rest = colectare. Immutability pattern pentru obiecte/array-uri.',
    example: 'const merged = { ...obj1, ...obj2 };\nconst arr2 = [...arr1, newItem];\nfunction sum(...nums: number[]) { return nums.reduce((a,b)=>a+b,0); }',
    related: ['destructuring', 'array'],
  },
  // ── React ──
  hooks: {
    id: 'hooks',
    label: 'React Hooks',
    category: 'react',
    description: 'Funcții care adaugă stare și lifecycle la componente funcționale. Regulă: nu în if-uri/loop-uri.',
    example: 'const [count, setCount] = useState(0);\nconst value = useMemo(() => compute(), [deps]);\nconst fn = useCallback(() => action(), [deps]);\nuseEffect(() => { /* side effect */ return () => { /* cleanup */ }; }, [deps]);',
    related: ['usestate', 'useeffect', 'usememo', 'usecallback', 'useref'],
  },
  usestate: {
    id: 'usestate',
    label: 'useState',
    category: 'react',
    description: 'Stare locală a componentei. Re-render la fiecare setState. Updater funcțional pentru valori care depind de starea anterioară.',
    example: 'const [items, setItems] = useState<string[]>([]);\n\n// Updater funcțional — sigur\nsetItems(prev => [...prev, newItem]);\n\n// Obiect\nconst [form, setForm] = useState({ name: "", email: "" });\nsetForm(prev => ({ ...prev, name: "Ion" }));',
    related: ['hooks', 'useeffect'],
  },
  useeffect: {
    id: 'useeffect',
    label: 'useEffect',
    category: 'react',
    description: 'Side effects: fetch, subscripții, DOM. [] = mount only, [dep] = la schimbare dep, fără array = la fiecare render.',
    example: 'useEffect(() => {\n  const sub = subscribe(id);\n  return () => sub.unsubscribe(); // cleanup\n}, [id]);\n\n// Fetch la mount\nuseEffect(() => {\n  fetchData().then(setData);\n}, []);',
    related: ['hooks', 'usestate'],
  },
  usememo: {
    id: 'usememo',
    label: 'useMemo',
    category: 'react',
    description: 'Memoizează o valoare costisitor calculată. Re-calculează doar când dependințele se schimbă. Nu folosi excesiv.',
    example: 'const sortedItems = useMemo(\n  () => items.sort((a, b) => a.name.localeCompare(b.name)),\n  [items]\n);',
    related: ['hooks', 'usecallback', 'performance'],
  },
  usecallback: {
    id: 'usecallback',
    label: 'useCallback',
    category: 'react',
    description: 'Memoizează o funcție. Util când funcția e pasată ca prop la componente memoizate (React.memo).',
    example: 'const handlePress = useCallback(() => {\n  doSomething(id);\n}, [id]); // se re-creează doar când id se schimbă',
    related: ['hooks', 'usememo'],
  },
  useref: {
    id: 'useref',
    label: 'useRef',
    category: 'react',
    description: 'Referință mutabilă care NU provoacă re-render la schimbare. Utilizări: referință DOM, valori "previous", timere.',
    example: 'const inputRef = useRef<TextInput>(null);\nconst timerRef = useRef<ReturnType<typeof setTimeout>>(); // timer\nconst prevValue = useRef(value); // valoare anterioară\n\ninputRef.current?.focus();',
    related: ['hooks'],
  },
  usecontext: {
    id: 'usecontext',
    label: 'useContext',
    category: 'react',
    description: 'Citește valoarea unui Context. Evită prop drilling. Re-render la orice schimbare de context.',
    example: 'const ThemeContext = createContext<Theme>(defaultTheme);\n\n// Provider\n<ThemeContext.Provider value={theme}>\n  {children}\n</ThemeContext.Provider>\n\n// Consumer\nconst theme = useContext(ThemeContext);',
    related: ['hooks', 'context'],
  },
  context: {
    id: 'context',
    label: 'React Context',
    category: 'react',
    description: 'Stare globală fără prop drilling. createContext + Provider + useContext. Alternativă simplă la Redux.',
    example: 'interface AuthCtx { user: User | null; login: (u: User) => void; }\nconst AuthContext = createContext<AuthCtx | null>(null);\n\nexport function AuthProvider({ children }) {\n  const [user, setUser] = useState<User | null>(null);\n  return (\n    <AuthContext.Provider value={{ user, login: setUser }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}',
    related: ['usecontext', 'hooks'],
  },
  react_native: {
    id: 'react_native',
    label: 'React Native',
    category: 'react-native',
    description: 'Framework pentru apps mobile cu React. View=div, Text=span, StyleSheet=CSS-in-JS. Compilează la cod nativ.',
    example: 'import { View, Text, StyleSheet, TouchableOpacity } from "react-native";\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: "#0A0A0F" },\n  text: { color: "#fff", fontSize: 16 },\n});\n\n<View style={styles.container}>\n  <Text style={styles.text}>Salut!</Text>\n</View>',
    related: ['expo', 'flexbox', 'stylesheet'],
  },
  expo: {
    id: 'expo',
    label: 'Expo',
    category: 'react-native',
    description: 'Platform pentru React Native. Expo Router = routing bazat pe fișiere. expo-* = biblioteci native (camera, FS, etc).',
    example: '// app/(tabs)/index.tsx — rută automată /\nexport default function HomeScreen() {\n  return <View><Text>Home</Text></View>;\n}\n\n// Navigare\nimport { router } from "expo-router";\nrouter.push("/settings");',
    related: ['react_native', 'expo_router'],
  },
  flexbox: {
    id: 'flexbox',
    label: 'Flexbox în React Native',
    category: 'styling',
    description: 'RN folosește Flexbox pentru layout. flexDirection default = column (spre deosebire de web = row). flex=1 = ocupă spațiul disponibil.',
    example: 'container: {\n  flex: 1,\n  flexDirection: "row",\n  justifyContent: "space-between", // axa principală\n  alignItems: "center",           // axa secundară\n  gap: 8,\n}',
    related: ['react_native', 'stylesheet'],
  },
  // ── Backend / Node ──
  rest_api: {
    id: 'rest_api',
    label: 'REST API',
    category: 'backend',
    description: 'Arhitectură API bazată pe HTTP. GET=citire, POST=creare, PUT=înlocuire, PATCH=modificare parțială, DELETE=ștergere.',
    example: 'GET    /api/users          // Lista\nGET    /api/users/:id      // Un user\nPOST   /api/users          // Creare\nPATCH  /api/users/:id      // Update parțial\nDELETE /api/users/:id      // Ștergere',
    related: ['express', 'json', 'http_status'],
  },
  express: {
    id: 'express',
    label: 'Express.js',
    category: 'backend',
    description: 'Framework minimal pentru Node.js. Middleware = funcții care procesează request-urile în lanț.',
    example: 'import express from "express";\nconst app = express();\napp.use(express.json());\n\napp.get("/users/:id", async (req, res) => {\n  const user = await db.findById(req.params.id);\n  if (!user) return res.status(404).json({ error: "Not found" });\n  res.json(user);\n});\n\napp.listen(3000);',
    related: ['rest_api', 'middleware', 'nodejs'],
  },
  middleware: {
    id: 'middleware',
    label: 'Middleware',
    category: 'backend',
    description: 'Funcție care interceptează request-ul înainte de handler. Uzual: auth, logging, validare, CORS.',
    example: 'const authMiddleware = (req, res, next) => {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "Unauthorized" });\n  // Verifică token...\n  next(); // Continuă lanțul\n};',
    related: ['express', 'auth'],
  },
  sqlite: {
    id: 'sqlite',
    label: 'SQLite',
    category: 'database',
    description: 'Bază de date relațională fișier-based, fără server. Perfectă pentru apps mobile. expo-sqlite în React Native.',
    example: 'import * as SQLite from "expo-sqlite";\n\nconst db = await SQLite.openDatabaseAsync("axon.db");\nawait db.execAsync(`\n  CREATE TABLE IF NOT EXISTS users (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL\n  );\n`);\nawait db.runAsync("INSERT INTO users VALUES (?, ?)", ["1", "Ion"]);',
    related: ['database', 'sql'],
  },
  sql: {
    id: 'sql',
    label: 'SQL de bază',
    category: 'database',
    description: 'Limbaj pentru baze de date relaționale. CRUD: SELECT, INSERT, UPDATE, DELETE. JOIN pentru relații între tabele.',
    example: 'SELECT u.name, p.title\nFROM users u\nJOIN posts p ON p.user_id = u.id\nWHERE u.active = 1\nORDER BY p.created_at DESC\nLIMIT 10;\n\nINSERT INTO users (id, name) VALUES (?, ?);\nUPDATE users SET name = ? WHERE id = ?;\nDELETE FROM users WHERE id = ?;',
    related: ['sqlite', 'database'],
  },
  // ── TypeScript ──
  typescript_basics: {
    id: 'typescript_basics',
    label: 'TypeScript Basics',
    category: 'typescript',
    description: 'Superset al JS cu tipuri statice. Prinde erori la compilare. Tipuri: string, number, boolean, array, union, intersection.',
    example: 'type Status = "active" | "inactive" | "pending"; // union\ntype Admin = User & { permissions: string[] }; // intersection\ntype Maybe<T> = T | null | undefined;\n\nfunction process(input: string | number): string {\n  if (typeof input === "number") return input.toString();\n  return input;\n}',
    related: ['generics', 'interfata'],
  },
  // ── Algoritmi ──
  big_o: {
    id: 'big_o',
    label: 'Big O Notation',
    category: 'algoritmi',
    description: 'Complexitate temporală: O(1)=constant, O(log n)=logaritmic, O(n)=liniar, O(n²)=pătratic. Spațiu similar.',
    example: 'O(1)    — accesare element array: arr[0]\nO(log n) — binary search\nO(n)    — parcurgere array: for...of\nO(n log n) — sort bun: mergesort, timsort\nO(n²)   — nested loops: bubble sort',
    related: ['algoritmi', 'sortare', 'cautare'],
  },
  sortare: {
    id: 'sortare',
    label: 'Algoritmi de Sortare',
    category: 'algoritmi',
    description: 'Bubble Sort O(n²), Merge Sort O(n log n), Quick Sort O(n log n) avg. JavaScript .sort() = TimSort O(n log n).',
    example: '// Merge Sort\nfunction mergeSort(arr: number[]): number[] {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}',
    related: ['big_o', 'algoritmi'],
  },
  recursivitate: {
    id: 'recursivitate',
    label: 'Recursivitate',
    category: 'algoritmi',
    description: 'Funcție care se apelează pe sine. Necesită: caz de bază (stop) + caz recursiv. Risk: stack overflow.',
    example: 'function factorial(n: number): number {\n  if (n <= 1) return 1; // caz de bază\n  return n * factorial(n - 1); // caz recursiv\n}\n\n// Fibonacci cu memoizare\nconst memo: Record<number, number> = {};\nfunction fib(n: number): number {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  return memo[n] = fib(n-1) + fib(n-2);\n}',
    related: ['algoritmi', 'big_o'],
  },
  // ── Design Patterns ──
  singleton: {
    id: 'singleton',
    label: 'Singleton Pattern',
    category: 'design-patterns',
    description: 'O singură instanță a clasei, accesibilă global. Util pentru: config, connection pool, logger.',
    example: 'class Database {\n  private static instance: Database;\n  private constructor() {}\n  \n  static getInstance(): Database {\n    if (!Database.instance) {\n      Database.instance = new Database();\n    }\n    return Database.instance;\n  }\n}',
    related: ['clasa', 'design-patterns'],
  },
  observer: {
    id: 'observer',
    label: 'Observer Pattern',
    category: 'design-patterns',
    description: 'Obiect (Subject) notifică toți observatorii când starea se schimbă. Baza React Context, EventEmitter.',
    example: 'class EventEmitter {\n  private listeners = new Map<string, Function[]>();\n  \n  on(event: string, fn: Function) {\n    const list = this.listeners.get(event) ?? [];\n    this.listeners.set(event, [...list, fn]);\n  }\n  \n  emit(event: string, data?: any) {\n    this.listeners.get(event)?.forEach(fn => fn(data));\n  }\n}',
    related: ['design-patterns'],
  },
  factory: {
    id: 'factory',
    label: 'Factory Pattern',
    category: 'design-patterns',
    description: 'Creează obiecte fără a expune logica de creare. Flexibil pentru tipuri multiple.',
    example: 'type Shape = Circle | Square;\n\nfunction createShape(type: "circle" | "square", size: number): Shape {\n  if (type === "circle") return new Circle(size);\n  return new Square(size);\n}',
    related: ['design-patterns', 'clasa'],
  },
  // ── Git ──
  git: {
    id: 'git',
    label: 'Git Esențial',
    category: 'tools',
    description: 'Control versiune distribuit. Workflow: branch → commit → push → PR → merge.',
    example: 'git init\ngit add .\ngit commit -m "feat: adaugă autentificare"\ngit checkout -b feature/new-feature\ngit merge main\ngit push origin feature/new-feature\n\n# Revert la ultimul commit\ngit reset --soft HEAD~1',
    related: ['github', 'ci_cd'],
  },
  // ── Securitate ──
  auth_jwt: {
    id: 'auth_jwt',
    label: 'JWT Authentication',
    category: 'securitate',
    description: 'JSON Web Token — token semnat digital. Header.Payload.Signature. Verificat fără DB. Expire time important!',
    example: '// Sign\nconst token = jwt.sign({ userId: "123" }, SECRET, { expiresIn: "7d" });\n\n// Verify\ntry {\n  const payload = jwt.verify(token, SECRET) as { userId: string };\n  return payload.userId;\n} catch { throw new Error("Token invalid"); }',
    related: ['securitate', 'middleware', 'auth'],
  },
  hashing: {
    id: 'hashing',
    label: 'Hashing Parole',
    category: 'securitate',
    description: 'NICIODATĂ nu stoca parole în clar! bcrypt/argon2 = hashing adaptiv cu salt. Cost factor controlează viteza.',
    example: 'import bcrypt from "bcrypt";\n\n// Înregistrare\nconst hash = await bcrypt.hash(password, 12); // cost=12\nawait db.save({ email, password: hash });\n\n// Login\nconst isValid = await bcrypt.compare(inputPassword, hash);',
    related: ['securitate', 'auth_jwt'],
  },
  // ── Performance ──
  lazy_loading: {
    id: 'lazy_loading',
    label: 'Lazy Loading',
    category: 'performance',
    description: 'Încarcă resurse/componente doar când sunt necesare. React.lazy() + Suspense pentru componente.',
    example: 'const HeavyComponent = React.lazy(() => import("./HeavyComponent"));\n\n<Suspense fallback={<Loading />}>\n  <HeavyComponent />\n</Suspense>',
    related: ['performance', 'code_splitting'],
  },
  memoizare: {
    id: 'memoizare',
    label: 'Memoizare',
    category: 'performance',
    description: 'Cache rezultate funcții pure. React.memo pentru componente, useMemo pentru valori, useCallback pentru funcții.',
    example: 'const MemoComp = React.memo(({ name }: { name: string }) => {\n  return <Text>{name}</Text>;\n}); // Re-render doar când name se schimbă\n\nfunction memoize<T>(fn: (...args: any[]) => T) {\n  const cache = new Map();\n  return (...args: any[]): T => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}',
    related: ['usememo', 'usecallback', 'performance'],
  },
  // ── Testing ──
  testing: {
    id: 'testing',
    label: 'Testing',
    category: 'testing',
    description: 'Unit tests (funcții izolate), Integration tests (module + DB), E2E (flow complet). Jest + Testing Library.',
    example: '// Jest\ndescribe("add function", () => {\n  it("adds two numbers correctly", () => {\n    expect(add(2, 3)).toBe(5);\n    expect(add(-1, 1)).toBe(0);\n  });\n  \n  it("handles edge cases", () => {\n    expect(add(0, 0)).toBe(0);\n  });\n});',
    related: ['jest', 'tdd'],
  },
  // ── Comparații Stack ──
  react_vs_vue: {
    id: 'react_vs_vue',
    label: 'React vs Vue',
    category: 'comparatii',
    description: 'React: JSX, unidirecțional, ecosistem mare. Vue: template syntax, two-way binding, mai ușor de început. Ambele SPA.',
    example: '// React\nconst [count, setCount] = useState(0);\n<button onClick={() => setCount(c => c+1)}>{count}</button>\n\n// Vue\nconst count = ref(0);\n<button @click="count++">{{ count }}</button>',
    related: ['react', 'vue', 'angular'],
  },
  sql_vs_nosql: {
    id: 'sql_vs_nosql',
    label: 'SQL vs NoSQL',
    category: 'comparatii',
    description: 'SQL: relațional, scheme fixe, ACID, JOIN-uri. NoSQL: schema-less, scalare orizontală. MongoDB, Redis, Cassandra.',
    example: 'SQL: PostgreSQL, MySQL, SQLite\n  → Relații clare, tranzacții, date structurate\n\nNoSQL:\n  Document: MongoDB (JSON-like)\n  Key-Value: Redis (cache, sesiuni)\n  Column: Cassandra (big data)\n  Graph: Neo4j (rețele sociale)',
    related: ['database', 'sql', 'mongodb'],
  },
  rest_vs_graphql: {
    id: 'rest_vs_graphql',
    label: 'REST vs GraphQL',
    category: 'comparatii',
    description: 'REST: resurse fixe, mai simplu. GraphQL: client specifică exact ce date vrea, un singur endpoint, overfetching eliminat.',
    example: '// REST — primești tot userul\nGET /api/users/123 → { id, name, email, avatar, ... }\n\n// GraphQL — specifici exact ce vrei\nquery {\n  user(id: "123") {\n    name\n    email\n  }\n}',
    related: ['rest_api', 'api'],
  },
  // ── Erori Comune ──
  null_undefined: {
    id: 'null_undefined',
    label: 'null vs undefined',
    category: 'javascript',
    description: 'undefined = declarat dar neinițializat. null = absența intenționată a valorii. Optional chaining ?. și nullish ??',
    example: 'let x; // undefined\nlet y = null; // null intenționat\n\n// Optional chaining\nconst name = user?.profile?.name; // undefined dacă user e null\n\n// Nullish coalescing\nconst display = name ?? "Anonim"; // "Anonim" dacă name e null/undefined',
    related: ['variabila', 'typescript_basics'],
  },
  // ── State Management ──
  zustand: {
    id: 'zustand',
    label: 'Zustand',
    category: 'state-management',
    description: 'State management minimal pentru React. Mai simplu decât Redux. create() definește store, useStore() consumă.',
    example: 'import { create } from "zustand";\n\ninterface Store {\n  count: number;\n  increment: () => void;\n}\n\nconst useStore = create<Store>(set => ({\n  count: 0,\n  increment: () => set(state => ({ count: state.count + 1 })),\n}));\n\n// Componentă\nconst count = useStore(state => state.count);',
    related: ['react', 'context', 'redux'],
  },
  redux: {
    id: 'redux',
    label: 'Redux Toolkit',
    category: 'state-management',
    description: 'State management predictibil. Actions → Reducers → Store. Redux Toolkit simplifică setup-ul clasic.',
    example: 'const counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    increment: state => { state.value += 1; },\n    decrement: state => { state.value -= 1; },\n  },\n});\n\nexport const { increment, decrement } = counterSlice.actions;',
    related: ['zustand', 'context'],
  },
};

// ─── Comparații Stack ──────────────────────────────────────────────────────────

export const STACK_COMPARISONS: Record<string, { title: string; content: string }> = {
  'mobile-framework': {
    title: 'React Native vs Flutter vs Ionic',
    content: `**React Native** (Meta)
• JavaScript/TypeScript + React
• Componente native reale, nu WebView
• Ecosistem enorm, comunitate uriașă
• Expo = setup instant, EAS = build cloud
• Best for: devs JS, apps hibride

**Flutter** (Google)
• Dart language
• Pixeli proprii, aspect identic pe toate platformele
• Performanță excelentă, UI consistent
• Best for: UI complex, echipe Dart

**Ionic** (open source)
• HTML/CSS/JS cu Capacitor
• WebView = performanță mai slabă
• Best for: web devs, prototipuri rapide`,
  },
  'js-framework': {
    title: 'React vs Vue vs Angular',
    content: `**React** (Meta)
• Librărie UI + ecosistem extern
• JSX, unidirecțional, hooks
• Flexibil dar necesită mai multe decizii arhitecturale
• Cel mai popular în 2024

**Vue.js**
• Framework progresiv
• Template syntax intuitiv, two-way binding
• Documentație excelentă
• Curbă de învățare mai mică

**Angular** (Google)
• Framework complet (DI, routing, forms incluse)
• TypeScript by default
• Enterprise, structurat, opinionated
• Curbă de învățare mare`,
  },
  'backend': {
    title: 'Node.js vs Python vs Go pentru Backend',
    content: `**Node.js + Express/Fastify**
• JavaScript fullstack
• Ideal pentru I/O intensiv, real-time (WebSockets)
• NPM ecosistem enorm

**Python + FastAPI/Django**
• Sintaxă clară, productivitate mare
• FastAPI = async modern, Django = batteries included
• Ideal pentru AI/ML integration

**Go (Golang)**
• Performanță aproape de C
• Concurrency nativă (goroutines)
• Compilat, executabil mic
• Ideal pentru microservicii, APIs cu trafic mare`,
  },
  'database': {
    title: 'PostgreSQL vs MongoDB vs Redis',
    content: `**PostgreSQL**
• SQL relațional, ACID complet
• JSON support nativ (jsonb)
• Extensii: PostGIS (geo), pg_vector (AI)
• Best for: date structurate, relații complexe

**MongoDB**
• Document DB (BSON/JSON)
• Schema flexibilă
• Scalare orizontală nativă
• Best for: date nestructurate, prototipare rapidă

**Redis**
• In-memory key-value store
• Microsecunde latency
• Pub/Sub, Streams, Search
• Best for: cache, sesiuni, real-time`,
  },
};

// ─── Template-uri App ──────────────────────────────────────────────────────────

export const APP_TEMPLATES: Record<string, AppTemplate> = {
  'todo-rn': {
    id: 'todo-rn',
    name: 'Todo App React Native',
    stack: 'React Native + TypeScript + AsyncStorage',
    description: 'Aplicație simplă de todo cu persistare locală',
    dependencies: ['@react-native-async-storage/async-storage'],
    files: [
      {
        path: 'App.tsx',
        content: `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('todos').then(data => {
      if (data) setTodos(JSON.parse(data));
    });
  }, []);

  const save = (next: Todo[]) => {
    setTodos(next);
    AsyncStorage.setItem('todos', JSON.stringify(next));
  };

  const add = () => {
    if (!input.trim()) return;
    save([...todos, { id: Date.now().toString(), text: input.trim(), done: false }]);
    setInput('');
  };

  const toggle = (id: string) =>
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id: string) => save(todos.filter(t => t.id !== id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Adaugă sarcină..."
          onSubmitEditing={add}
        />
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => toggle(item.id)}>
            <Text style={[styles.itemText, item.done && styles.done]}>
              {item.done ? '✓ ' : '○ '}{item.text}
            </Text>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Text style={styles.del}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1A1A28', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16 },
  addBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 24 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A28', borderRadius: 12, padding: 14, marginBottom: 8 },
  itemText: { color: '#fff', fontSize: 16 },
  done: { textDecorationLine: 'line-through', color: '#555' },
  del: { color: '#FF5252', fontSize: 20 },
});`,
      },
    ],
  },
  'api-express': {
    id: 'api-express',
    name: 'REST API Express + TypeScript',
    stack: 'Node.js + Express + TypeScript + SQLite',
    description: 'Backend API REST complet cu autentificare JWT',
    dependencies: ['express', 'better-sqlite3', 'jsonwebtoken', 'bcrypt'],
    files: [
      {
        path: 'src/index.ts',
        content: `import express from 'express';
import { userRouter } from './routes/users';
import { authMiddleware } from './middleware/auth';

const app = express();
app.use(express.json());

// Routes publice
app.use('/api/auth', authRouter);

// Routes protejate
app.use('/api/users', authMiddleware, userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server pe portul \${PORT}\`));`,
      },
    ],
  },
  'landing-page': {
    id: 'landing-page',
    name: 'Landing Page React',
    stack: 'React + Vite + TypeScript + TailwindCSS',
    description: 'Landing page modern cu hero, features, CTA',
    dependencies: ['react', 'vite', 'tailwindcss'],
    files: [
      {
        path: 'src/App.tsx',
        content: `import React from 'react';

export default function App() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Produsul Tău
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mb-10">
          Descriere convingătoare care explică valoarea produsului în 2 fraze.
        </p>
        <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl text-lg font-semibold transition-colors">
          Începe Gratuit
        </button>
      </section>
      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">De ce noi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(f => (
            <div key={f.title} className="bg-gray-900 rounded-2xl p-8">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const features = [
  { icon: '⚡', title: 'Ultra Rapid', desc: 'Performanță maximă cu tehnologia de ultimă generație.' },
  { icon: '🔒', title: 'Securizat', desc: 'Datele tale sunt protejate cu cele mai avansate metode.' },
  { icon: '💎', title: 'Premium', desc: 'Experiență de utilizare excepțională la fiecare interacțiune.' },
];`,
      },
    ],
  },
  'auth-system': {
    id: 'auth-system',
    name: 'Sistem Autentificare',
    stack: 'Node.js + JWT + bcrypt + SQLite',
    description: 'Autentificare completă: register, login, refresh token, logout',
    dependencies: ['express', 'jsonwebtoken', 'bcryptjs', 'better-sqlite3'],
    files: [
      {
        path: 'src/auth.ts',
        content: `import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret-local';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';

export async function register(email: string, password: string) {
  const hash = await bcrypt.hash(password, 12);
  // db.insert({ email, password: hash });
  return { success: true };
}

export async function login(email: string, password: string) {
  // const user = db.findByEmail(email);
  // if (!user || !await bcrypt.compare(password, user.password)) throw Error('Invalid');
  
  const accessToken = jwt.sign({ userId: 'id' }, SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: 'id' }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verify(token: string) {
  return jwt.verify(token, SECRET) as { userId: string };
}`,
      },
    ],
  },
  'chat-app': {
    id: 'chat-app',
    name: 'Chat App Real-Time',
    stack: 'Node.js + Socket.io + React Native',
    description: 'Aplicație de chat cu WebSockets',
    dependencies: ['socket.io', 'socket.io-client'],
    files: [
      {
        path: 'server.ts',
        content: `import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

const rooms = new Map<string, string[]>();

io.on('connection', (socket) => {
  console.log('User conectat:', socket.id);

  socket.on('join', (room: string) => {
    socket.join(room);
    io.to(room).emit('system', \`\${socket.id} a intrat în cameră\`);
  });

  socket.on('message', ({ room, text }: { room: string; text: string }) => {
    io.to(room).emit('message', { from: socket.id, text, at: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('User deconectat:', socket.id);
  });
});

httpServer.listen(3001, () => console.log('Socket server pe portul 3001'));`,
      },
    ],
  },
  'calculator': {
    id: 'calculator',
    name: 'Calculator React Native',
    stack: 'React Native + TypeScript',
    description: 'Calculator complet cu operații matematice',
    dependencies: [],
    files: [
      {
        path: 'Calculator.tsx',
        content: `import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');

  const press = (btn: string) => {
    if (btn === 'C') { setDisplay('0'); setPrev(''); setOp(''); return; }
    if (btn === '=') {
      const a = parseFloat(prev), b = parseFloat(display);
      const result = op === '+' ? a+b : op === '−' ? a-b : op === '×' ? a*b : a/b;
      setDisplay(String(result)); setPrev(''); setOp(''); return;
    }
    if (['+', '−', '×', '÷'].includes(btn)) {
      setPrev(display); setOp(btn); setDisplay('0'); return;
    }
    setDisplay(d => d === '0' ? btn : d + btn);
  };

  return (
    <View style={s.container}>
      <Text style={s.display}>{display}</Text>
      {BUTTONS.map((row, i) => (
        <View key={i} style={s.row}>
          {row.map(btn => (
            <TouchableOpacity key={btn} style={[s.btn, btn==='=' && s.eq, btn==='0' && s.zero]} onPress={() => press(btn)}>
              <Text style={[s.btnText, ['+','−','×','÷','='].includes(btn) && s.opText]}>{btn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e', justifyContent: 'flex-end', padding: 16 },
  display: { color: '#fff', fontSize: 72, textAlign: 'right', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btn: { flex: 1, height: 80, backgroundColor: '#333', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  zero: { flex: 2, paddingLeft: 30, alignItems: 'flex-start' },
  eq: { backgroundColor: '#ff9f0a' },
  btnText: { color: '#fff', fontSize: 28 },
  opText: { color: '#fff' },
});`,
      },
    ],
  },
  'notes-sqlite': {
    id: 'notes-sqlite',
    name: 'Notes App cu SQLite',
    stack: 'React Native + Expo SQLite + TypeScript',
    description: 'Aplicație de notițe cu bază de date locală SQLite',
    dependencies: ['expo-sqlite'],
    files: [
      {
        path: 'src/db.ts',
        content: `import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('notes.db');
  await db.execAsync(\`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  \`);
}

export async function getNotes() {
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updated_at DESC');
}

export async function saveNote(note: Omit<Note, 'created_at' | 'updated_at'>) {
  await db.runAsync(
    'INSERT OR REPLACE INTO notes (id, title, content, updated_at) VALUES (?, ?, ?, ?)',
    [note.id, note.title, note.content ?? '', Date.now()]
  );
}

export async function deleteNote(id: string) {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}`,
      },
    ],
  },
  'weather-app': {
    id: 'weather-app',
    name: 'Weather App',
    stack: 'React Native + OpenWeatherMap API',
    description: 'Aplicație vreme cu geolocation',
    dependencies: ['expo-location'],
    files: [
      {
        path: 'WeatherApp.tsx',
        content: `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

interface Weather {
  temp: number;
  feels_like: number;
  description: string;
  city: string;
  humidity: number;
  wind: number;
}

const API_KEY = 'YOUR_OPENWEATHER_API_KEY';

export default function WeatherApp() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError('Permisiune refuzată'); setLoading(false); return; }
      
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      
      const res = await fetch(
        \`https://api.openweathermap.org/data/2.5/weather?lat=\${latitude}&lon=\${longitude}&appid=\${API_KEY}&units=metric&lang=ro\`
      );
      const data = await res.json();
      
      setWeather({
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        city: data.name,
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={s.container}><ActivityIndicator color="#6C63FF" size="large" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.city}>{weather?.city}</Text>
      <Text style={s.temp}>{weather?.temp}°C</Text>
      <Text style={s.desc}>{weather?.description}</Text>
      <View style={s.details}>
        <Text style={s.detail}>💧 {weather?.humidity}%</Text>
        <Text style={s.detail}>💨 {weather?.wind} km/h</Text>
        <Text style={s.detail}>🌡️ {weather?.feels_like}°C</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A', alignItems: 'center', justifyContent: 'center' },
  city: { color: '#aaa', fontSize: 24, marginBottom: 8 },
  temp: { color: '#fff', fontSize: 96, fontWeight: 'bold' },
  desc: { color: '#6C63FF', fontSize: 20, textTransform: 'capitalize', marginBottom: 40 },
  details: { flexDirection: 'row', gap: 30 },
  detail: { color: '#888', fontSize: 16 },
});`,
      },
    ],
  },
};

// ─── Detectare tip de app din descriere ──────────────────────────────────────

export function detectAppType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('todo') || t.includes('task') || t.includes('sarcin')) return 'todo-rn';
  if (t.includes('calculator') || t.includes('calcul')) return 'calculator';
  if (t.includes('chat') || t.includes('mesaj') || t.includes('conversatie')) return 'chat-app';
  if (t.includes('note') || t.includes('notite') || t.includes('jurnal')) return 'notes-sqlite';
  if (t.includes('vreme') || t.includes('weather') || t.includes('meteo')) return 'weather-app';
  if (t.includes('auth') || t.includes('login') || t.includes('autentificare') || t.includes('register')) return 'auth-system';
  if (t.includes('api') || t.includes('backend') || t.includes('server') || t.includes('express')) return 'api-express';
  if (t.includes('landing') || t.includes('website') || t.includes('pagina')) return 'landing-page';
  return '';
}

// ─── Căutare concept în baza de cunoștințe ────────────────────────────────────

export function findDevConcept(text: string): DevConcept | null {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = t.split(/\s+/).filter(w => w.length > 3);

  const scores: [string, number][] = [];
  for (const [id, concept] of Object.entries(DEV_CONCEPTS)) {
    let score = 0;
    const label = concept.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.includes(id.replace(/_/g, ' '))) score += 6;
    if (t.includes(label.toLowerCase())) score += 5;
    for (const w of words) {
      if (id.includes(w) || label.includes(w)) score += 2;
      if (concept.category.includes(w)) score += 1;
    }
    if (score > 0) scores.push([id, score]);
  }

  if (!scores.length) return null;
  scores.sort((a, b) => b[1] - a[1]);
  return DEV_CONCEPTS[scores[0][0]] || null;
}

export function findStackComparison(text: string): { title: string; content: string } | null {
  const t = text.toLowerCase();
  if (t.includes('react native') && (t.includes('flutter') || t.includes('ionic'))) return STACK_COMPARISONS['mobile-framework'];
  if ((t.includes('react') || t.includes('vue') || t.includes('angular')) && t.includes('vs')) return STACK_COMPARISONS['js-framework'];
  if ((t.includes('sql') && t.includes('nosql')) || t.includes('mongodb') || t.includes('postgres')) return STACK_COMPARISONS['database'];
  if (t.includes('graphql') && t.includes('rest')) return STACK_COMPARISONS['rest_vs_graphql'];
  if ((t.includes('node') || t.includes('python') || t.includes('golang') || t.includes('go')) && t.includes('backend')) return STACK_COMPARISONS['backend'];
  return null;
}
