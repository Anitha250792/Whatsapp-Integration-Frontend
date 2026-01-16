import api from "../api/axios";
import "./toolcard.css";

export default function ToolCard({ tool }) {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("action", tool.action);
    formData.append("file", file);

    const res = await api.post("pdf/convert/", formData);
    window.open(res.data.file_url, "_blank");
  };

  return (
    <div className="tool-card">
      <h3>{tool.title}</h3>
      <input type="file" onChange={handleUpload} />
    </div>
  );
}
