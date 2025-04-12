// src-tauri/src/storage/mod.rs
use crate::errors::{AppError, AppResult, StorageError};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub trait Storage: Send + Sync {
    fn read(&self, key: &str) -> AppResult<Vec<u8>>;
    fn write(&self, key: &str, data: &[u8]) -> AppResult<()>;
    fn delete(&self, key: &str) -> AppResult<()>;
    fn list_keys(&self, prefix: &str) -> AppResult<Vec<String>>;
    fn exists(&self, key: &str) -> bool;
}

pub struct FileSystemStorage {
    base_path: PathBuf,
}

impl FileSystemStorage {
    pub fn new(base_path: PathBuf) -> Self {
        if !base_path.exists() {
            std::fs::create_dir_all(&base_path).expect("Failed to create storage directory");
        }

        Self { base_path }
    }

    fn get_full_path(&self, key: &str) -> PathBuf {
        self.base_path.join(key)
    }

    pub fn initialize_dirs(&self, dirs: &[&str]) -> AppResult<()> {
        for dir in dirs {
            let dir_path = self.base_path.join(dir);
            if !dir_path.exists() {
                std::fs::create_dir_all(&dir_path)
                    .map_err(|e| StorageError::WriteError(dir.to_string(), e))?;
            }
        }

        Ok(())
    }
}

impl Storage for FileSystemStorage {
    fn read(&self, key: &str) -> AppResult<Vec<u8>> {
        let path = self.get_full_path(key);
        std::fs::read(&path).map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                StorageError::KeyNotFound(key.to_string()).into()
            } else {
                StorageError::ReadError(key.to_string(), e).into()
            }
        })
    }

    fn write(&self, key: &str, data: &[u8]) -> AppResult<()> {
        let path = self.get_full_path(key);

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| StorageError::WriteError(key.to_string(), e))?;
            }
        }

        std::fs::write(path, data).map_err(|e| StorageError::WriteError(key.to_string(), e).into())
    }

    fn delete(&self, key: &str) -> AppResult<()> {
        let path = self.get_full_path(key);
        if path.exists() {
            std::fs::remove_file(path)
                .map_err(|e| StorageError::DeleteError(key.to_string(), e).into())
        } else {
            // Already deleted, not an error
            Ok(())
        }
    }

    fn list_keys(&self, prefix: &str) -> AppResult<Vec<String>> {
        let prefix_path = self.get_full_path(prefix);
        let base_path_str = self.base_path.to_string_lossy().to_string();

        let mut keys = Vec::new();

        if !prefix_path.exists() {
            return Ok(keys);
        }

        for entry in WalkDir::new(&prefix_path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let path = entry.path();
            let key = path
                .to_string_lossy()
                .to_string()
                .replace(&base_path_str, "")
                .trim_start_matches(std::path::MAIN_SEPARATOR)
                .to_string();

            keys.push(key);
        }

        Ok(keys)
    }

    fn exists(&self, key: &str) -> bool {
        self.get_full_path(key).exists()
    }
}

// Utility function for file type detection
pub fn get_file_type(path: &Path) -> String {
    match path.extension().and_then(|e| e.to_str()) {
        Some("pdf") => "pdf".to_string(),
        Some("epub") => "epub".to_string(),
        Some(ext)
            if [
                "rs", "ts", "js", "py", "c", "cpp", "h", "hpp", "java", "html", "css", "jsx", "tsx",
            ]
            .contains(&ext) =>
        {
            "code".to_string()
        }
        Some("txt") | Some("md") => "text".to_string(),
        _ => "other".to_string(),
    }
}

#[cfg(test)]
pub mod memory_storage {
    use super::Storage;
    use crate::errors::{AppError, AppResult, StorageError};
    use std::collections::HashMap;
    use std::sync::Mutex;

    pub struct InMemoryStorage {
        data: Mutex<HashMap<String, Vec<u8>>>,
    }

    impl InMemoryStorage {
        pub fn new() -> Self {
            Self {
                data: Mutex::new(HashMap::new()),
            }
        }
    }

    impl Storage for InMemoryStorage {
        fn read(&self, key: &str) -> AppResult<Vec<u8>> {
            let data = self.data.lock().unwrap();
            data.get(key)
                .cloned()
                .ok_or_else(|| StorageError::KeyNotFound(key.to_string()).into())
        }

        fn write(&self, key: &str, data: &[u8]) -> AppResult<()> {
            let mut storage_data = self.data.lock().unwrap();
            storage_data.insert(key.to_string(), data.to_vec());
            Ok(())
        }

        fn delete(&self, key: &str) -> AppResult<()> {
            let mut data = self.data.lock().unwrap();
            data.remove(key);
            Ok(())
        }

        fn list_keys(&self, prefix: &str) -> AppResult<Vec<String>> {
            let data = self.data.lock().unwrap();
            let keys: Vec<String> = data
                .keys()
                .filter(|k| k.starts_with(prefix))
                .cloned()
                .collect();
            Ok(keys)
        }

        fn exists(&self, key: &str) -> bool {
            let data = self.data.lock().unwrap();
            data.contains_key(key)
        }
    }
}
