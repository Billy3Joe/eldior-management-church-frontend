import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import API from "../api/axios";
import { getCurrentAdmin } from "../utils/auth";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "active",
};

export default function Members() {
  const currentUser = getCurrentAdmin();
  const isAdmin = currentUser?.role === "admin";

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  // ======================================================
  // CHARGER LES MEMBRES
  // ======================================================

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await API.get("/members", {
        params: {
          limit: 1000,
        },
      });

      const data =
        response.data?.data ||
        response.data?.members ||
        [];

      setMembers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement membres :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les membres"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // ======================================================
  // RECHERCHE
  // ======================================================

  const filteredMembers = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return members;
    }

    return members.filter((member) => {
      const text = [
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [members, search]);

  // ======================================================
  // FORMULAIRE
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

  const openEditForm = (member) => {
    setEditingId(member._id);

    setForm({
      firstName:
        member.firstName || "",

      lastName:
        member.lastName || "",

      email:
        member.email || "",

      phone:
        member.phone || "",

      status:
        member.status || "active",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // CRÉER / MODIFIER
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      toast.warning(
        "Le prénom et le nom sont obligatoires"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        status:
          form.status,
      };

      if (editingId) {
        await API.put(
          `/members/${editingId}`,
          payload
        );

        toast.success(
          "Membre modifié avec succès"
        );
      } else {
        await API.post(
          "/members",
          payload
        );

        toast.success(
          "Membre ajouté avec succès"
        );
      }

      resetForm();

      await fetchMembers();
    } catch (error) {
      console.error(
        "Erreur enregistrement membre :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible d'enregistrer le membre"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // SUPPRESSION
  // ADMIN UNIQUEMENT
  // ======================================================

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error(
        "Seul un administrateur peut supprimer un membre"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer ce membre ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/members/${id}`
      );

      toast.success(
        "Membre supprimé avec succès"
      );

      await fetchMembers();
    } catch (error) {
      console.error(
        "Erreur suppression membre :",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer ce membre"
      );
    }
  };

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Membres</h2>

          <p className="page-subtitle">
            Gérez les membres de votre
            église.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
        >
          + Ajouter un membre
        </button>
      </div>

      {showForm && (
        <div className="card section-gap">
          <h3>
            {editingId
              ? "Modifier le membre"
              : "Nouveau membre"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Prénom</label>

              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Nom</label>

              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>

              <input
                name="phone"
                value={form.phone}
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
              className="form-actions"
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
                  ? "Enregistrer les modifications"
                  : "Ajouter le membre"}
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
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <input
            type="search"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        {loading ? (
          <p>
            Chargement des membres...
          </p>
        ) : filteredMembers.length ===
          0 ? (
          <p>
            Aucun membre trouvé.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map(
                  (member) => (
                    <tr key={member._id}>
                      <td>
                        {member.firstName}{" "}
                        {member.lastName}
                      </td>

                      <td>
                        {member.email ||
                          "—"}
                      </td>

                      <td>
                        {member.phone ||
                          "—"}
                      </td>

                      <td>
                        {member.status ||
                          "—"}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                member
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
                                  member._id
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
          </div>
        )}
      </div>
    </Layout>
  );
}