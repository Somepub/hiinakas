use std::pin::Pin;
use std::time::Duration;
use tokio::time::{sleep, Sleep, Instant};

pub struct Timer {
    sleep: Pin<Box<Sleep>>,
    end_time: Instant,
    duration: Duration,
}

impl Timer {
    pub fn new(duration: Duration) -> Self {
        let end_time = Instant::now() + duration;
        Self {
            sleep: Box::pin(sleep(duration)),
            end_time,
            duration,
        }
    }

    pub fn reset(&mut self) {
        self.end_time = Instant::now() + self.duration;
        self.sleep.as_mut().reset(self.end_time);
    }

    pub fn expired(&self) -> bool {
        Instant::now() >= self.end_time
    }

    pub async fn wait_until_expired(&mut self) {
        self.sleep.as_mut().await;
    }
}