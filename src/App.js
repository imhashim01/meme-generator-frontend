import React, { useState, useEffect } from "react";
import axios from "axios";
import CameraView from "./CameraView";
import "./App.css";

const API_BASE = "https://meme-generator-backend-production-fd5e.up.railway.app/api";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [viewMode, setViewMode] = useState("memeGenerator"); // 'memeGenerator' or 'cameraView'

  // Voice States
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [funnyMode, setFunnyMode] = useState(false);

  useEffect(() => {
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const speakCaption = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser does not support text-to-speech.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    if (funnyMode) {
      // Random pitch & speed for funny effect 🤪
      utterance.rate = Math.random() * (2 - 0.5) + 0.5; // between 0.5 and 2
      utterance.pitch = Math.random() * (2 - 0.5) + 0.5; // between 0.5 and 2
    } else {
      utterance.rate = 1;
      utterance.pitch = 1;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setCaptions([]);
      setHashtags([]);
      setDescription("");
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_BASE}/generate-captions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCaptions(res.data.captions || []);
      setHashtags(res.data.hashtags || []);
      setDescription(res.data.description || "");
    } catch (err) {
      console.error("❌ Caption generation failed:", err);
      setError("Failed to generate captions. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeMeme = async (caption) => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("text", caption);
    formData.append("position", "bottom");
    formData.append("filter", selectedFilter);

    try {
      const res = await axios.post(`${API_BASE}/finalize-meme`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const memeUrl = "data:image/jpeg;base64," + res.data.image_base64;
      setPreview(memeUrl);
    } catch (err) {
      console.error("❌ Meme finalization failed:", err);
      setError("Failed to apply filter/meme.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="blink-cursor">💻 AI Meme Generator</h1>
      <p>Upload an image, choose a filter, and get AI-powered captions.</p>

      {/* View Switcher */}
      <div className="view-switcher">
        <button onClick={() => setViewMode("memeGenerator")}>
          Meme Generator
        </button>
        <button onClick={() => setViewMode("cameraView")}>
          Camera View
        </button>
      </div>

      {viewMode === "memeGenerator" ? (
        <>
          {/* Upload + Filter */}
          <div className="panel">
            <input type="file" onChange={handleFileChange} />

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="dropdown"
            >
              <option value="">No Filter</option>
              <option value="grayscale">Grayscale</option>
              <option value="sepia">Sepia</option>
              <option value="blur">Blur</option>
              <option value="bright">Bright</option>
              <option value="contrast">High Contrast</option>
            </select>

            <button onClick={handleUpload} disabled={loading}>
              {loading ? "⏳ Generating..." : "⚡ Generate Captions"}
            </button>
          </div>

          {/* Error Message */}
          {error && <p className="error">{error}</p>}

          {/* Image Preview */}
          {preview && (
            <div className="preview-section panel">
              <h2 className="blink-cursor">📷 Preview</h2>
              <img src={preview} alt="preview" />
            </div>
          )}

          {/* Loader */}
          {loading && <div className="loader"></div>}

          {/* Voice Settings */}
          {voices.length > 0 && (
            <div className="panel">
              <h3>🔊 Voice Options</h3>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={funnyMode}
                  onChange={() => setFunnyMode(!funnyMode)}
                />
                🤪 Funny Voice Mode
              </label>
            </div>
          )}

          {/* Results */}
          {(captions.length > 0 || hashtags.length > 0) && (
            <div className="result-section panel">
              <h2>📝 Captions</h2>
              <ul className="caption-list">
                {captions.map((c, i) => (
                  <li key={i}>
                    {c}{" "}
                    <button onClick={() => handleFinalizeMeme(c)} disabled={loading}>
                      🎨 Apply Filter & Meme
                    </button>
                    <button onClick={() => speakCaption(c)}>🔊 Read Aloud</button>
                  </li>
                ))}
              </ul>

              <h3 className="blink-cursor">🏷 Hashtags</h3>
              <ul className="hashtag-list">
                {hashtags.map((h, i) => (
                  <li key={i}>#{h}</li>
                ))}
              </ul>

              <h3>📖 Description</h3>
              <p>{description}</p>
            </div>
          )}
        </>
      ) : (
        <CameraView />
      )}
    </div>
  );
}

export default App;
