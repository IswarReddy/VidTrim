import { useState, useRef } from "react";

const App = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [message, setMessage] = useState("");

  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(URL.createObjectURL(file));
      setTrimmedVideoUrl(null);
      setMessage("");
      setStartTime(0);
      setEndTime(0);
      setVideoDuration(0);
    }
  };

  const trimVideo = () => {
    if (!videoRef.current) {
      setMessage("Please upload a video first.");
      return;
    }

    const video = videoRef.current;

    if (video.readyState < 2) {
      setMessage("Video is not fully loaded yet. Please wait a moment.");
      return;
    }

    if (endTime <= startTime) {
      setMessage("End time must be greater than start time.");
      return;
    }

    if (startTime < 0 || endTime > videoDuration) {
      setMessage("Start or end time is outside the video's duration.");
      return;
    }

    setIsTrimming(true);
    setMessage("Trimming video, please wait...");

    const mediaRecorder = new MediaRecorder(video.captureStream(), {
      mimeType: "video/webm",
    });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const trimmedBlob = new Blob(chunks, { type: "video/webm" });
      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      setTrimmedVideoUrl(trimmedUrl);
      setIsTrimming(false);
      setMessage("Video trimmed successfully!");
      video.ontimeupdate = null;
    };

    video.currentTime = startTime;
    video.play();

    setTimeout(() => {
      mediaRecorder.start();
    }, 100);

    video.ontimeupdate = () => {
      if (video.currentTime >= endTime) {
        video.pause();
        mediaRecorder.stop();
      }
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      setMessage("Error during trimming: " + e.error.name);
      setIsTrimming(false);
      video.ontimeupdate = null;
    };
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    setMessage("");

    if (name === "start") {
      setStartTime(Math.max(0, Math.min(numValue, endTime)));
    }
    if (name === "end") {
      setEndTime(Math.max(numValue, startTime, 0));
    }
  };

  const saveTrimmedVideo = () => {
    if (trimmedVideoUrl) {
      const link = document.createElement("a");
      link.href = trimmedVideoUrl;
      link.download = "trimmed-video.webm";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setMessage("No trimmed video to download.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">VidTrim</h1>

        {/* Upload Section */}
        <div className="mb-6">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Video Player */}
        {videoFile && (
          <div className="mb-6">
            <video
              ref={videoRef}
              src={videoFile}
              controls
              className="w-full rounded border"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  const duration = videoRef.current.duration;
                  setVideoDuration(duration);
                  setEndTime(Math.min(10, duration));
                  setMessage("Video loaded. Set your trim points.");
                }
              }}
            />
          </div>
        )}

        {/* Time Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time (seconds)
            </label>
            <input
              type="number"
              name="start"
              value={startTime}
              onChange={handleTimeChange}
              min="0"
              max={endTime}
              step="0.1"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time (seconds)
            </label>
            <input
              type="number"
              name="end"
              value={endTime}
              onChange={handleTimeChange}
              min={startTime}
              max={videoDuration > 0 ? videoDuration : undefined}
              step="0.1"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Duration Info */}
        {videoFile && videoDuration > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Video duration: {videoDuration.toFixed(2)} seconds
          </p>
        )}

        {/* Trim Button */}
        <button
          onClick={trimVideo}
          disabled={!videoFile || isTrimming || videoDuration === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
        >
          {isTrimming ? "Trimming..." : "Trim Video"}
        </button>

        {/* Message */}
        {message && (
          <p className="text-sm text-center mb-6 text-gray-600" aria-live="polite">
            {message}
          </p>
        )}

        {/* Trimmed Video */}
        {trimmedVideoUrl && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Trimmed Video</h2>
            <video src={trimmedVideoUrl} controls className="w-full rounded border mb-4" />
            <button
              onClick={saveTrimmedVideo}
              className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download
            </button>
          </div>
        )}

        {!trimmedVideoUrl && videoFile && (
          <div className="border-t pt-6">
            <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-200 rounded">
              <p>Trimmed video will appear here</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;