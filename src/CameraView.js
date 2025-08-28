import React, { useEffect, useRef, useState } from "react";
import { bootstrapCameraKit, createMediaStreamSource, Transform2D } from "@snap/camera-kit";

const CameraView = () => {
  const containerRef = useRef(null);
  const sessionRef = useRef(null);
  const [lenses, setLenses] = useState([]);
  const [activeLensId, setActiveLensId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzU2MDQ3MDc5LCJzdWIiOiI4ODhlZTI3OC0wNjMzLTQyMGItYWQxNC0xNjBmMGQxZTc4NzB-U1RBR0lOR34zYTJhNTU2MS02YTBkLTQ2ZjEtYWZmNi1jNjgyY2JmZDk3YzUifQ.rNAPCLgZWojaynyMlddjfCoS6GnyES9C-FGFvt5Xjgc";

        const cameraKit = await bootstrapCameraKit({ apiToken });
        const session = await cameraKit.createSession();
        sessionRef.current = session;

        // Add the camera canvas into our container
        containerRef.current.innerHTML = ""; // clear old children
        containerRef.current.appendChild(session.output.live);

        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const source = await createMediaStreamSource(stream);
        await session.setSource(source);
        source.setTransform(Transform2D.MirrorX);

        // Start session
        await session.play("live");

        // Load lens group
        const { lenses } = await cameraKit.lensRepository.loadLensGroups([
          "b202a5b5-482b-44ca-be26-220add4bd631",
        ]);
        setLenses(lenses);

        if (lenses.length > 0) {
          await session.applyLens(lenses[0]);
          setActiveLensId(lenses[0].id);
        }
      } catch (err) {
        console.error("❌ CameraKit init failed:", err);
      }
    };

    init();
  }, []);

  const switchLens = async (lens) => {
    if (sessionRef.current && lens) {
      await sessionRef.current.applyLens(lens);
      setActiveLensId(lens.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ marginBottom: "12px", color: "#00ff00" }}>Camera View</h2>


      {/* Camera Output */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "500px",
          aspectRatio: "3/4",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          border: "1px solid #00ff00",
          background: "#000",

        }}
      />

      {/* Lens Switcher */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {lenses.map((lens) => (
          <button
            key={lens.id}
            onClick={() => switchLens(lens)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: lens.id === activeLensId ? "#00ff00" : "#444",
              color: "white",
            }}
          >
            {lens.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CameraView;
