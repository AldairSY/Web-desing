// Configuración de Supabase - Sistema de Investigación e Innovación UPLA
const SUPABASE_URL = 'https://prfttwypthbiytdhzbpw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZnR0d3lwdGhiaXl0ZGh6YnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzYwODQsImV4cCI6MjA3NjcxMjA4NH0.vtyYICQgUIh70fFQGLgGDGblirX92YJpm_CWA8VyZWQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
