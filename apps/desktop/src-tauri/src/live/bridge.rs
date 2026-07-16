use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::oneshot;

/// Correlates per-word transform requests emitted to JS with their replies.
#[derive(Default)]
pub struct TransformBridge {
    pending: Mutex<HashMap<u64, oneshot::Sender<String>>>,
    next_id: AtomicU64,
}

#[derive(Clone, Serialize)]
struct TransformRequest {
    id: u64,
    word: String,
}

impl TransformBridge {
    /// Ask the JS engine to transliterate `word`. Returns None on timeout/failure.
    pub async fn transform(&self, app: &AppHandle, word: String) -> Option<String> {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id, tx);
        if app
            .emit("alfavit://transform-request", TransformRequest { id, word })
            .is_err()
        {
            self.pending.lock().unwrap().remove(&id);
            return None;
        }
        match tokio::time::timeout(Duration::from_millis(500), rx).await {
            Ok(Ok(output)) => Some(output),
            _ => {
                self.pending.lock().unwrap().remove(&id);
                None
            }
        }
    }
}

/// JS calls this with the transliterated result for request `id`.
#[tauri::command]
pub fn submit_transform(id: u64, output: String, bridge: State<TransformBridge>) {
    if let Some(tx) = bridge.pending.lock().unwrap().remove(&id) {
        let _ = tx.send(output);
    }
}
