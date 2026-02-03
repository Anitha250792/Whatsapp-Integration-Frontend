import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp, FaTrash, FaFilePdf, FaFileWord } from "react-icons/fa";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

/* 🔤 Initials */
const getInitials = (name = "") =>
  name ? name.split(" ").map(w => w[0]).join("").toUpperCase() : "U";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("User");
  const [initials, setInitials] = useState("U");

  /* 🔔 Toast */
  const [toast, setToast] = useState(null);

  /* 📊 Progress */
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);

  /* 📲 WhatsApp */
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!token) return navigate("/login");

    axios
      .get(`${API}/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const name = res.data.username || res.data.email;
        setUsername(name);
        setInitials(getInitials(name));
      })
      .catch(() => navigate("/login"));

    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data || []);
    } catch {
      showToast("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      await axios.post(`${API}/files/upload/`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("File uploaded", "success");
      fetchFiles();
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ================= WHATSAPP SETTINGS ================= */
  const saveWhatsapp = async () => {
    try {
      await axios.post(
        `${API}/accounts/update-whatsapp/`,
        {
          whatsapp_number: whatsapp,
          whatsapp_enabled: whatsappEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("WhatsApp settings saved", "success");
    } catch {
      showToast("Failed to save WhatsApp settings", "error");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="dashboard">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="header">
        <div className="header-left">
          <div className="avatar">{initials}</div>
          <div>
            <h3>📄 File Converter Dashboard</h3>
            <p>Welcome, {username}</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }}>
          Logout
        </button>
      </div>

      {/* 📲 WhatsApp */}
      <div className="whatsapp-box">
        <h4>📲 WhatsApp Integration</h4>

        <input
          placeholder="WhatsApp number with country code"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={whatsappEnabled}
            onChange={() => setWhatsappEnabled(!whatsappEnabled)}
          />
          Enable WhatsApp delivery
        </label>

        <button onClick={saveWhatsapp}>Save</button>
      </div>

      {/* 📤 Upload */}
      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading…</span>}
      </div>

      {/* 📂 Files */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="file-list">
          {files.map((f) => (
            <div className="file-card" key={f.id}>
              {f.filename.endsWith(".pdf") ? <FaFilePdf /> : <FaFileWord />}
              <span>{f.filename}</span>
              <FaWhatsapp
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      `${f.filename}\n${API}/files/public/${f.public_token}/`
                    )}`
                  )
                }
              />
              <FaTrash
                onClick={() =>
                  axios
                    .delete(`${API}/files/delete/${f.id}/`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    .then(fetchFiles)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
