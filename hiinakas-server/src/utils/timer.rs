use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

#[derive(Clone, Debug)]
pub struct Timer {
    timer: Arc<RwLock<Instant>>,
    duration: Duration,
}

impl Timer {
    pub fn with_duration(duration: Duration) -> Self {
        Self {
            timer: Arc::new(RwLock::new(Instant::now())),
            duration,
        }
    }

    pub async fn reset(&self) {
        let mut timer = self.timer.write().await;
        *timer = Instant::now();
    }

    pub async fn expired(&self) -> bool {
        let timer = self.timer.read().await;
        timer.elapsed() >= self.duration
    }
}