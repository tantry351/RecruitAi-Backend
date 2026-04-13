CREATE DATABASE IF NOT EXISTS recruitmen_db;
USE recruitmen_db;

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telepon VARCHAR(20) NOT NULL,
    portofolio TEXT,
    posisi VARCHAR(50) NOT NULL,
    job_id VARCHAR(50) NOT NULL,
    cv_original_name VARCHAR(255),
    cv_url TEXT,
    score INT DEFAULT NULL,
    status ENUM('pending', 'processed', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    threshold_score INT DEFAULT 70
);

INSERT INTO jobs (job_id, title, description, threshold_score) VALUES 
('J-FE-001', 'Frontend Developer', 'React.js, Tailwind CSS', 75),
('J-BE-001', 'Backend Developer', 'Node.js, Express, MySQL', 70),
('J-AI-001', 'AI Engineer', 'LLM, Python, Machine Learning', 80);
