"use client";

import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock3,
  GripVertical,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ColumnId = "intake" | "planned" | "doing" | "review" | "done";

type Unit = {
  id: string;
  name: string;
  color: string;
  icon: string;
  archived: boolean;
};

type Project = {
  id: string;
  unitId: string;
  name: string;
  signal: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type Task = {
  id: string;
  unitId: string;
  projectId: string;
  title: string;
  owner: string;
  ownerType: "Pessoa" | "Agente";
  column: ColumnId;
  priority: "Alta" | "Media" | "Baixa";
  due: string;
  notes: string;
  description: string;
  labels: string[];
  checklist: ChecklistItem[];
  attachments: string[];
  activity: string[];
  lastUpdate: string;
};

type Member = {
  name: string;
  type: "Pessoa" | "Agente";
  units: string[];
  status: "Online" | "Focado" | "Aguardando";
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title?: string;
          description: string;
          inputSchema: object;
          annotations?: {
            readOnlyHint?: boolean;
            untrustedContentHint?: boolean;
          };
          execute: (input: unknown) => unknown | Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const columns: { id: ColumnId; label: string; hint: string }[] = [
  { id: "intake", label: "Entrada", hint: "Pedidos novos" },
  { id: "planned", label: "Priorizado", hint: "Pronto para puxar" },
  { id: "doing", label: "Em execucao", hint: "Trabalho ativo" },
  { id: "review", label: "Revisao", hint: "Validacao final" },
  { id: "done", label: "Concluido", hint: "Entregue" },
];

const initialUnits: Unit[] = [
  { id: "guofuhee", name: "Guofuhee", color: "#2f80ed", icon: "GF", archived: false },
  { id: "riscoquimico", name: "RiscoQuimico", color: "#d64545", icon: "RQ", archived: false },
  { id: "scaletec", name: "SCALETEC", color: "#0f9f7a", icon: "ST", archived: false },
];

const initialProjects: Project[] = [
  { id: "growth-lab", unitId: "guofuhee", name: "Growth Lab", signal: "Receita" },
  { id: "nr01", unitId: "riscoquimico", name: "NR 01 na Pratica", signal: "Compliance" },
  { id: "agent-stack", unitId: "scaletec", name: "Agent Stack", signal: "Automacao" },
  { id: "ops-board", unitId: "scaletec", name: "Ops Board", signal: "Operacao" },
];

const initialTasks: Task[] = [
  {
    id: "task-101",
    unitId: "guofuhee",
    projectId: "growth-lab",
    title: "Mapear ofertas ativas e funil por canal",
    owner: "Ana",
    ownerType: "Pessoa",
    column: "doing",
    priority: "Alta",
    due: "2026-09-20",
    notes: "Consolidar gargalos para decisao da reuniao diaria.",
    description: "Levantar campanhas ativas, metricas por canal e pontos de perda antes do alinhamento comercial.",
    labels: ["Receita", "Diagnostico"],
    checklist: [
      { id: "chk-101-a", text: "Reunir dados de trafego", done: true },
      { id: "chk-101-b", text: "Listar gargalos por etapa", done: false },
      { id: "chk-101-c", text: "Preparar recomendacao", done: false },
    ],
    attachments: ["Funil setembro.xlsx"],
    activity: ["Ana atualizou a prioridade.", "Codex Ops sugeriu consolidar canais pagos e organicos."],
    lastUpdate: "ha 4 min",
  },
  {
    id: "task-102",
    unitId: "riscoquimico",
    projectId: "nr01",
    title: "Revisar roteiro do treinamento NR 01",
    owner: "Codex Conteudo",
    ownerType: "Agente",
    column: "review",
    priority: "Alta",
    due: "2026-09-20",
    notes: "Checar clareza das etapas e pontos de prova social.",
    description: "Revisar narrativa, exemplos praticos, prova de autoridade e transicoes do treinamento.",
    labels: ["Conteudo", "Compliance"],
    checklist: [
      { id: "chk-102-a", text: "Revisar abertura", done: true },
      { id: "chk-102-b", text: "Checar exemplos de campo", done: true },
      { id: "chk-102-c", text: "Validar CTA final", done: false },
    ],
    attachments: ["Roteiro v3.docx"],
    activity: ["Codex Conteudo enviou pontos de revisao.", "Maya pediu exemplos mais diretos."],
    lastUpdate: "ha 11 min",
  },
  {
    id: "task-103",
    unitId: "scaletec",
    projectId: "agent-stack",
    title: "Definir contrato de entrada para tarefas via agente",
    owner: "Codex Ops",
    ownerType: "Agente",
    column: "planned",
    priority: "Media",
    due: "2026-09-21",
    notes: "Campos minimos: unidade, projeto, titulo, dono e origem.",
    description: "Criar o formato padrao para qualquer agente registrar tarefas no Mission Control.",
    labels: ["Agentes", "Integracao"],
    checklist: [
      { id: "chk-103-a", text: "Definir schema minimo", done: true },
      { id: "chk-103-b", text: "Mapear permissoes por unidade", done: false },
      { id: "chk-103-c", text: "Testar criacao por WebMCP", done: false },
    ],
    attachments: [],
    activity: ["Codex Ops criou o primeiro schema.", "Bruno pediu campos de origem e urgencia."],
    lastUpdate: "ha 18 min",
  },
  {
    id: "task-104",
    unitId: "scaletec",
    projectId: "ops-board",
    title: "Criar visao de carga por pessoa e agente",
    owner: "Bruno",
    ownerType: "Pessoa",
    column: "intake",
    priority: "Media",
    due: "2026-09-27",
    notes: "Mostrar limites, bloqueios e tarefas em atraso.",
    description: "Desenhar leitura rapida de capacidade e alertas para evitar gargalos invisiveis.",
    labels: ["Operacao", "Carga"],
    checklist: [
      { id: "chk-104-a", text: "Definir indicadores", done: false },
      { id: "chk-104-b", text: "Separar humanos e agentes", done: false },
    ],
    attachments: [],
    activity: ["Bruno abriu a solicitacao."],
    lastUpdate: "ha 23 min",
  },
  {
    id: "task-105",
    unitId: "riscoquimico",
    projectId: "nr01",
    title: "Publicar checklist operacional do modulo 2",
    owner: "Maya",
    ownerType: "Pessoa",
    column: "done",
    priority: "Baixa",
    due: "2026-09-19",
    notes: "Material liberado para revisao assincrona do time.",
    description: "Checklist final para acompanhamento do modulo 2 e padronizacao de entrega.",
    labels: ["Entrega", "Treinamento"],
    checklist: [
      { id: "chk-105-a", text: "Revisar texto final", done: true },
      { id: "chk-105-b", text: "Publicar no drive", done: true },
      { id: "chk-105-c", text: "Avisar equipe", done: true },
    ],
    attachments: ["Checklist modulo 2.pdf"],
    activity: ["Maya concluiu a publicacao.", "Codex Conteudo marcou como entregue."],
    lastUpdate: "ha 1 h",
  },
];

const initialMembers: Member[] = [
  { name: "Ana", type: "Pessoa", units: ["guofuhee", "scaletec"], status: "Online" },
  { name: "Bruno", type: "Pessoa", units: ["scaletec"], status: "Focado" },
  { name: "Maya", type: "Pessoa", units: ["riscoquimico"], status: "Aguardando" },
  { name: "Codex Ops", type: "Agente", units: ["guofuhee", "riscoquimico", "scaletec"], status: "Online" },
  { name: "Codex Conteudo", type: "Agente", units: ["riscoquimico"], status: "Focado" },
];

const priorityClass = {
  Alta: "border-[#f06f5d] bg-[#fff0ed] text-[#aa3329]",
  Media: "border-[#e5b94d] bg-[#fff8dc] text-[#80600b]",
  Baixa: "border-[#83c5a5] bg-[#ecfff5] text-[#146a46]",
};

const makeId = (prefix = "task") => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export default function Home() {
  const [units, setUnits] = useState(initialUnits);
  const [projects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedUnitId, setSelectedUnitId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [query, setQuery] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUnit, setNewTaskUnit] = useState("scaletec");
  const [newTaskProject, setNewTaskProject] = useState("agent-stack");
  const [newTaskOwner, setNewTaskOwner] = useState("Codex Ops");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const snapshotRef = useRef({ units, projects, tasks });

  useEffect(() => {
    snapshotRef.current = { units, projects, tasks };
  }, [units, projects, tasks]);

  const visibleUnits = units.filter((unit) => !unit.archived);
  const visibleTasks = tasks.filter((task) => {
    const unitMatch = selectedUnitId === "all" || task.unitId === selectedUnitId;
    const projectMatch = selectedProjectId === "all" || task.projectId === selectedProjectId;
    const searchMatch =
      query.trim().length === 0 ||
      `${task.title} ${task.owner} ${task.notes} ${task.description} ${task.labels.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return unitMatch && projectMatch && searchMatch;
  });

  const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const totalDoing = tasks.filter((task) => task.column === "doing").length;
  const agentTasks = tasks.filter((task) => task.ownerType === "Agente").length;
  const blockedSignal = tasks.filter((task) => task.priority === "Alta" && task.column !== "done").length;

  const availableProjects = useMemo(() => {
    if (newTaskUnit === "all") return projects;
    return projects.filter((project) => project.unitId === newTaskUnit);
  }, [newTaskUnit, projects]);

  useEffect(() => {
    if (!availableProjects.some((project) => project.id === newTaskProject)) {
      setNewTaskProject(availableProjects[0]?.id ?? "growth-lab");
    }
  }, [availableProjects, newTaskProject]);

  function updateTask(taskId: string, patch: Partial<Task>) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
              lastUpdate: "agora",
            }
          : task,
      ),
    );
  }

  function moveTask(taskId: string, direction: -1 | 1) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const index = columns.findIndex((column) => column.id === task.column);
    const nextColumn = columns[Math.max(0, Math.min(columns.length - 1, index + direction))].id;
    updateTask(taskId, { column: nextColumn });
  }

  function moveTaskToColumn(taskId: string, column: ColumnId) {
    updateTask(taskId, { column });
  }

  function addTask(title = newTaskTitle, unitId = newTaskUnit, projectId = newTaskProject, owner = newTaskOwner) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return null;
    const ownerRecord = initialMembers.find((member) => member.name === owner);
    const task: Task = {
      id: makeId(),
      title: cleanTitle,
      unitId,
      projectId,
      owner,
      ownerType: ownerRecord?.type ?? "Agente",
      column: "intake",
      priority: "Media",
      due: "",
      notes: "Criado no Orbitarium Control.",
      description: "Abra este card para detalhar contexto, checklist e data de entrega.",
      labels: ["Novo"],
      checklist: [],
      attachments: [],
      activity: [`${owner} recebeu esta tarefa.`],
      lastUpdate: "agora",
    };
    setTasks((current) => [task, ...current]);
    setNewTaskTitle("");
    setSelectedTaskId(task.id);
    return task;
  }

  function addUnit() {
    const cleanName = newUnitName.trim();
    if (!cleanName) return;
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const unit: Unit = {
      id: id || `unit-${units.length + 1}`,
      name: cleanName,
      color: ["#6c5ce7", "#00a8a8", "#ff7b54", "#2f80ed"][units.length % 4],
      icon: cleanName.slice(0, 2).toUpperCase(),
      archived: false,
    };
    setUnits((current) => [...current, unit]);
    setNewUnitName("");
  }

  function renameUnit(unitId: string) {
    const current = units.find((unit) => unit.id === unitId);
    if (!current) return;
    const nextName = window.prompt("Novo nome da unidade", current.name);
    if (!nextName?.trim()) return;
    setUnits((items) =>
      items.map((unit) =>
        unit.id === unitId
          ? { ...unit, name: nextName.trim(), icon: nextName.trim().slice(0, 2).toUpperCase() }
          : unit,
      ),
    );
  }

  function toggleChecklist(taskId: string, itemId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      checklist: task.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
      activity: [`Checklist atualizado.`, ...task.activity],
    });
  }

  function addChecklistItem(taskId: string) {
    const cleanText = newChecklistText.trim();
    const task = tasks.find((item) => item.id === taskId);
    if (!cleanText || !task) return;
    updateTask(taskId, {
      checklist: [...task.checklist, { id: makeId("chk"), text: cleanText, done: false }],
      activity: [`Novo item de checklist: ${cleanText}`, ...task.activity],
    });
    setNewChecklistText("");
  }

  function checklistProgress(task: Task) {
    if (task.checklist.length === 0) return 0;
    return Math.round((task.checklist.filter((item) => item.done).length / task.checklist.length) * 100);
  }

  function handleDrop(column: ColumnId) {
    if (!draggedTaskId) return;
    moveTaskToColumn(draggedTaskId, column);
    setDraggedTaskId(null);
  }

  useEffect(() => {
    const context = typeof document === "undefined" ? undefined : document.modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const register = context.registerTool.bind(context);

    void Promise.resolve(
      register(
        {
          name: "orbitarium_read_board",
          title: "Ler Orbitarium",
          description: "Retorna unidades, projetos e tarefas visiveis no Mission Control.",
          inputSchema: {
            type: "object",
            properties: {
              unitId: { type: "string", description: "Opcional. Use all para todas as unidades." },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input) {
            const unitId =
              typeof input === "object" && input && "unitId" in input
                ? String((input as { unitId?: unknown }).unitId ?? "all")
                : "all";
            const state = snapshotRef.current;
            const boardTasks =
              unitId === "all" ? state.tasks : state.tasks.filter((task) => task.unitId === unitId);
            return { units: state.units, projects: state.projects, tasks: boardTasks };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      register(
        {
          name: "orbitarium_create_task",
          title: "Criar tarefa",
          description: "Cria uma tarefa na Entrada do Kanban usando unidade, projeto, titulo e responsavel.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              unitId: { type: "string" },
              projectId: { type: "string" },
              owner: { type: "string" },
            },
            required: ["title", "unitId", "projectId", "owner"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const payload = input as Partial<Record<"title" | "unitId" | "projectId" | "owner", unknown>>;
            if (
              typeof payload.title !== "string" ||
              typeof payload.unitId !== "string" ||
              typeof payload.projectId !== "string" ||
              typeof payload.owner !== "string"
            ) {
              throw new Error("Entrada invalida para criar tarefa.");
            }
            const task = addTask(payload.title, payload.unitId, payload.projectId, payload.owner);
            if (!task) throw new Error("Titulo vazio.");
            return { created: task };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      register(
        {
          name: "orbitarium_move_task",
          title: "Mover tarefa",
          description: "Move uma tarefa existente para uma coluna especifica do Kanban.",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string" },
              column: { enum: columns.map((column) => column.id) },
            },
            required: ["taskId", "column"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const payload = input as { taskId?: unknown; column?: unknown };
            if (typeof payload.taskId !== "string" || !columns.some((column) => column.id === payload.column)) {
              throw new Error("Movimento invalido.");
            }
            moveTaskToColumn(payload.taskId, payload.column as ColumnId);
            return { taskId: payload.taskId, column: payload.column };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      register(
        {
          name: "orbitarium_update_task",
          title: "Atualizar card",
          description: "Atualiza campos do card, como descricao, data, prioridade, dono e notas.",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              due: { type: "string" },
              owner: { type: "string" },
              priority: { enum: ["Alta", "Media", "Baixa"] },
              notes: { type: "string" },
            },
            required: ["taskId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const payload = input as Partial<Task> & { taskId?: unknown };
            if (typeof payload.taskId !== "string") throw new Error("Card invalido.");
            const patch: Partial<Task> = {};
            if (typeof payload.title === "string") patch.title = payload.title;
            if (typeof payload.description === "string") patch.description = payload.description;
            if (typeof payload.due === "string") patch.due = payload.due;
            if (typeof payload.owner === "string") patch.owner = payload.owner;
            if (payload.priority === "Alta" || payload.priority === "Media" || payload.priority === "Baixa") {
              patch.priority = payload.priority;
            }
            if (typeof payload.notes === "string") patch.notes = payload.notes;
            updateTask(payload.taskId, patch);
            return { taskId: payload.taskId, updated: patch };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [availableProjects, draggedTaskId, newTaskProject, newTaskTitle, newTaskUnit, newTaskOwner, tasks]);

  return (
    <main className="min-h-screen bg-[#eef2f4] text-[#17212b]">
      <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)_340px] max-xl:grid-cols-[240px_minmax(0,1fr)] max-lg:grid-cols-1">
        <aside className="border-r border-[#d8e0e4] bg-[#f9fbfb] p-5 max-lg:border-b max-lg:border-r-0">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#17212b] text-sm font-black text-white">
              OC
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b6b75]">Mission Control</p>
              <h1 className="text-2xl font-black tracking-tight">Orbitarium</h1>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-[#d8e0e4] bg-white p-3">
            <label className="flex items-center gap-2 text-sm text-[#50606a]">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar tarefa ou responsavel"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#81909a]"
              />
            </label>
          </div>

          <nav aria-label="Unidades de negocio" className="space-y-2">
            <button
              onClick={() => setSelectedUnitId("all")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                selectedUnitId === "all" ? "bg-[#17212b] text-white" : "text-[#394852] hover:bg-[#ecf1f3]"
              }`}
            >
              Todas as unidades
              <span>{tasks.length}</span>
            </button>
            {visibleUnits.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                  selectedUnitId === unit.id ? "bg-white shadow-sm ring-1 ring-[#cad5da]" : "hover:bg-[#ecf1f3]"
                }`}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[11px] font-black text-white"
                  style={{ backgroundColor: unit.color }}
                >
                  {unit.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{unit.name}</span>
                <span className="text-xs text-[#6b7b85]">{tasks.filter((task) => task.unitId === unit.id).length}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-[#d8e0e4] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Admin das unidades</h2>
              <Settings className="h-4 w-4 text-[#60717c]" />
            </div>
            <div className="flex gap-2">
              <input
                value={newUnitName}
                onChange={(event) => setNewUnitName(event.target.value)}
                placeholder="Nova unidade"
                className="min-w-0 flex-1 rounded-md border border-[#ccd7dd] px-3 py-2 text-sm outline-none focus:border-[#2f80ed]"
              />
              <button
                onClick={addUnit}
                aria-label="Criar unidade"
                className="grid h-9 w-9 place-items-center rounded-md bg-[#17212b] text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {visibleUnits.map((unit) => (
                <div key={unit.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: unit.color }} />
                  <span className="min-w-0 flex-1 truncate">{unit.name}</span>
                  <button onClick={() => renameUnit(unit.id)} aria-label={`Renomear ${unit.name}`} className="p-1">
                    <Pencil className="h-3.5 w-3.5 text-[#657781]" />
                  </button>
                  <button
                    onClick={() =>
                      setUnits((items) => items.map((item) => (item.id === unit.id ? { ...item, archived: true } : item)))
                    }
                    aria-label={`Arquivar ${unit.name}`}
                    className="p-1"
                  >
                    <Archive className="h-3.5 w-3.5 text-[#657781]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-5 lg:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#657781]">
                {selectedUnit ? selectedUnit.name : "Ambiente completo"}
              </p>
              <h2 className="text-3xl font-black tracking-tight">Controle vivo do trabalho</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="h-10 rounded-md border border-[#ccd7dd] bg-white px-3 text-sm font-semibold outline-none"
              >
                <option value="all">Todos os projetos</option>
                {projects
                  .filter((project) => selectedUnitId === "all" || project.unitId === selectedUnitId)
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
              <div className="rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm font-semibold">
                Arraste cards entre colunas
              </div>
            </div>
          </header>

          <div className="mb-5 grid grid-cols-4 gap-3 max-md:grid-cols-2">
            <Metric icon={<Activity className="h-4 w-4" />} label="Em execucao" value={totalDoing} />
            <Metric icon={<Bot className="h-4 w-4" />} label="Com agentes" value={agentTasks} />
            <Metric icon={<LockKeyhole className="h-4 w-4" />} label="Permissoes" value="Por unidade" />
            <Metric icon={<Clock3 className="h-4 w-4" />} label="Sinais criticos" value={blockedSignal} />
          </div>

          <div className="mb-5 rounded-lg border border-[#cdd8de] bg-white p-4">
            <div className="grid grid-cols-[1.2fr_180px_180px_180px_auto] gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Criar tarefa para pessoa ou agente"
                className="rounded-md border border-[#ccd7dd] px-3 py-2 text-sm outline-none focus:border-[#2f80ed]"
              />
              <select
                value={newTaskUnit}
                onChange={(event) => setNewTaskUnit(event.target.value)}
                className="rounded-md border border-[#ccd7dd] px-3 py-2 text-sm outline-none"
              >
                {visibleUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <select
                value={newTaskProject}
                onChange={(event) => setNewTaskProject(event.target.value)}
                className="rounded-md border border-[#ccd7dd] px-3 py-2 text-sm outline-none"
              >
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={newTaskOwner}
                onChange={(event) => setNewTaskOwner(event.target.value)}
                className="rounded-md border border-[#ccd7dd] px-3 py-2 text-sm outline-none"
              >
                {initialMembers.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addTask()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#17212b] px-4 py-2 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Criar
              </button>
            </div>
          </div>

          <div className="grid gap-3 overflow-x-auto pb-3 xl:grid-cols-5">
            {columns.map((column) => {
              const columnTasks = visibleTasks.filter((task) => task.column === column.id);
              const isDropTarget = Boolean(draggedTaskId);
              return (
                <section
                  key={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(column.id)}
                  className={`min-w-[268px] rounded-lg border bg-[#f8fafb] transition ${
                    isDropTarget ? "border-[#2f80ed] shadow-[0_0_0_2px_rgba(47,128,237,0.12)]" : "border-[#cad6dc]"
                  }`}
                >
                  <div className="border-b border-[#d8e0e4] p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black">{column.label}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#536670]">
                        {columnTasks.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#657781]">{column.hint}</p>
                  </div>
                  <div className="min-h-[180px] space-y-3 p-3">
                    {columnTasks.map((task) => {
                      const unit = units.find((item) => item.id === task.unitId);
                      const project = projects.find((item) => item.id === task.projectId);
                      const index = columns.findIndex((item) => item.id === task.column);
                      const doneItems = task.checklist.filter((item) => item.done).length;
                      return (
                        <article
                          key={task.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", task.id);
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => setDraggedTaskId(null)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`rounded-lg border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bb7c8] hover:shadow-md ${
                            draggedTaskId === task.id ? "border-[#2f80ed] opacity-60" : "border-[#d7e0e5]"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-[#8a9aa3]" />
                              <span
                                className="rounded-md px-2 py-1 text-[11px] font-black text-white"
                                style={{ backgroundColor: unit?.color ?? "#60717c" }}
                              >
                                {unit?.icon ?? "UN"}
                              </span>
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${priorityClass[task.priority]}`}>
                              {task.priority}
                            </span>
                          </div>
                          <h4 className="text-[15px] font-black leading-snug">{task.title}</h4>
                          <p className="mt-2 line-clamp-2 text-sm leading-snug text-[#546671]">{task.notes}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#5b6b75]">
                            <span className="rounded bg-[#eef3f5] px-2 py-1">{project?.name}</span>
                            {task.due && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#eef3f5] px-2 py-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDue(task.due)}
                              </span>
                            )}
                            {task.checklist.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#eef3f5] px-2 py-1">
                                <CheckSquare className="h-3 w-3" />
                                {doneItems}/{task.checklist.length}
                              </span>
                            )}
                            {task.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#eef3f5] px-2 py-1">
                                <Paperclip className="h-3 w-3" />
                                {task.attachments.length}
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-[#edf1f3] pt-3">
                            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#42515a]">
                              {task.ownerType === "Agente" ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                              <span className="truncate">{task.owner}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                disabled={index === 0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveTask(task.id, -1);
                                }}
                                aria-label={`Mover ${task.title} para a esquerda`}
                                className="grid h-7 w-7 place-items-center rounded-md border border-[#d6e0e5] disabled:opacity-35"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                disabled={index === columns.length - 1}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveTask(task.id, 1);
                                }}
                                aria-label={`Mover ${task.title} para a direita`}
                                className="grid h-7 w-7 place-items-center rounded-md border border-[#d6e0e5] disabled:opacity-35"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-[#7c8d96]">Atualizado {task.lastUpdate}</p>
                        </article>
                      );
                    })}
                    {columnTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#cfdade] p-4 text-sm text-[#73838c]">
                        Solte um card aqui.
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <aside className="border-l border-[#d8e0e4] bg-[#fbfcfd] p-5 max-xl:hidden">
          <PanelTitle icon={<CheckCircle2 className="h-4 w-4" />} title="Equipe e agentes" />
          <div className="mb-6 space-y-2">
            {initialMembers.map((member) => (
              <div key={member.name} className="rounded-lg border border-[#d8e0e4] bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {member.type === "Agente" ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {member.name}
                  </div>
                  <span className="text-xs text-[#657781]">{member.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {member.units.map((unitId) => {
                    const unit = units.find((item) => item.id === unitId);
                    return (
                      <span key={unitId} className="rounded bg-[#eef3f5] px-2 py-1 text-[11px] font-semibold text-[#4f6069]">
                        {unit?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <PanelTitle icon={<Bot className="h-4 w-4" />} title="Canal Codex nativo" />
          <div className="rounded-lg border border-[#d8e0e4] bg-white p-4">
            <p className="text-sm leading-relaxed text-[#4f6069]">
              Agentes podem ler o quadro, criar tarefas, mover cards e atualizar detalhes por ferramentas WebMCP.
            </p>
            <div className="mt-4 space-y-2 font-mono text-xs text-[#24313a]">
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_read_board</code>
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_create_task</code>
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_move_task</code>
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_update_task</code>
            </div>
          </div>
        </aside>
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          units={units}
          projects={projects}
          newChecklistText={newChecklistText}
          setNewChecklistText={setNewChecklistText}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(patch) => updateTask(selectedTask.id, patch)}
          onToggleChecklist={(itemId) => toggleChecklist(selectedTask.id, itemId)}
          onAddChecklist={() => addChecklistItem(selectedTask.id)}
          checklistProgress={checklistProgress(selectedTask)}
        />
      )}
    </main>
  );
}

function TaskDetail({
  task,
  units,
  projects,
  newChecklistText,
  setNewChecklistText,
  onClose,
  onUpdate,
  onToggleChecklist,
  onAddChecklist,
  checklistProgress,
}: {
  task: Task;
  units: Unit[];
  projects: Project[];
  newChecklistText: string;
  setNewChecklistText: (value: string) => void;
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onToggleChecklist: (itemId: string) => void;
  onAddChecklist: () => void;
  checklistProgress: number;
}) {
  const unit = units.find((item) => item.id === task.unitId);
  const project = projects.find((item) => item.id === task.projectId);
  const availableProjects = projects.filter((item) => item.unitId === task.unitId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#17212b]/55 p-4 backdrop-blur-sm">
      <section className="my-6 grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_280px] overflow-hidden rounded-lg bg-[#f8fafb] shadow-2xl max-lg:grid-cols-1">
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-md px-2 py-1 text-[11px] font-black text-white"
                  style={{ backgroundColor: unit?.color ?? "#60717c" }}
                >
                  {unit?.icon ?? "UN"}
                </span>
                <span className="rounded bg-[#e9f1f4] px-2 py-1 text-xs font-bold text-[#52636d]">{project?.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${priorityClass[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <input
                value={task.title}
                onChange={(event) => onUpdate({ title: event.target.value })}
                className="w-full rounded-md border border-transparent bg-transparent px-1 text-2xl font-black leading-tight outline-none focus:border-[#ccd7dd] focus:bg-white"
              />
            </div>
            <button onClick={onClose} aria-label="Fechar card" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5">
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">
                <MessageSquare className="h-4 w-4" />
                Descricao
              </h3>
              <textarea
                value={task.description}
                onChange={(event) => onUpdate({ description: event.target.value })}
                rows={5}
                className="w-full resize-none rounded-lg border border-[#ccd7dd] bg-white p-3 text-sm leading-relaxed outline-none focus:border-[#2f80ed]"
              />
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">
                  <CheckSquare className="h-4 w-4" />
                  Checklist
                </h3>
                <span className="text-sm font-bold text-[#536670]">{checklistProgress}%</span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#dfe8ec]">
                <div className="h-full rounded-full bg-[#0f9f7a]" style={{ width: `${checklistProgress}%` }} />
              </div>
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 rounded-md bg-white p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggleChecklist(item.id)}
                      className="h-4 w-4 accent-[#0f9f7a]"
                    />
                    <span className={item.done ? "text-[#76868f] line-through" : ""}>{item.text}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newChecklistText}
                  onChange={(event) => setNewChecklistText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onAddChecklist();
                  }}
                  placeholder="Adicionar item"
                  className="min-w-0 flex-1 rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f80ed]"
                />
                <button onClick={onAddChecklist} className="rounded-md bg-[#17212b] px-3 py-2 text-sm font-bold text-white">
                  Adicionar
                </button>
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">
                <MessageSquare className="h-4 w-4" />
                Notas do card
              </h3>
              <textarea
                value={task.notes}
                onChange={(event) => onUpdate({ notes: event.target.value })}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#ccd7dd] bg-white p-3 text-sm leading-relaxed outline-none focus:border-[#2f80ed]"
              />
            </section>
          </div>
        </div>

        <aside className="border-l border-[#d8e0e4] bg-white p-5 max-lg:border-l-0 max-lg:border-t">
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">Campos</h3>
          <div className="space-y-4">
            <FieldLabel label="Unidade">
              <select
                value={task.unitId}
                onChange={(event) => {
                  const nextUnit = event.target.value;
                  const nextProject = projects.find((item) => item.unitId === nextUnit)?.id ?? task.projectId;
                  onUpdate({ unitId: nextUnit, projectId: nextProject });
                }}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              >
                {units
                  .filter((unitItem) => !unitItem.archived)
                  .map((unitItem) => (
                    <option key={unitItem.id} value={unitItem.id}>
                      {unitItem.name}
                    </option>
                  ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Projeto">
              <select
                value={task.projectId}
                onChange={(event) => onUpdate({ projectId: event.target.value })}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              >
                {availableProjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Coluna">
              <select
                value={task.column}
                onChange={(event) => onUpdate({ column: event.target.value as ColumnId })}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Responsavel">
              <select
                value={task.owner}
                onChange={(event) => {
                  const member = initialMembers.find((item) => item.name === event.target.value);
                  onUpdate({ owner: event.target.value, ownerType: member?.type ?? task.ownerType });
                }}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              >
                {initialMembers.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Data de entrega">
              <input
                type="date"
                value={task.due}
                onChange={(event) => onUpdate({ due: event.target.value })}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              />
            </FieldLabel>

            <FieldLabel label="Prioridade">
              <select
                value={task.priority}
                onChange={(event) => onUpdate({ priority: event.target.value as Task["priority"] })}
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baixa">Baixa</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Etiquetas">
              <input
                value={task.labels.join(", ")}
                onChange={(event) =>
                  onUpdate({
                    labels: event.target.value
                      .split(",")
                      .map((label) => label.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full rounded-md border border-[#ccd7dd] bg-white px-3 py-2 text-sm outline-none"
              />
            </FieldLabel>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">
              <Paperclip className="h-4 w-4" />
              Anexos
            </h3>
            <div className="space-y-2">
              {task.attachments.length > 0 ? (
                task.attachments.map((attachment) => (
                  <div key={attachment} className="rounded-md bg-[#eef3f5] px-3 py-2 text-sm font-semibold text-[#42515a]">
                    {attachment}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b7b85]">Nenhum anexo ainda.</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">Atividade</h3>
            <div className="space-y-2">
              {task.activity.map((item, index) => (
                <p key={`${item}-${index}`} className="rounded-md bg-[#f5f8f9] p-2 text-sm text-[#536670]">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-[#cad6dc] bg-white p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#e9f1f4] text-[#17212b]">{icon}</div>
      <p className="text-sm text-[#657781]">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#536670]">
      {icon}
      {title}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#667781]">{label}</span>
      {children}
    </label>
  );
}

function formatDue(value: string) {
  if (!value) return "Sem data";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}
