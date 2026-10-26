-- Abonnements Web Push pour le rappel hebdomadaire de releve

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  endpoint VARCHAR(500) NOT NULL UNIQUE,
  remind_day TINYINT UNSIGNED NOT NULL,
  remind_hour TINYINT UNSIGNED NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  last_notified_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_push_subscriptions_user_id (user_id)
);
