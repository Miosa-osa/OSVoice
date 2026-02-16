use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use hound::{SampleFormat, WavSpec, WavWriter};
use tauri::Manager;

const MEETING_AUDIO_DIR_NAME: &str = "meeting-audio";

fn sanitize_id(id: &str) -> String {
    let mut sanitized = id
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric() || *ch == '-' || *ch == '_')
        .collect::<String>();

    if sanitized.is_empty() {
        sanitized = "meeting".to_string();
    }

    sanitized
}

pub fn meeting_audio_dir(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|err| io::Error::new(io::ErrorKind::Other, err.to_string()))?;
    path.push(MEETING_AUDIO_DIR_NAME);
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn meeting_audio_path_for(app: &tauri::AppHandle, meeting_id: &str) -> io::Result<PathBuf> {
    let mut path = meeting_audio_dir(app)?;
    path.push(format!("{}.wav", sanitize_id(meeting_id)));
    Ok(path)
}

pub fn delete_meeting_audio_file(app: &tauri::AppHandle, file_path: &Path) -> io::Result<()> {
    let audio_dir = fs::canonicalize(meeting_audio_dir(app)?)?;
    let canonical_path = match fs::canonicalize(file_path) {
        Ok(p) => p,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(err),
    };

    if !canonical_path.starts_with(&audio_dir) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Refusing to delete audio outside of managed meeting-audio directory",
        ));
    }

    match fs::remove_file(&canonical_path) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err),
    }
}

pub struct MeetingWavWriter {
    writer: Option<WavWriter<io::BufWriter<fs::File>>>,
    path: PathBuf,
    sample_rate: u32,
    total_samples: usize,
}

impl MeetingWavWriter {
    pub fn create(path: PathBuf, sample_rate: u32) -> io::Result<Self> {
        let spec = WavSpec {
            channels: 1,
            sample_rate,
            bits_per_sample: 16,
            sample_format: SampleFormat::Int,
        };

        let writer = WavWriter::create(&path, spec)
            .map_err(|err| io::Error::new(io::ErrorKind::Other, err.to_string()))?;

        Ok(Self {
            writer: Some(writer),
            path,
            sample_rate,
            total_samples: 0,
        })
    }

    pub fn append_samples(&mut self, samples: &[f32]) -> io::Result<()> {
        let writer = self
            .writer
            .as_mut()
            .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "WAV writer already finalized"))?;

        for sample in samples {
            if sample.is_finite() {
                let normalized = sample.clamp(-1.0, 1.0);
                let quantized = (normalized * i16::MAX as f32).round() as i16;
                writer
                    .write_sample(quantized)
                    .map_err(|err| io::Error::new(io::ErrorKind::Other, err.to_string()))?;
                self.total_samples += 1;
            }
        }

        Ok(())
    }

    pub fn finalize(&mut self) -> io::Result<MeetingAudioResult> {
        let writer = self
            .writer
            .take()
            .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "WAV writer already finalized"))?;

        writer
            .finalize()
            .map_err(|err| io::Error::new(io::ErrorKind::Other, err.to_string()))?;

        let duration_ms = if self.sample_rate > 0 {
            ((self.total_samples as f64 / self.sample_rate as f64) * 1_000.0).round() as i64
        } else {
            0
        };

        Ok(MeetingAudioResult {
            file_path: self.path.to_string_lossy().to_string(),
            duration_ms,
        })
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeetingAudioResult {
    pub file_path: String,
    pub duration_ms: i64,
}

pub struct MeetingAudioWriterState {
    pub writer: Mutex<Option<MeetingWavWriter>>,
}

impl MeetingAudioWriterState {
    pub fn new() -> Self {
        Self {
            writer: Mutex::new(None),
        }
    }
}
