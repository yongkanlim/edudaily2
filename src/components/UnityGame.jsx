import { useEffect } from "react";

export default function UnityGame() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/WebBuild/Build/WebBuild.loader.js";
    script.async = true;

    script.onload = () => {
      window.createUnityInstance(
        document.querySelector("#unity-canvas"),
        {
          dataUrl: "/WebBuild/Build/WebBuild.data.gz",
          frameworkUrl: "/WebBuild/Build/WebBuild.framework.js.gz",
          codeUrl: "/WebBuild/Build/WebBuild.wasm.gz",
          streamingAssetsUrl: "StreamingAssets",
          companyName: "YourCompany",
          productName: "YourGame",
          productVersion: "1.0",
        },
        (progress) => {
          console.log(`Unity loading: ${Math.round(progress * 100)}%`);
        }
      ).catch((err) => {
        console.error("Unity load error:", err);
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <canvas
        id="unity-canvas"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
