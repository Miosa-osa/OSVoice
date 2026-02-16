const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

export type AssemblyAITestIntegrationArgs = {
  apiKey: string;
};

export const assemblyaiTestIntegration = async ({
  apiKey,
}: AssemblyAITestIntegrationArgs): Promise<boolean> => {
  try {
    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: "GET",
      headers: { Authorization: apiKey },
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
};

export const convertFloat32ToPCM16 = (
  float32Array: Float32Array | number[],
): ArrayBuffer => {
  const samples = Array.isArray(float32Array)
    ? float32Array
    : Array.from(float32Array);
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
};

export type AssemblyAIUtterance = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};

export type AssemblyAIDiarizeResult = {
  utterances: AssemblyAIUtterance[];
  text: string;
};

export type AssemblyAIDiarizeArgs = {
  apiKey: string;
  audioBlob: ArrayBuffer;
};

async function uploadAudio(
  apiKey: string,
  audioBlob: ArrayBuffer,
): Promise<string> {
  const response = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: audioBlob,
  });

  if (!response.ok) {
    throw new Error(`AssemblyAI upload failed: ${response.status}`);
  }

  const data = (await response.json()) as { upload_url: string };
  return data.upload_url;
}

async function createTranscript(
  apiKey: string,
  audioUrl: string,
): Promise<string> {
  const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`AssemblyAI create transcript failed: ${response.status}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

type TranscriptStatus = "queued" | "processing" | "completed" | "error";

type TranscriptResponse = {
  id: string;
  status: TranscriptStatus;
  text: string | null;
  error: string | null;
  utterances:
    | { speaker: string; text: string; start: number; end: number }[]
    | null;
};

async function pollTranscript(
  apiKey: string,
  transcriptId: string,
): Promise<TranscriptResponse> {
  const maxAttempts = 120;
  const delayMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `${ASSEMBLYAI_BASE}/transcript/${transcriptId}`,
      {
        headers: { Authorization: apiKey },
      },
    );

    if (!response.ok) {
      throw new Error(`AssemblyAI poll failed: ${response.status}`);
    }

    const data = (await response.json()) as TranscriptResponse;

    if (data.status === "completed") {
      return data;
    }

    if (data.status === "error") {
      throw new Error(
        `AssemblyAI transcription error: ${data.error ?? "unknown"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("AssemblyAI transcription timed out after polling");
}

export const assemblyaiDiarize = async ({
  apiKey,
  audioBlob,
}: AssemblyAIDiarizeArgs): Promise<AssemblyAIDiarizeResult> => {
  const uploadUrl = await uploadAudio(apiKey, audioBlob);
  const transcriptId = await createTranscript(apiKey, uploadUrl);
  const result = await pollTranscript(apiKey, transcriptId);

  const utterances: AssemblyAIUtterance[] = (result.utterances ?? []).map(
    (u) => ({
      speaker: u.speaker,
      text: u.text,
      start: u.start,
      end: u.end,
    }),
  );

  return {
    utterances,
    text: result.text ?? "",
  };
};
