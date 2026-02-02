/**
 * Page « Demandes de supervision » (superviseur).
 * Liste des demandes reçues (pending) avec Accepter / Refuser.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { logout } from "../api/auth.js";
import Card from "../components/Card.jsx";

const STATUS_LABELS = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
};

export default function SupervisionRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);
  const [declineMessage, setDeclineMessage] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(null);

  const navigate = useNavigate();

  async function fetchRequests() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/supervision-requests/");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setError("Impossible de charger les demandes.");
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const receivedPending = requests.filter(
    (r) => r.direction === "received" && r.status === "pending"
  );
  const receivedOther = requests.filter(
    (r) => r.direction === "received" && r.status !== "pending"
  );

  async function handleAccept(requestId) {
    setRespondingId(requestId);
    try {
      await api.patch(`/api/supervision-requests/${requestId}/`, {
        status: "accepted",
      });
      await fetchRequests();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response?.data || {}).flat().join(" ")
          : err.response?.data) ||
        "Erreur";
      setError(msg);
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDecline(requestId, responseMessage = "") {
    setRespondingId(requestId);
    try {
      await api.patch(`/api/supervision-requests/${requestId}/`, {
        status: "declined",
        response_message: responseMessage,
      });
      setShowDeclineModal(null);
      setDeclineMessage("");
      await fetchRequests();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response?.data || {}).flat().join(" ")
          : err.response?.data) ||
        "Erreur";
      setError(msg);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-sand-300/60 bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-sm text-graphite-600 hover:text-graphite-800"
          >
            ← Retour au dashboard
          </Link>
          <h1 className="text-xl font-semibold text-graphite-800">
            Demandes de supervision
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-graphite-600 text-sm mt-1">
          Demandes envoyées par les étudiants. Acceptez pour suivre le projet.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-graphite-600 text-sm">Chargement...</div>
        ) : (
          <div className="mt-6 space-y-8">
            {receivedPending.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-graphite-800 mb-3">
                  En attente ({receivedPending.length})
                </h2>
                <div className="space-y-3">
                  {receivedPending.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-graphite-800">
                            {r.project_title}
                          </p>
                          <p className="text-sm text-graphite-600 mt-0.5">
                            Étudiant : {r.owner_email}
                          </p>
                          {r.message && (
                            <p className="text-sm text-graphite-600 mt-2 italic">
                              « {r.message} »
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAccept(r.id)}
                            disabled={respondingId !== null}
                            className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
                          >
                            {respondingId === r.id ? "..." : "Accepter"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeclineModal(r.id)}
                            disabled={respondingId !== null}
                            className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm text-graphite-600 hover:bg-sand-100 disabled:opacity-60"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {receivedOther.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-graphite-800 mb-3">
                  Traitées
                </h2>
                <div className="space-y-3">
                  {receivedOther.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-graphite-800">
                            {r.project_title}
                          </p>
                          <p className="text-sm text-graphite-600">
                            {r.owner_email} · {STATUS_LABELS[r.status] ?? r.status}
                          </p>
                        </div>
                        {r.status === "accepted" && (
                          <Link
                            to={`/projects/${r.project_id}`}
                            className="text-sm text-sage-600 hover:text-sage-700"
                          >
                            Voir le projet →
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {receivedPending.length === 0 && receivedOther.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-graphite-600">Aucune demande de supervision</p>
                <p className="text-sm text-graphite-500 mt-1">
                  Les demandes des étudiants apparaîtront ici.
                </p>
              </Card>
            )}
          </div>
        )}
      </main>

      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10">
          <Card className="max-w-md w-full p-5">
            <h3 className="font-medium text-graphite-800">Refuser la demande</h3>
            <p className="text-sm text-graphite-600 mt-1">
              Message optionnel à l&apos;étudiant :
            </p>
            <textarea
              value={declineMessage}
              onChange={(e) => setDeclineMessage(e.target.value)}
              placeholder="Ex. : charge de travail trop élevée..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm resize-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  handleDecline(showDeclineModal, declineMessage)
                }
                disabled={respondingId !== null}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {respondingId === showDeclineModal ? "..." : "Refuser"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(null);
                  setDeclineMessage("");
                }}
                className="rounded-lg border border-sand-300 px-3 py-2 text-sm text-graphite-600 hover:bg-sand-100"
              >
                Annuler
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
