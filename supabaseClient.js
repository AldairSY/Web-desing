// Configuración de Supabase - Sistema de Investigación e Innovación IEST
const SUPABASE_URL = 'https://onpvatwlpmpoeklldtcr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucHZhdHdscG1wb2VrbGxkdGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE5NzcsImV4cCI6MjA3NjkxNzk3N30.ecn7gU9Ge0fkZ2JElbChngUsAVfjiE4CYRr0V6Rlsm8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
