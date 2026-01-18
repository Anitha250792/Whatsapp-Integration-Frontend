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
}, [token]);


  /* 📂 Fetch files */
  const fetchFiles = async () => {
  try {
    const res = await axios.get(
      `${API}/files/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    setFiles(res.data);
  } catch (err) {
    console.error("Fetch files failed:", err);

    // 🔐 Token invalid or expired
    if (err.response?.status === 401) {
      localStorage.clear();
      navigate("/login");
    } else {
      alert("Failed to load files");
    }
  } finally {
    setLoading(false);
  }
};

  
  const downloadFile = async (url, filename) => {
  try {
    const res = await axios.post(url, {}, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });

    const blob = new Blob([res.data]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

  } catch (err) {
    if (err.response?.status === 400) {
  alert("❌ Conversion failed.\nScanned PDFs need OCR.");
} else {
  alert("❌ Server error. Try again.");
}

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

    await axios.post(
  "https://whatsapp-integration-u7tq.onrender.com/files/upload/",
  formData,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  }
);


    await fetchFiles(); // refresh list
  } catch (err) {
    console.error("Upload error:", err);
    alert("❌ Upload failed");
  } finally {
    setUploading(false);
  }
};

  /* ☑ Select files */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ❌ Delete */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;

    await axios.delete(`${API}/api/files/delete/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFiles();
  };

  const convertWordToPDF = (id) =>
  downloadFile(`${API}/api/files/convert/word-to-pdf/${id}/`, "converted.pdf");

const convertPDFToWord = (id) =>
  downloadFile(`${API}/api/files/convert/pdf-to-word/${id}/`, "converted.docx");

const mergePDFs = async () => {
  if (selectedIds.length < 2) return alert("Select at least 2 PDFs");

  const res = await axios.post(
    `${API}/api/files/merge/`,
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


const splitPDF = async () => {
  if (selectedIds.length !== 1) return alert("Select one PDF");

  const res = await axios.post(
    `${API}/api/files/split/${selectedIds[0]}/`,
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


const signPDF = async () => {
  if (!signer || selectedIds.length !== 1) return alert("Signer required");

  const res = await axios.post(
    `${API}/api/files/sign/${selectedIds[0]}/`,
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



 const shareWhatsApp = (fileId, filename) => {
  const link = `${API}/api/files/download/${fileId}/`;
  const msg = `📄 ${filename}\nDownload:\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
};



const shareGmail = (file) => {
  const link = `${API}/api/files/download/${file.id}/`;

  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&su=File Download&body=${encodeURIComponent(
      `Download here:\n${link}`
    )}`,
    "_blank"
  );
};

  /* 🚪 Logout */
  const handleLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");

  if (window.google) {
    window.google.accounts.id.disableAutoSelect();
  }

  navigate("/login");
};


  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="header">
        <h3>📄 File Converter Dashboard</h3>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* UPLOAD */}
      <div className="upload-box">
        <input type="file" onChange={handleUpload} />
        {uploading && <span>Uploading...</span>}
      </div>

      {/* BULK ACTIONS */}
      <div className="bulk-actions">
        <button onClick={mergePDFs}>Merge PDFs</button>
        <button onClick={splitPDF}>Split PDF</button>

        <input
          type="text"
          placeholder="Signer name"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
        />
        <button onClick={signPDF}>Sign PDF</button>
      </div>

      {/* FILE LIST */}
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
                  <FaFilePdf className="file-icon pdf" />
                ) : (
                  <FaFileWord className="file-icon word" />
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

                <FaTrash
                  className="delete"
                  onClick={() => deleteFile(file.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
