use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::Block;

// Initialize application directories
pub fn initialize_dirs(base_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let dirs = [base_dir, &base_dir.join("blocks")];

    for dir in dirs.iter() {
        if !dir.exists() {
            fs::create_dir_all(dir)?;
        }
    }

    Ok(())
}

// Find highest block ID to initialize the counter
pub fn find_highest_block_id(blocks_dir: &Path) -> u64 {
    let mut highest_id = 0;

    if !blocks_dir.exists() {
        return highest_id;
    }

    if let Ok(entries) = fs::read_dir(blocks_dir) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.extension().unwrap_or_default() == "json" {
                if let Some(file_stem) = path.file_stem() {
                    if let Some(file_name) = file_stem.to_str() {
                        if let Ok(id) = file_name.parse::<u64>() {
                            if id > highest_id {
                                highest_id = id;
                            }
                        }
                    }
                }
            }
        }
    }

    highest_id
}

// Load all blocks into cache
pub fn load_blocks_cache(blocks_dir: &Path) -> HashMap<u64, Block> {
    let mut cache = HashMap::new();

    if !blocks_dir.exists() {
        return cache;
    }

    if let Ok(entries) = fs::read_dir(blocks_dir) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.extension().unwrap_or_default() == "json" {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(block) = serde_json::from_str::<Block>(&content) {
                        cache.insert(block.id, block);
                    }
                }
            }
        }
    }

    cache
}

// Save a block to disk and update cache
pub fn save_block(
    block: &Block,
    data_dir: &Path,
    cache: &mut HashMap<u64, Block>,
) -> Result<(), String> {
    let block_path = data_dir.join("blocks").join(format!("{}.json", block.id));
    let json = serde_json::to_string_pretty(&block).map_err(|e| e.to_string())?;
    fs::write(block_path, json).map_err(|e| e.to_string())?;

    // Update cache
    cache.insert(block.id, block.clone());

    Ok(())
}

// Get file extension categorization
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
