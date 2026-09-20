"use client";

import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Settings,
  Users,
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
    due: "Hoje",
    notes: "Consolidar gargalos para decisao da reuniao diaria.",
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
    due: "20 set",
    notes: "Checar clareza das etapas e pontos de prova social.",
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
    due: "Amanha",
    notes: "Campos minimos: unidade, projeto, titulo, dono e origem.",
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
    due: "Semana",
    notes: "Mostrar limites, bloqueios e tarefas em atraso.",
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
    due: "Ontem",
    notes: "Material liberado para revisao assíncrona do time.",
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

const makeId = () => `task-${Math.random().toString(36).slice(2, 8)}`;

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
      `${task.title} ${task.owner} ${task.notes}`.toLowerCase().includes(query.toLowerCase());
    return unitMatch && projectMatch && searchMatch;
  });

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

  function moveTask(taskId: string, direction: -1 | 1) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const index = columns.findIndex((column) => column.id === task.column);
        const nextColumn = columns[Math.max(0, Math.min(columns.length - 1, index + direction))].id;
        return { ...task, column: nextColumn, lastUpdate: "agora" };
      }),
    );
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
      due: "Novo",
      notes: "Criado no Orbitarium Control.",
      lastUpdate: "agora",
    };
    setTasks((current) => [task, ...current]);
    setNewTaskTitle("");
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
            setTasks((current) =>
              current.map((task) =>
                task.id === payload.taskId
                  ? { ...task, column: payload.column as ColumnId, lastUpdate: "agora" }
                  : task,
              ),
            );
            return { taskId: payload.taskId, column: payload.column };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [availableProjects]);

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
                    onClick={() => setUnits((items) => items.map((item) => (item.id === unit.id ? { ...item, archived: true } : item)))}
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
                Sync ativo
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
              return (
                <section key={column.id} className="min-w-[260px] rounded-lg border border-[#cad6dc] bg-[#f8fafb]">
                  <div className="border-b border-[#d8e0e4] p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black">{column.label}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#536670]">
                        {columnTasks.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#657781]">{column.hint}</p>
                  </div>
                  <div className="space-y-3 p-3">
                    {columnTasks.map((task) => {
                      const unit = units.find((item) => item.id === task.unitId);
                      const project = projects.find((item) => item.id === task.projectId);
                      const index = columns.findIndex((item) => item.id === task.column);
                      return (
                        <article key={task.id} className="rounded-lg border border-[#d7e0e5] bg-white p-3 shadow-sm">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span
                              className="rounded-md px-2 py-1 text-[11px] font-black text-white"
                              style={{ backgroundColor: unit?.color ?? "#60717c" }}
                            >
                              {unit?.icon ?? "UN"}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${priorityClass[task.priority]}`}>
                              {task.priority}
                            </span>
                          </div>
                          <h4 className="text-[15px] font-black leading-snug">{task.title}</h4>
                          <p className="mt-2 text-sm leading-snug text-[#546671]">{task.notes}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#5b6b75]">
                            <span className="rounded bg-[#eef3f5] px-2 py-1">{project?.name}</span>
                            <span className="rounded bg-[#eef3f5] px-2 py-1">{task.due}</span>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-[#edf1f3] pt-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#42515a]">
                              {task.ownerType === "Agente" ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                              {task.owner}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                disabled={index === 0}
                                onClick={() => moveTask(task.id, -1)}
                                aria-label={`Mover ${task.title} para a esquerda`}
                                className="grid h-7 w-7 place-items-center rounded-md border border-[#d6e0e5] disabled:opacity-35"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                disabled={index === columns.length - 1}
                                onClick={() => moveTask(task.id, 1)}
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
                        Sem tarefas nesta coluna.
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
              Agentes podem ler o quadro, criar tarefas e mover cards pelas ferramentas WebMCP registradas nesta pagina.
            </p>
            <div className="mt-4 space-y-2 font-mono text-xs text-[#24313a]">
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_read_board</code>
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_create_task</code>
              <code className="block rounded bg-[#eef3f5] p-2">orbitarium_move_task</code>
            </div>
          </div>
        </aside>
      </div>
    </main>
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
