-- ============================================================
-- 🗄️ Script de creation de la base de donnees PostgreSQL
-- ============================================================
-- Executer avec: npm run db:setup
-- Ou: sudo -u postgres psql -f database/setup-database.sql
-- ============================================================

-- 1. Creer l'utilisateur root avec SUPERUSER (pour dev uniquement!)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'root') THEN
        CREATE USER root WITH PASSWORD 'root' SUPERUSER CREATEDB;
    ELSE
        -- Si l'utilisateur existe deja, lui donner SUPERUSER
        ALTER USER root WITH SUPERUSER;
    END IF;
END
$$;

-- 2. Supprimer la base si elle existe
DROP DATABASE IF EXISTS back_end_api_immo_app;

-- 3. Creer la base de donnees
CREATE DATABASE back_end_api_immo_app OWNER root;

-- 4. Se connecter a la base back_end_api_immo_app
\c back_end_api_immo_app

-- 5. Changer le proprietaire du schema public
ALTER SCHEMA public OWNER TO root;

-- 6. Extension pgvector (recherche sémantique / embeddings IA)
CREATE EXTENSION IF NOT EXISTS vector;

-- Les tables (users, profiles, wallets, properties, etc.) sont créées par TypeORM au démarrage.

-- ============================================================
-- ✅ Configuration terminée !
-- 🚀 Lancer: npm run start:dev
-- ============================================================
