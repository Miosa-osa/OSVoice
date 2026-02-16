use base64::{engine::general_purpose, Engine as _};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use rand::{rngs::OsRng, RngCore};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

const SECRET_ENV: &str = "OSVOICE_API_KEY_SECRET";
const SECRET_FILE_NAME: &str = ".encryption-key";
const LEGACY_DEFAULT_SECRET: &[u8] = b"osvoice-default-secret";
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;
const TAG_LEN: usize = 16;

static RUNTIME_SECRET: OnceLock<Vec<u8>> = OnceLock::new();
static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

pub struct ProtectedApiKey {
    pub salt_b64: String,
    pub hash_b64: String,
    pub ciphertext_b64: String,
    pub key_suffix: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("invalid base64 data: {0}")]
    Base64(String),
    #[error("stored API key is not valid UTF-8: {0}")]
    InvalidUtf8(String),
    #[error("decryption failed: {0}")]
    DecryptionFailed(String),
}

pub fn init_crypto(app_data_dir: &Path) {
    APP_DATA_DIR.get_or_init(|| app_data_dir.to_path_buf());
    let _ = runtime_secret();
}

pub fn runtime_secret() -> &'static [u8] {
    RUNTIME_SECRET
        .get_or_init(|| {
            if let Ok(value) = std::env::var(SECRET_ENV) {
                if !value.is_empty() {
                    return value.into_bytes();
                }
            }

            if let Some(app_dir) = APP_DATA_DIR.get() {
                let secret_path = app_dir.join(SECRET_FILE_NAME);
                match read_or_create_secret_file(&secret_path) {
                    Ok(secret) => return secret,
                    Err(err) => {
                        eprintln!("Failed to manage encryption key file: {err}");
                    }
                }
            }

            eprintln!(
                "WARNING: Could not initialize persistent encryption secret. \
                 API keys encrypted in this session may not be recoverable."
            );
            let mut bytes = vec![0u8; KEY_LEN];
            OsRng.fill_bytes(&mut bytes);
            bytes
        })
        .as_slice()
}

fn read_or_create_secret_file(path: &Path) -> Result<Vec<u8>, std::io::Error> {
    use std::fs::OpenOptions;
    use std::io::Write;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let mut open = OpenOptions::new();
    open.write(true).create_new(true);

    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        open.mode(0o600);
    }

    match open.open(path) {
        Ok(mut file) => {
            let mut secret = vec![0u8; KEY_LEN];
            OsRng.fill_bytes(&mut secret);
            file.write_all(general_purpose::STANDARD.encode(&secret).as_bytes())?;
            Ok(secret)
        }
        Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
            let contents = std::fs::read_to_string(path)?;
            general_purpose::STANDARD
                .decode(contents.trim())
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
        }
        Err(err) => Err(err),
    }
}

fn derive_encryption_key(secret: &[u8], salt: &[u8]) -> [u8; KEY_LEN] {
    let mut hasher = Sha256::new();
    hasher.update(b"osvoice-aead-key-v2");
    hasher.update(secret);
    hasher.update(salt);
    hasher.finalize().into()
}

pub fn protect_api_key(key: &str) -> ProtectedApiKey {
    let secret = runtime_secret();
    let salt = generate_salt();
    let encryption_key = derive_encryption_key(secret, &salt);

    let cipher =
        ChaCha20Poly1305::new_from_slice(&encryption_key).expect("key length is 32 bytes");

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, key.as_bytes())
        .expect("encryption should not fail");

    let mut combined = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    let hash = hash_key(secret, &salt, key.as_bytes());

    ProtectedApiKey {
        salt_b64: general_purpose::STANDARD.encode(salt),
        hash_b64: general_purpose::STANDARD.encode(hash),
        ciphertext_b64: general_purpose::STANDARD.encode(combined),
        key_suffix: compute_key_suffix(key),
    }
}

pub fn reveal_api_key(salt_b64: &str, ciphertext_b64: &str) -> Result<String, CryptoError> {
    let salt = general_purpose::STANDARD
        .decode(salt_b64)
        .map_err(|err| CryptoError::Base64(err.to_string()))?;
    let ciphertext_raw = general_purpose::STANDARD
        .decode(ciphertext_b64)
        .map_err(|err| CryptoError::Base64(err.to_string()))?;
    let secret = runtime_secret();

    if let Some(key) = try_aead_decrypt(secret, &salt, &ciphertext_raw) {
        return Ok(key);
    }

    if let Some(key) = try_legacy_xor_decrypt(secret, &salt, &ciphertext_raw) {
        return Ok(key);
    }

    if secret != LEGACY_DEFAULT_SECRET {
        if let Some(key) = try_legacy_xor_decrypt(LEGACY_DEFAULT_SECRET, &salt, &ciphertext_raw) {
            return Ok(key);
        }
    }

    Err(CryptoError::DecryptionFailed(
        "unable to decrypt API key with any available method".into(),
    ))
}

fn try_aead_decrypt(secret: &[u8], salt: &[u8], combined: &[u8]) -> Option<String> {
    if combined.len() < NONCE_LEN + TAG_LEN {
        return None;
    }

    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_LEN);
    let encryption_key = derive_encryption_key(secret, salt);

    let cipher = ChaCha20Poly1305::new_from_slice(&encryption_key).ok()?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher.decrypt(nonce, ciphertext).ok()?;
    String::from_utf8(plaintext).ok()
}

fn try_legacy_xor_decrypt(secret: &[u8], salt: &[u8], ciphertext: &[u8]) -> Option<String> {
    let plaintext = xor_keystream_legacy(secret, salt, ciphertext);
    let key = String::from_utf8(plaintext).ok()?;
    if is_plausible_api_key(&key) {
        Some(key)
    } else {
        None
    }
}

fn is_plausible_api_key(s: &str) -> bool {
    !s.is_empty() && s.len() < 512 && s.chars().all(|c| c.is_ascii_graphic())
}

fn xor_keystream_legacy(secret: &[u8], salt: &[u8], data: &[u8]) -> Vec<u8> {
    let keystream = derive_keystream_legacy(secret, salt, data.len());
    data.iter()
        .zip(keystream.iter())
        .map(|(byte, key_byte)| byte ^ key_byte)
        .collect()
}

fn derive_keystream_legacy(secret: &[u8], salt: &[u8], length: usize) -> Vec<u8> {
    let mut keystream = Vec::with_capacity(length);
    let mut counter: u32 = 0;
    while keystream.len() < length {
        let mut hasher = Sha256::new();
        hasher.update(secret);
        hasher.update(salt);
        hasher.update(counter.to_be_bytes());
        let block = hasher.finalize();
        keystream.extend_from_slice(&block);
        counter = counter.wrapping_add(1);
    }
    keystream.truncate(length);
    keystream
}

fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    salt
}

fn hash_key(secret: &[u8], salt: &[u8], key: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(secret);
    hasher.update(salt);
    hasher.update(key);
    hasher.finalize().into()
}

fn compute_key_suffix(key: &str) -> Option<String> {
    let mut chars = key.chars();
    let mut buffer = Vec::new();
    while let Some(ch) = chars.next_back() {
        buffer.push(ch);
        if buffer.len() == 4 {
            break;
        }
    }
    if buffer.is_empty() {
        None
    } else {
        buffer.reverse();
        Some(buffer.into_iter().collect())
    }
}
