-- Add foreign key constraint to ai_usage table
-- Links usage records to user_profiles and cascades deletes

ALTER TABLE ai_usage
ADD CONSTRAINT fk_ai_usage_user
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_ai_usage_user ON ai_usage IS 'Ensures usage records are linked to valid users and cleaned up on user deletion';
