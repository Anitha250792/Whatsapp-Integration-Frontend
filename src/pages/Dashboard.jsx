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

const Dashboard = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signer, setSigner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");

  /* 🔐 Protect dashboard */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchFiles();
  }, []);

  /* 📂 Fetch files */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      console.error("Fetch files failed:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ⬆ Upload */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API}/files/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err.response || err);
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
  const downloadFile = async (url, filename) => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};


  /* 🔄 Convert */
  const convertWordToPDF = (id) =>
    downloadFile(`${API}/files/convert/word-to-pdf/${id}/`, "converted.pdf");

  const convertPDFToWord = (id) =>
    downloadFile(`${API}/files/convert/pdf-to-word/${id}/`, "converted.docx");

  /* 🧩 Merge */
  const mergePDFs = async () => {
    if (selectedIds.length < 2) return alert("Select at least 2 PDFs");

    const res = await axios.post(
      `${API}/files/merge/`,
      { file_ids: selectedIds },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "merged.pdf";
    link.click();
  };

  /* ✂ Split */
  const splitPDF = async () => {
    if (selectedIds.length !== 1) return alert("Select one PDF");

    const res = await axios.post(
      `${API}/files/split/${selectedIds[0]}/`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "split.zip";
    link.click();
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

    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = "signed.pdf";
    link.click();
  };

  /* 📲 Share */
 const shareWhatsApp = (file) => {
  const msg = `📄 ${file.filename}\nDownload:\n${file.public_url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};


  const shareGmail = (file) => {
    const link = `${API}/files/download/${file.id}/`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=File&body=${encodeURIComponent(link)}`
    );
  };

  /* 🚪 Logout */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h3>📄 File Converter Dashboard</h3>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

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

      {loading ? (
        <p>Loading files...</p>
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

                <FaWhatsapp onClick={() => shareWhatsApp(file.id, file.filename)} />
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
