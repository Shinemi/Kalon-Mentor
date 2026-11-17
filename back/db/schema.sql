-- Structure applicative issue de l'annexe A05, sans données personnelles.
-- À exécuter uniquement sur une base vide, avec un rôle propriétaire.
BEGIN;
CREATE TYPE public.ressource_category AS ENUM ('couleurs', 'lumiere', 'perspective', 'anatomie', 'proportions', 'composition');
CREATE TYPE public.ressource_type AS ENUM ('course', 'video');
CREATE TABLE public."users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "username" character varying NOT NULL,
  "email" character varying NOT NULL,
  "avatar_url" text,
  "password" character varying NOT NULL,
  "role" text DEFAULT 'member'::text NOT NULL,
  "terms_accepted_at" timestamp with time zone,
  "terms_version" text,
  "adult_declared_at" timestamp with time zone,
  "last_active_at" timestamp with time zone DEFAULT now(),
  "inactive_notice_sent_at" timestamp with time zone,
  "password_reset_token_hash" text,
  "password_reset_expires_at" timestamp with time zone,
  "token_version" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "kalon_mvp_users_acceptance_check" CHECK (terms_accepted_at IS NULL AND terms_version IS NULL AND adult_declared_at IS NULL OR terms_accepted_at IS NOT NULL AND terms_version IS NOT NULL AND btrim(terms_version) <> ''::text AND adult_declared_at IS NOT NULL),
  CONSTRAINT "kalon_mvp_users_role_check" CHECK (role = ANY (ARRAY['member'::text, 'admin'::text])),
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_username_key" UNIQUE (username)
);

CREATE TABLE public."resources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "title" character varying NOT NULL,
  "category" ressource_category NOT NULL,
  "type" ressource_type NOT NULL,
  "content" jsonb,
  "author_name" character varying,
  "order_index" integer,
  "url" character varying,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "resources_category_order_unique" UNIQUE (category, order_index),
  CONSTRAINT "resources_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."corrections" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "image_url" text NOT NULL,
  "feedback_text" text NOT NULL,
  CONSTRAINT "corrections_pkey" PRIMARY KEY (id),
  CONSTRAINT "corrections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE public."corrections_resources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "correction_id" uuid NOT NULL,
  "resource_id" uuid NOT NULL,
  "priority" smallint NOT NULL,
  CONSTRAINT "corrections_resources_correction_id_fkey" FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE,
  CONSTRAINT "corrections_resources_correction_id_resource_id_key" UNIQUE (correction_id, resource_id),
  CONSTRAINT "corrections_resources_pkey" PRIMARY KEY (id),
  CONSTRAINT "corrections_resources_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id)
);

CREATE TABLE public."analysis_events" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "analysis_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "analysis_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE public."analysis_locks" (
  "user_id" uuid NOT NULL,
  "request_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone DEFAULT (now() + '00:02:00'::interval) NOT NULL,
  CONSTRAINT "analysis_locks_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "analysis_locks_request_id_key" UNIQUE (request_id),
  CONSTRAINT "analysis_locks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "kalon_mvp_analysis_locks_duration_check" CHECK (expires_at = (started_at + '00:02:00'::interval))
);
CREATE INDEX kalon_mvp_analysis_events_user_created_idx ON public.analysis_events USING btree (user_id, created_at DESC);
CREATE INDEX kalon_mvp_corrections_user_created_idx ON public.corrections USING btree (user_id, created_at DESC);
CREATE INDEX kalon_mvp_corrections_resources_resource_idx ON public.corrections_resources USING btree (resource_id);
CREATE UNIQUE INDEX users_password_reset_token_hash_idx ON public.users USING btree (password_reset_token_hash) WHERE (password_reset_token_hash IS NOT NULL);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_locks ENABLE ROW LEVEL SECURITY;
COMMIT;

