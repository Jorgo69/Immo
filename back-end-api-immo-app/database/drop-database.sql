-- ============================================================
-- 🗑️ Script de suppression de la base de donnees PostgreSQL
-- ============================================================
-- Executer avec: npm run db:drop
-- Ou: sudo -u postgres psql -f database/drop-database.sql
-- ⚠️  ATTENTION: Cette action est irreversible !
-- ============================================================

-- Fermer toutes les connexions actives a la base
SELECT
    pg_terminate_backend (pg_stat_activity.pid)
FROM
    pg_stat_activity
WHERE
    pg_stat_activity.datname = 'back_end_api_immo_app'
    AND pid <> pg_backend_pid ();

-- Supprimer la base de donnees
DROP DATABASE IF EXISTS back_end_api_immo_app;

-- ============================================================
-- ✅ Base de donnees supprimee avec succes
-- 
-- 🔄 Pour recreer la base, executer:
--    npm run db:setup
-- ============================================================
