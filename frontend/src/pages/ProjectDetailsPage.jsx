/**
 * Page détail d'un projet avec onglets :
 * Vue d'ensemble, Tâches, Commentaires, Activité
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, MessageSquare, Activity, Calendar, FileText } from "lucide-react";
import api from "../api/axios.js";
import { logout } from "../api/auth.js";
import Card from "../components/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import CommentList from "../components/CommentList.jsx";
import MilestoneList from "../components/MilestoneList.jsx";
import SprintList from "../components/SprintList.jsx";
import TimelineView from "../components/TimelineView.jsx";
import DeliverableList from "../components/DeliverableList.jsx";
import SectionHero from "../components/ui/SectionHero.jsx";
import { lucaBravo } from "../assets/images/index.js";

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: ClipboardList },
  { id: "planning", label: "Planning", icon: Calendar },
  { id: "deliverables", label: "Livrables", icon: FileText },
  { id: "tasks", label: "Tâches", icon: ClipboardList },
  { id: "comments", label: "Commentaires", icon: MessageSquare },
  { id: "activity", label: "Activité", icon: Activity },
];

const PROJECT_STATUS_LABELS = {
  active: "Actif",
  completed: "Terminé",
  archived: "Archivé",
};

const TASK_STATUS_LABELS = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEditProject, setShowEditProject] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [supervisionRequests, setSupervisionRequests] = useState([]);

  function showSuccess(msg) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  async function fetchProject() {
    try {
      const { data } = await api.get(`/api/projects/${id}/`);
      setProject(data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else if (err.response?.status === 404) {
        setError("Projet introuvable.");
      } else {
        setError("Erreur lors du chargement.");
      }
      setProject(null);
    }
  }

  async function fetchTasks() {
    try {
      const { data } = await api.get("/api/tasks/");
      setTasks(data.filter((t) => t.project === parseInt(id)));
    } catch {
      setTasks([]);
    }
  }

  async function fetchMilestones() {
    try {
      const { data } = await api.get(`/api/projects/${id}/milestones/`);
      setMilestones(data);
    } catch {
      setMilestones([]);
    }
  }

  async function fetchSprints() {
    try {
      const { data } = await api.get(`/api/projects/${id}/sprints/`);
      setSprints(data);
    } catch {
      setSprints([]);
    }
  }

  async function fetchDeliverables() {
    try {
      const { data } = await api.get(`/api/projects/${id}/deliverables/`);
      setDeliverables(data);
    } catch {
      setDeliverables([]);
    }
  }

  async function fetchCurrentUser() {
    try {
      const { data } = await api.get("/api/me/");
      setCurrentUser(data);
    } catch {
      setCurrentUser(null);
    }
  }

  async function fetchComments() {
    try {
      const { data } = await api.get(`/api/projects/${id}/comments/`);
      setComments(data);
    } catch {
      setComments([]);
    }
  }

  async function fetchActivity() {
    try {
      const { data } = await api.get(`/api/projects/${id}/activity/`);
      setActivity(data);
    } catch {
      setActivity([]);
    }
  }

  async function fetchSupervisionRequests() {
    try {
      const { data } = await api.get(`/api/projects/${id}/supervision-requests/`);
      setSupervisionRequests(Array.isArray(data) ? data : []);
    } catch {
      setSupervisionRequests([]);
    }
  }

  async function fetchAll() {
    setLoading(true);
    setError("");
    await Promise.all([
      fetchProject(),
      fetchTasks(),
      fetchMilestones(),
      fetchSprints(),
      fetchDeliverables(),
      fetchCurrentUser(),
      fetchComments(),
      fetchActivity(),
      fetchSupervisionRequests(),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  async function handleAddComment(content) {
    await api.post(`/api/projects/${id}/comments/`, { content });
    showSuccess("Commentaire ajouté.");
  }

  async function handleAddMilestone(data) {
    await api.post(`/api/projects/${id}/milestones/`, data);
  }

  async function handleUpdateMilestone(milestoneId, data) {
    await api.patch(`/api/projects/${id}/milestones/${milestoneId}/`, data);
  }

  async function handleDeleteMilestone(milestoneId) {
    await api.delete(`/api/projects/${id}/milestones/${milestoneId}/`);
    await fetchMilestones();
    fetchActivity();
    showSuccess("Jalon supprimé.");
  }

  async function handleAddSprint(data) {
    await api.post(`/api/projects/${id}/sprints/`, data);
  }

  async function handleUpdateSprint(sprintId, data) {
    await api.patch(`/api/projects/${id}/sprints/${sprintId}/`, data);
  }

  async function handleDeleteSprint(sprintId) {
    await api.delete(`/api/projects/${id}/sprints/${sprintId}/`);
    await fetchSprints();
    fetchActivity();
    showSuccess("Sprint supprimé.");
  }

  async function handleAddDeliverable(data) {
    await api.post(`/api/projects/${id}/deliverables/`, data);
    await fetchDeliverables();
  }

  async function handleUpdateDeliverable(deliverableId, data) {
    await api.patch(`/api/projects/${id}/deliverables/${deliverableId}/`, data);
    await fetchDeliverables();
    fetchActivity();
    showSuccess("Livrable mis à jour.");
  }

  async function handleDeleteDeliverable(deliverableId) {
    await api.delete(`/api/projects/${id}/deliverables/${deliverableId}/`);
    await fetchDeliverables();
    fetchActivity();
    showSuccess("Livrable supprimé.");
  }

  async function fetchStaffUsers() {
    try {
      const { data } = await api.get("/api/users/staff/");
      setStaffUsers(data);
    } catch {
      setStaffUsers([]);
    }
  }

  async function handleUpdateProject(payload) {
    await api.patch(`/api/projects/${id}/`, payload);
    await fetchProject();
    setShowEditProject(false);
    showSuccess("Projet mis à jour.");
  }

  async function handleDeleteProject() {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les tâches, commentaires et livrables seront supprimés. Cette action est irréversible."
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/projects/${id}/`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object" ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        "Impossible de supprimer le projet.";
      showSuccess(null);
      setError(msg);
    }
  }

  async function handleRequestSupervision(data) {
    await api.post(`/api/projects/${id}/supervision-requests/`, data);
    await fetchSupervisionRequests();
    await fetchProject();
    showSuccess("Demande de supervision envoyée.");
  }

  async function handleAddTask(data) {
    await api.post("/api/tasks/", { ...data, project: parseInt(id, 10) });
    await fetchTasks();
    await fetchProject();
    showSuccess("Tâche ajoutée.");
  }

  async function handleUpdateTaskStatus(taskId, status) {
    await api.patch(`/api/tasks/${taskId}/`, { status });
    await fetchTasks();
    await fetchProject();
    showSuccess("Statut mis à jour.");
  }

  async function handleUpdateTask(taskId, data) {
    await api.patch(`/api/tasks/${taskId}/`, data);
    await fetchTasks();
    await fetchProject();
  }

  async function handleDeleteTask(taskId) {
    await api.delete(`/api/tasks/${taskId}/`);
    await fetchTasks();
    fetchProject();
    showSuccess("Tâche supprimée.");
  }

  // owner/supervisor peuvent être l'id (nombre) ou un objet { id } selon l'API
  const ownerId = project?.owner != null && typeof project.owner === "object" ? project.owner.id : project?.owner;
  const supervisorId = project?.supervisor != null && typeof project.supervisor === "object" ? project.supervisor.id : project?.supervisor;
  const isOwner = project && currentUser && Number(ownerId) === Number(currentUser.id);
  const isSupervisor = project && currentUser && Number(supervisorId) === Number(currentUser.id);

  if (loading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Chargement...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen max-w-5xl mx-auto px-6 py-12">
        <Link to="/dashboard" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
          ← Retour au dashboard
        </Link>
        <div className="mt-6 rounded-2xl bg-rose-50/80 px-6 py-4 text-rose-700 ring-1 ring-rose-200">
          {error || "Projet introuvable."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="relative border-b border-zinc-200/80 overflow-hidden min-h-[120px]">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: lucaBravo ? `url(${lucaBravo})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
            filter: "grayscale(100%) blur(4px)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur" aria-hidden />
        <div className="relative z-20 max-w-5xl mx-auto px-6 py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                {project.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={project.status === "active" ? "submitted" : project.status === "completed" ? "approved" : "default"}>
                  {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </Badge>
                {isSupervisor && (
                  <Badge variant="approved">Vous supervisez</Badge>
                )}
                {project.supervisor && !isSupervisor && (
                  <span className="text-sm text-zinc-500">Superviseur assigné</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-zinc-500">Progression</p>
                <p className="text-xl font-bold text-brand-600">{project.progress_percent ?? 0}%</p>
              </div>
              {(project.start_date || project.end_date) && (
                <div className="text-right text-sm text-zinc-500">
                  {project.start_date || "—"} → {project.end_date || "—"}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className="rounded-xl bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            ✓ {successMessage}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Onglets stylisés */}
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-100/80 ring-1 ring-zinc-200/80 w-fit mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-brand-600 shadow-sm ring-1 ring-zinc-200/80"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {showEditProject && isOwner ? (
              <EditProjectForm
                project={project}
                onSave={handleUpdateProject}
                onCancel={() => setShowEditProject(false)}
              />
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <SectionTitle>Description</SectionTitle>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditProject(true);
                          fetchStaffUsers();
                        }}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        Modifier le projet
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 whitespace-pre-wrap">
                    {project.description || "Aucune description"}
                  </p>
                </Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Progression</p>
                    <p className="mt-1 text-2xl font-bold text-brand-600">
                      {project.progress_percent ?? 0}%
                    </p>
                  </Card>
                  {(project.start_date || project.end_date) && (
                    <Card className="p-6">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Période</p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {project.start_date || "—"} → {project.end_date || "—"}
                      </p>
                    </Card>
                  )}
                </div>
                {isOwner && (
                  <SupervisionRequestSection
                    project={project}
                    requests={supervisionRequests}
                    staffUsers={staffUsers}
                    onRequest={handleRequestSupervision}
                    onLoadStaff={fetchStaffUsers}
                  />
                )}
                {isOwner && (
                  <Card className="p-6 border-rose-200/80 bg-rose-50/50">
                    <p className="text-xs font-medium text-zinc-600 mb-2">Zone dangereuse</p>
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      Supprimer le projet
                    </button>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "planning" && (
          <div className="space-y-8">
            <div>
              <SectionTitle className="mb-4">Timeline</SectionTitle>
              <TimelineView milestones={milestones} sprints={sprints} />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <MilestoneList
                  projectId={id}
                  items={milestones}
                  loading={false}
                  onAdd={(d) => handleAddMilestone(d).then(() => showSuccess("Jalon ajouté."))}
                  onUpdate={handleUpdateMilestone}
                  onDelete={handleDeleteMilestone}
                  onRefresh={() => {
                    fetchMilestones();
                    fetchActivity();
                  }}
                />
              </div>
              <div>
                <SprintList
                  projectId={id}
                  items={sprints}
                  loading={false}
                  onAdd={(d) => handleAddSprint(d).then(() => showSuccess("Sprint ajouté."))}
                  onUpdate={handleUpdateSprint}
                  onDelete={handleDeleteSprint}
                  onRefresh={() => {
                    fetchSprints();
                    fetchActivity();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "deliverables" && (
          <DeliverableList
            projectId={id}
            items={deliverables}
            loading={false}
            onAdd={(d) => handleAddDeliverable(d).then(() => showSuccess("Livrable ajouté."))}
            onUpdate={handleUpdateDeliverable}
            onDelete={handleDeleteDeliverable}
            onRefresh={() => {
              fetchDeliverables();
              fetchActivity();
            }}
            isSupervisor={!!isSupervisor}
            onReviewSuccess={() => showSuccess("Revue envoyée.")}
          />
        )}

        {activeTab === "tasks" && (
          <TaskListSection
            projectId={id}
            tasks={tasks}
            sprints={sprints}
            onAdd={handleAddTask}
            onUpdateStatus={handleUpdateTaskStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === "comments" && (
          <CommentList
            projectId={id}
            items={comments}
            loading={false}
            onAdd={handleAddComment}
            onRefresh={fetchComments}
            ownerId={ownerId}
            supervisorId={supervisorId}
          />
        )}

        {activeTab === "activity" && (
          <ActivityFeed
            items={activity}
            loading={false}
            ownerId={ownerId}
            supervisorId={supervisorId}
          />
        )}
      </main>
    </div>
  );
}

const SUPERVISION_REQUEST_STATUS_LABELS = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
};

function SupervisionRequestSection({
  project,
  requests,
  staffUsers,
  onRequest,
  onLoadStaff,
}) {
  const [supervisorId, setSupervisorId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onLoadStaff?.();
  }, [onLoadStaff]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supervisorId) return;
    setSubmitting(true);
    setError("");
    try {
      await onRequest({
        requested_supervisor: parseInt(supervisorId, 10),
        message: message.trim() || "",
      });
      setSupervisorId("");
      setMessage("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (typeof err.response?.data === "object"
            ? Object.values(err.response?.data || {}).flat().join(" ")
            : err.response?.data) ||
          "Erreur lors de l'envoi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasSupervisor = !!project.supervisor;
  const pendingToSame = requests.some(
    (r) => r.status === "pending" && r.requested_supervisor === parseInt(supervisorId, 10)
  );

  return (
    <Card className="p-6">
      <SectionTitle className="mb-4">Supervision</SectionTitle>
      {hasSupervisor ? (
        <p className="text-sm text-zinc-600">
          Un superviseur est déjà assigné à ce projet.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-600 mb-4">
            Envoyez une demande de supervision à un enseignant. Il pourra accepter ou refuser.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Envoyer la demande à
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              >
                <option value="">Choisir un enseignant</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Message (optionnel)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex. : sujet du projet, délai souhaité..."
                rows={2}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm resize-none focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !supervisorId || pendingToSame}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Envoi..." : "Envoyer la demande"}
            </button>
          </form>
        </>
      )}
      {requests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200/80">
          <p className="text-xs font-medium text-zinc-600 mb-2">Demandes envoyées</p>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-zinc-700">{r.requested_supervisor_email}</span>
                <Badge
                  variant={
                    r.status === "accepted" ? "approved" : r.status === "declined" ? "rejected" : "pending"
                  }
                >
                  {SUPERVISION_REQUEST_STATUS_LABELS[r.status] ?? r.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function EditProjectForm({ project, onSave, onCancel }) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [endDate, setEndDate] = useState(project.end_date ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        start_date: startDate || null,
        end_date: endDate || null,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (typeof err.response?.data === "object"
            ? Object.values(err.response?.data || {}).flat().join(" ")
            : err.response?.data) ||
          "Erreur lors de la mise à jour."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="font-medium text-graphite-800 mb-4">Modifier le projet</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-graphite-700 mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-graphite-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-graphite-700 mb-1">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
          >
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-1">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-1">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-sage-500 px-4 py-2 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-600 hover:bg-sand-100"
          >
            Annuler
          </button>
        </div>
      </form>
    </Card>
  );
}

function taskApiErrorMessage(err) {
  const data = err.response?.data;
  if (data?.due_date) {
    const msg = Array.isArray(data.due_date) ? data.due_date[0] : data.due_date;
    if (msg) return msg;
  }
  if (data?.detail) return data.detail;
  if (typeof data === "object" && data !== null) {
    const flat = Object.values(data).flat();
    if (flat.length) return flat.join(" ");
  }
  return data || err.message || "Erreur.";
}

function TaskListSection({
  projectId,
  tasks,
  sprints = [],
  onAdd,
  onUpdateStatus,
  onUpdateTask,
  onDeleteTask,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSprintId, setEditSprintId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    const sprint = sprintId ? sprints.find((s) => String(s.id) === sprintId) : null;
    if (sprint && dueDate && dueDate > sprint.end_date) {
      setError(
        `La date d'échéance (${dueDate}) ne peut pas être après la date de fin du sprint « ${sprint.title} » (${sprint.end_date}).`
      );
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        status: "todo",
        due_date: dueDate || null,
        sprint: sprintId ? parseInt(sprintId, 10) : null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setSprintId("");
    } catch (err) {
      setError(taskApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSprintChange(taskId, sprintValue) {
    setUpdateError("");
    try {
      await onUpdateTask(taskId, {
        sprint: sprintValue ? parseInt(sprintValue, 10) : null,
      });
    } catch (err) {
      setUpdateError(taskApiErrorMessage(err));
    }
  }

  function startEditTask(t) {
    setEditingTaskId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description || "");
    setEditDueDate(t.due_date || "");
    setEditSprintId(t.sprint != null ? String(t.sprint) : "");
    setEditError("");
  }

  function cancelEditTask() {
    setEditingTaskId(null);
  }

  async function saveEditTask() {
    if (!editingTaskId || !editTitle.trim()) return;
    setEditError("");
    const sprint = editSprintId ? sprints.find((s) => String(s.id) === editSprintId) : null;
    if (sprint && editDueDate && editDueDate > sprint.end_date) {
      setEditError(
        `La date d'échéance ne peut pas être après la fin du sprint « ${sprint.title} » (${sprint.end_date}).`
      );
      return;
    }
    setSavingEdit(true);
    try {
      await onUpdateTask(editingTaskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        due_date: editDueDate || null,
        sprint: editSprintId ? parseInt(editSprintId, 10) : null,
      });
      setEditingTaskId(null);
    } catch (err) {
      setEditError(taskApiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTaskClick(t) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.")) return;
    try {
      await onDeleteTask?.(t.id);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="space-y-3">
        <h4 className="font-medium text-graphite-800 text-sm">Nouvelle tâche</h4>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche"
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full rounded-lg border border-sand-300 px-4 py-2 text-sm resize-none"
        />
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm"
          />
          {sprints.length > 0 && (
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-graphite-800"
            >
              <option value="">Aucun sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-sage-500 px-4 py-2 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {submitting ? "Ajout..." : "Ajouter"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            {error}
          </p>
        )}
      </form>

      {updateError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {updateError}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-medium text-graphite-800 text-sm">Tâches</h4>
        {tasks.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-graphite-600 text-sm">Aucune tâche</p>
            <p className="text-graphite-500 text-xs mt-1">Ajoutez une tâche ci-dessus</p>
          </Card>
        ) : (
          tasks.map((t) => (
            <Card key={t.id} className="p-4">
              {editingTaskId === t.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre"
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    rows={2}
                    className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="rounded-lg border border-sand-300 px-3 py-2 text-sm"
                    />
                    {sprints.length > 0 && (
                      <select
                        value={editSprintId}
                        onChange={(e) => setEditSprintId(e.target.value)}
                        className="rounded-lg border border-sand-300 px-3 py-2 text-sm text-graphite-800"
                      >
                        <option value="">Aucun sprint</option>
                        {sprints.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={saveEditTask}
                      disabled={savingEdit || !editTitle.trim()}
                      className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditTask}
                      className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm text-graphite-700 hover:bg-sand-100"
                    >
                      Annuler
                    </button>
                  </div>
                  {editError && (
                    <p className="text-sm text-red-600 rounded bg-red-50 border border-red-200 px-3 py-2">
                      {editError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-graphite-800">{t.title}</p>
                    <p className="text-xs text-graphite-500 mt-0.5">
                      {TASK_STATUS_LABELS[t.status] ?? t.status}
                      {t.due_date && ` · ${t.due_date}`}
                      {t.sprint_title && ` · ${t.sprint_title}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {sprints.length > 0 && onUpdateTask && (
                      <select
                        value={t.sprint != null ? String(t.sprint) : ""}
                        onChange={(e) => handleSprintChange(t.id, e.target.value)}
                        className="text-xs rounded border border-sand-300 px-2 py-1 text-graphite-700"
                      >
                        <option value="">Aucun sprint</option>
                        {sprints.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <select
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t.id, e.target.value)}
                      className="text-xs rounded border border-sand-300 px-2 py-1 text-graphite-700"
                    >
                      <option value="todo">{TASK_STATUS_LABELS.todo}</option>
                      <option value="in_progress">{TASK_STATUS_LABELS.in_progress}</option>
                      <option value="blocked">{TASK_STATUS_LABELS.blocked}</option>
                      <option value="done">{TASK_STATUS_LABELS.done}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => startEditTask(t)}
                      className="text-xs text-sage-600 hover:text-sage-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTaskClick(t)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
