import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaEnvelope,
  FaTrash,
  FaFilePdf,
  FaFileWord,
} from "react-icons/fa";
import "./Dashboard.css";

const API = "https://whatsapp-integration-u7tq.onrender.com";

/* 🅰️ Generate initials */
const getInitials = (name = "") => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("User");
  const [initials, setInitials] = useState("U");

  const token = localStorage.getItem("access");

  /* 👤 Fetch logged-in user */
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API}/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const name = res.data.username || res.data.email || "User";
      setUsername(name);
      setInitials(getInitials(name));
    } catch (err) {
      console.error("User fetch failed");
    }
  };

  /* 📂 Fetch files */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  /* 🔐 Protect dashboard */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserProfile(); // ✅ USERNAME FIX
    fetchFiles();
  }, []);

  /* ⬆ Upload */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/files/upload/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch {
      alert("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ☑ Select */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ❌ Delete */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;

    await axios.delete(`${API}/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchFiles();
  };

  /* ⬇ Download helper */
  const downloadBlob = (data, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data]));
    link.download = filename;
    link.click();
  };

  /* 🔄 Convert */
  const convertWordToPDF = async (id) => {
    const res = await axios.get(
      `${API}/files/convert/word-to-pdf/${id}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );
    downloadBlob(res.data, "converted.pdf");
  };

  const convertPDFToWord = async (id) => {
    const res = await axios.get(
      `${API}/files/convert/pdf-to-word/${id}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );
    downloadBlob(res.data, "converted.docx");
  };

  /* 🧩 Merge */
  const mergePDFs = async () => {
    if (selectedIds.length < 2)
      return alert("Select at least 2 PDFs");

    const res = await axios.post(
      `${API}/files/merge/`,
      { file_ids: selectedIds },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    downloadBlob(res.data, "merged.pdf");
  };

  /* ✂ Split */
  const splitPDF = async () => {
    if (selectedIds.length !== 1)
      return alert("Select exactly one PDF");

    const res = await axios.post(
      `${API}/files/split/${selectedIds[0]}/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    downloadBlob(res.data, "split.zip");
  };

  /* ✍ Sign */
  const signPDF = async () => {
    if (!signer || selectedIds.length !== 1)
      return alert("Signer name required");

    const res = await axios.post(
      `${API}/files/sign/${selectedIds[0]}/`,
      { signer },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    downloadBlob(res.data, "signed.pdf");
  };

  /* 📲 Share */
  const shareWhatsApp = (file) => {
    const link = `${API}/files/download/${file.id}/`;
    const msg = `📄 ${file.filename}\nDownload:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const shareGmail = (file) => {
    const link = `${API}/files/download/${file.id}/`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(
        link
      )}`
    );
  };

  /* 🚪 Logout */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* ===== HEADER ===== */}
      <div className="header">
        <div className="header-left">
          <div className="avatar">{initials}</div>
          <div>
            <h3>📄 File Converter Dashboard</h3>
            <p className="username">Welcome, {username}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== UPLOAD ===== */}
      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      {/* ===== BULK ACTIONS ===== */}
      <div className="bulk-actions">
        <button onClick={mergePDFs}>Merge PDFs</button>
        <button onClick={splitPDF}>Split PDF</button>

        <input
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button onClick={signPDF}>Sign PDF</button>
      </div>

      {/* ===== FILE LIST ===== */}
      {loading ? (
        <p className="loading">Loading files...</p>
      ) : (
        <div className="file-list">
          {files.length === 0 && <p>No files uploaded</p>}

          {files.map((file) => (
            <div className="file-card" key={file.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(file.id)}
                onChange={() => toggleSelect(file.id)}
              />

              <div className="file-info">
                {file.filename.endsWith(".pdf") ? (
                  <FaFilePdf />
                ) : (
                  <FaFileWord />
                )}
                <span>{file.filename}</span>
              </div>

              <div className="actions">
                {file.filename.endsWith(".docx") && (
                  <button onClick={() => convertWordToPDF(file.id)}>
                    Word → PDF
                  </button>
                )}

                {file.filename.endsWith(".pdf") && (
                  <button onClick={() => convertPDFToWord(file.id)}>
                    PDF → Word
                  </button>
                )}

                <FaWhatsapp onClick={() => shareWhatsApp(file)} />
                <FaEnvelope onClick={() => shareGmail(file)} />
                <FaTrash onClick={() => deleteFile(file.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
