-- Enable UUID extension
\c sistema_encuestas_satisfaccion;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======= ROLES =======
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- ======= TOWERS =======
CREATE TABLE towers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- ======= USERS =======
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ======= USER ↔ TOWER (multi) =======
CREATE TABLE user_tower_map (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tower_id INTEGER REFERENCES towers(id) ON DELETE CASCADE,
  UNIQUE(user_id, tower_id)
);

-- ======= PERMISSIONS (dev group control) =======
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  UNIQUE(resource, action)
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE user_groups (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE group_permissions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE
);

-- ======= TECHNICIANS (no login) =======
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  tower_id INTEGER REFERENCES towers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ======= EVALUATOR ↔ TECHNICIAN =======
CREATE TABLE evaluator_technician_map (
  id SERIAL PRIMARY KEY,
  evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  UNIQUE(evaluator_id, technician_id)
);

-- ======= FORMS =======
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL -- optional
);

-- ======= FORM ↔ TOWER (multi) =======
CREATE TABLE form_tower_map (
  id SERIAL PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  tower_id INTEGER REFERENCES towers(id) ON DELETE CASCADE,
  UNIQUE(form_id, tower_id)
);

-- ======= QUESTIONS =======
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- text, number, radio, checkbox, etc.
  is_required BOOLEAN DEFAULT FALSE,
  options JSONB,
  position INTEGER,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ======= FORM RESPONSES =======
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  value TEXT
);

-- ======= QUESTION HISTORY =======
CREATE TABLE question_history (
  id SERIAL PRIMARY KEY,
  question_id UUID,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_text TEXT,
  new_text TEXT,
  old_options JSONB,
  new_options JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- ======= AUDIT LOG =======
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id UUID,
  data_before JSONB,
  data_after JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

Insert into towers(name) values
	('CMDB'),
	('Operación'),
	('NOC Especializado'),
	('Almacenamiento y Backup'),
	('Gestión de cambios'),
	('Coordinación');

  INSERT INTO roles (name) VALUES ('superadmin') ON CONFLICT (name) DO NOTHING;
  INSERT INTO groups (name) VALUES ('superadmins') ON CONFLICT (name) DO NOTHING;


--Falta llamar en produ

  ALTER TABLE question_responses
  ADD COLUMN technician_id uuid NOT NULL;

  ALTER TABLE question_responses
  ADD CONSTRAINT fk_question_responses_technician
  FOREIGN KEY (technician_id) REFERENCES technicians(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;


  -- Agregar campos para formularios periódicos mensuales
ALTER TABLE forms 
ADD COLUMN is_monthly_periodic BOOLEAN DEFAULT false,
ADD COLUMN evaluation_month VARCHAR(7), -- Formato: 'YYYY-MM'
ADD COLUMN auto_activate BOOLEAN DEFAULT false;

-- Agregar comentarios para documentar
COMMENT ON COLUMN forms.is_monthly_periodic IS 'Indica si es un formulario de evaluación mensual periódica';
COMMENT ON COLUMN forms.evaluation_month IS 'Mes que se está evaluando en formato YYYY-MM';
COMMENT ON COLUMN forms.auto_activate IS 'Si se activa automáticamente del 27 al 5';


-- Agregar campo para identificar el período de evaluación
ALTER TABLE form_responses 
ADD COLUMN evaluation_period VARCHAR(7); -- Formato: 'YYYY-MM'

-- Agregar comentario
COMMENT ON COLUMN form_responses.evaluation_period IS 'Período que se evaluó en formato YYYY-MM';


-- Índices para consultas frecuentes
CREATE INDEX idx_forms_monthly_periodic ON forms(is_monthly_periodic);
CREATE INDEX idx_forms_auto_activate ON forms(auto_activate);
CREATE INDEX idx_forms_evaluation_month ON forms(evaluation_month);
CREATE INDEX idx_form_responses_evaluation_period ON form_responses(evaluation_period);

-- Índice compuesto para verificar respuestas duplicadas por período
CREATE INDEX idx_form_responses_user_period ON form_responses(form_id, user_id, evaluation_period);




-- Actualizar la tabla existente
ALTER TABLE forms 
ADD COLUMN type VARCHAR(20) DEFAULT 'single',
ADD COLUMN start_day INTEGER DEFAULT 27,
ADD COLUMN end_day INTEGER DEFAULT 5,
ADD COLUMN current_period VARCHAR(7),
ADD COLUMN period_start_date TIMESTAMP,
ADD COLUMN period_end_date TIMESTAMP;

-- Migrar datos existentes
UPDATE forms 
SET type = CASE 
  WHEN is_monthly_periodic = true THEN 'periodic'
  ELSE 'single'
END;


ALTER TABLE forms DROP COLUMN is_monthly_periodic;
ALTER TABLE forms DROP COLUMN evaluation_month;