-- Fix conversation deletion: add RLS DELETE policy + CASCADE on foreign keys

-- 1. Add DELETE policy for conversations table
-- Allows participants to delete their own conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can delete own conversations'
  ) THEN
    CREATE POLICY "Users can delete own conversations"
      ON public.conversations
      FOR DELETE
      USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
  END IF;
END $$;

-- 2. Add DELETE policy for dm_messages table  
-- Allows conversation participants to delete messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dm_messages' 
    AND policyname = 'Users can delete messages in own conversations'
  ) THEN
    CREATE POLICY "Users can delete messages in own conversations"
      ON public.dm_messages
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.id = conversation_id
          AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
      );
  END IF;
END $$;

-- 3. Add DELETE policy for message_reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'message_reactions' 
    AND policyname = 'Users can delete reactions on messages in own conversations'
  ) THEN
    CREATE POLICY "Users can delete reactions on messages in own conversations"
      ON public.message_reactions
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM dm_messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = message_id
          AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
      );
  END IF;
END $$;

-- 4. (Optional) Add ON DELETE CASCADE to the FK so deleting a conversation
--    automatically cleans up messages. Drop and re-add the FK constraint.
ALTER TABLE public.dm_messages 
  DROP CONSTRAINT IF EXISTS dm_messages_conversation_id_fkey;

ALTER TABLE public.dm_messages
  ADD CONSTRAINT dm_messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
  ON DELETE CASCADE;

-- 5. Also cascade message_reactions when messages are deleted
ALTER TABLE public.message_reactions
  DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;

ALTER TABLE public.message_reactions
  ADD CONSTRAINT message_reactions_message_id_fkey
  FOREIGN KEY (message_id) REFERENCES public.dm_messages(id)
  ON DELETE CASCADE;
