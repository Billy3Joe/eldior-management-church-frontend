import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import API from "../api/axios";
import { getCurrentAdmin } from "../utils/auth";

const initialForm = {
  name: "",
  leader: "",
  status: "active",
};

export default function Departments() {
  const currentUser = getCurrentAdmin();
  const isAdmin = currentUser?.role === "admin";

  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [form, setForm] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  // ======================================================
  // CHARGEMENT
  // ======================================================

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response =
        await API.get(
          "/departments",
          {
            params: {
              limit: 1000,
            },
          }
        );

      const data =
        response.data?.data ||
        response.data?.departments ||
        [];

      setDepartments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur départements :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les départements"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ======================================================
  // RECHERCHE
  // ======================================================

  const filteredDepartments =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return departments;
      }

      return departments.filter(
        (department) =>
          [
            department.name,
            department.leader,
            department.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value)
      );
    }, [departments, search]);

  // ======================================================
  // FORM
  // ======================================================

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (
    department
  ) => {
    setEditingId(
      department._id
    );

    setForm({
      name:
        department.name || "",

      leader:
        department.leader || "",

      status:
        department.status ||
        "active",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // CREATE / UPDATE
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.warning(
        "Le nom du département est obligatoire"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name:
          form.name.trim(),

        leader:
          form.leader.trim(),

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/departments/${editingId}`,
          payload
        );

        toast.success(
          "Département modifié"
        );
      } else {
        await API.post(
          "/departments",
          payload
        );

        toast.success(
          "Département créé"
        );
      }

      resetForm();

      await fetchDepartments();
    } catch (error) {
      console.error(
        "Erreur département :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible d'enregistrer le département"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // DELETE ADMIN
  // ======================================================

  const handleDelete = async (
    id
  ) => {
    if (!isAdmin) {
      toast.error(
        "Suppression réservée aux administrateurs"
      );

      return;
    }

    if (
      !window.confirm(
        "Supprimer ce département ?"
      )
    ) {
      return;
    }

    try {
      await API.delete(
        `/departments/${id}`
      );

      toast.success(
        "Département supprimé"
      );

      await fetchDepartments();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer le département"
      );
    }
  };

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Départements</h2>

          <p className="page-subtitle">
            Organisez les différents
            départements de l'église.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
        >
          + Nouveau département
        </button>
      </div>

      {showForm && (
        <div className="card section-gap">
          <h3>
            {editingId
              ? "Modifier le département"
              : "Créer un département"}
          </h3>

          <form
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label>Nom</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Responsable
              </label>

              <input
                name="leader"
                value={form.leader}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Statut</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">
                  Actif
                </option>

                <option value="inactive">
                  Inactif
                </option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : editingId
                  ? "Enregistrer"
                  : "Créer"}
              </button>

              <button
                type="button"
                onClick={resetForm}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card section-gap">
        <input
          type="search"
          placeholder="Rechercher un département..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        <div
          style={{
            marginTop: 20,
            overflowX: "auto",
          }}
        >
          {loading ? (
            <p>
              Chargement...
            </p>
          ) : filteredDepartments.length ===
            0 ? (
            <p>
              Aucun département.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>
                    Responsable
                  </th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map(
                  (department) => (
                    <tr
                      key={
                        department._id
                      }
                    >
                      <td>
                        {
                          department.name
                        }
                      </td>

                      <td>
                        {department.leader ||
                          "—"}
                      </td>

                      <td>
                        {department.status ||
                          "—"}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                department
                              )
                            }
                          >
                            Modifier
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  department._id
                                )
                              }
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}