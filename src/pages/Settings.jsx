import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Settings() {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await API.get("/auth/profile");

      const profile = res.data?.data || {};

      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
      });

      localStorage.setItem("admin", JSON.stringify(profile));
    } catch (error) {
      console.error("Erreur chargement profil :", error);
      toast.error(
        error.response?.data?.message || "Erreur lors du chargement du profil"
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await API.put("/auth/profile", profileData);

      const updatedProfile = res.data?.data || profileData;
      localStorage.setItem("admin", JSON.stringify(updatedProfile));

      setProfileData({
        name: updatedProfile.name || "",
        email: updatedProfile.email || "",
      });

      toast.success(res.data?.message || "Profil mis à jour avec succès");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du profil"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("La confirmation du mot de passe ne correspond pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await API.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(res.data.message || "Mot de passe modifié avec succès");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du changement de mot de passe"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="section-header">
        <div>
          <h2>Paramètres du compte</h2>
          <p style={{ color: "#6b7280", marginTop: 6 }}>
            Gérez les informations du profil administrateur
          </p>
        </div>
      </div>

      {loadingProfile ? (
        <div className="card">Chargement du profil...</div>
      ) : (
        <div className="content-grid">
          <div className="card">
            <h2>Profil administrateur</h2>

            <div className="settings-profile-box">
              <div className="settings-avatar">
                {(profileData.name || "A").charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{profileData.name || "Administrateur"}</h3>
                <p>{profileData.email || "Email non disponible"}</p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveProfile}>
              <input
                type="text"
                name="name"
                placeholder="Nom complet"
                value={profileData.name}
                onChange={handleProfileChange}
              />

              <input
                type="email"
                name="email"
                placeholder="Adresse email"
                value={profileData.email}
                onChange={handleProfileChange}
              />

              <button type="submit" disabled={savingProfile}>
                {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Changer le mot de passe</h2>

            <form className="settings-form" onSubmit={handleChangePassword}>
              <input
                type="password"
                name="currentPassword"
                placeholder="Mot de passe actuel"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />

              <input
                type="password"
                name="newPassword"
                placeholder="Nouveau mot de passe"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmer le nouveau mot de passe"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />

              <button type="submit" disabled={changingPassword}>
                {changingPassword
                  ? "Modification..."
                  : "Mettre à jour le mot de passe"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}