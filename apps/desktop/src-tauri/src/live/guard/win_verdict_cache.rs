//! Time-limited reuse of a boolean verdict — the UI Automation password check
//! is a cross-process call, so the worker asks the OS at most once per TTL
//! while the user types instead of once per keystroke.
use std::time::{Duration, Instant};

pub struct VerdictCache {
    ttl: Duration,
    last: Option<(Instant, bool)>,
}

impl VerdictCache {
    pub const fn new(ttl: Duration) -> Self {
        Self { ttl, last: None }
    }

    /// The cached verdict if it is younger than `ttl`, otherwise a fresh one
    /// from `fresh`, stored with `now`.
    pub fn get(&mut self, now: Instant, fresh: impl FnOnce() -> bool) -> bool {
        if let Some((at, verdict)) = self.last {
            if now.duration_since(at) < self.ttl {
                return verdict;
            }
        }
        let verdict = fresh();
        self.last = Some((now, verdict));
        verdict
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;

    fn counting(calls: &Cell<u32>, value: bool) -> impl FnOnce() -> bool + '_ {
        move || {
            calls.set(calls.get() + 1);
            value
        }
    }

    #[test]
    fn reuses_a_young_verdict_without_asking_again() {
        let calls = Cell::new(0);
        let mut cache = VerdictCache::new(Duration::from_millis(250));
        let t0 = Instant::now();
        assert!(cache.get(t0, counting(&calls, true)));
        assert!(cache.get(t0 + Duration::from_millis(100), counting(&calls, false)));
        assert_eq!(calls.get(), 1);
    }

    #[test]
    fn asks_again_once_the_ttl_has_passed() {
        let calls = Cell::new(0);
        let mut cache = VerdictCache::new(Duration::from_millis(250));
        let t0 = Instant::now();
        assert!(!cache.get(t0, counting(&calls, false)));
        assert!(cache.get(t0 + Duration::from_millis(250), counting(&calls, true)));
        assert_eq!(calls.get(), 2);
    }
}
